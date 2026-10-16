/**
 * Responsive entries: `[condition, overrides]` pairs, merged in order when
 * their condition matches. A plain string is a window media query (1.x); a
 * `container()` condition is a CSS container query, evaluated with
 * `Element.matchContainer()` (native or the `match-container` polyfill).
 */

/**
 * A container query condition for a responsive entry, created with
 * {@link container}.
 * @experimental
 */
export interface ContainerCondition {
  /** Always `container`: tells the condition from a media query string. */
  readonly type: 'container';
  /** A `@container` condition, e.g. `(width < 400px)`. */
  readonly query: string;
}

/**
 * When a responsive entry applies: a window media query string, such as
 * `(max-width: 640px)` (as in 1.x), or a {@link container} condition.
 * Media queries are matched in the window of the chart's container, so a
 * chart in an iframe follows the iframe's viewport.
 * @experimental
 */
export type ResponsiveCondition = string | ContainerCondition;

/**
 * A responsive entry: a condition and the overrides that apply while it
 * matches, e.g. `['(max-width: 640px)', { showPoint: false }]`. Matching
 * entries apply in order, so later ones win.
 * @experimental
 */
export type ResponsiveEntry<T> = readonly [ResponsiveCondition, T];

/**
 * Marks a responsive entry as a container query, evaluated against the
 * chart container or an ancestor with a CSS `container-type`. Needs
 * `Element.matchContainer()`; until browsers ship it, load the
 * `match-container` polyfill. Without it, Chartist warns once and ignores
 * container entries; in `toScene()`, they never match.
 *
 * Works in the responsive entries of `chart()` and of the presets.
 *
 * @param query The condition you'd write after `@container` in CSS
 * @example
 * ```ts
 * import 'match-container';
 * import { container, lineChart } from 'chartist';
 *
 * lineChart(
 *   '#chart',
 *   {
 *     labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
 *     series: [[12, 9, 7, 8, 5]]
 *   },
 *   { low: 0 },
 *   [
 *     [
 *       container('(width < 400px)'),
 *       {
 *         showPoint: false,
 *         axisX: { labelTransform: value => String(value)[0] }
 *       }
 *     ]
 *   ]
 * );
 * ```
 * @experimental
 */
export function container(query: string): ContainerCondition {
  return Object.freeze({ type: 'container', query });
}

export function isContainerCondition(
  condition: unknown
): condition is ContainerCondition {
  return (
    typeof condition === 'object' &&
    condition !== null &&
    (condition as ContainerCondition).type === 'container'
  );
}

/** What `matchMedia()` and `matchContainer()` return, as far as we use it. */
interface QueryList {
  readonly matches: boolean;
  addEventListener?(type: 'change', listener: () => void): void;
  removeEventListener?(type: 'change', listener: () => void): void;
}

type MatchContainer = (query: string) => QueryList;

let warned = false;

function warnMissingApi() {
  if (!warned) {
    warned = true;
    // eslint-disable-next-line no-console
    console.warn(
      'Chartist: container() needs Element.matchContainer(); ' +
        'load the match-container polyfill. Container entries are ignored.'
    );
  }
}

/** @internal For tests: shows the missing-API warning again. */
export function resetResponsiveWarning() {
  warned = false;
}

/**
 * Watches the conditions of a {@link ResponsiveSet}'s entries, as its
 * `watch()` returns it: which entries match, and when that changes.
 * @experimental
 */
export interface ResponsiveWatcher {
  /** Indexes of the matching entries, as of the last `check()`. */
  readonly matching: readonly number[];
  /** Re-reads all conditions; true if the matching set changed. */
  check(): boolean;
  /** Stops watching: no more `onChange` calls, and no listeners left. */
  stop(): void;
}

const sameIndexes = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * Watches the conditions of responsive entries. `onChange` runs when the
 * matching set changes through a query list's `change` event, or through a
 * container resize if `observeResize` is set; callers with their own resize
 * handling call `check()` instead.
 */
export function watchResponsive(
  entries: readonly ResponsiveEntry<unknown>[],
  host: Element | undefined,
  onChange: () => void,
  observeResize = false
): ResponsiveWatcher {
  // Media queries are the container's window's, which may be an iframe's.
  const view =
    host?.ownerDocument.defaultView ??
    (typeof window !== 'undefined' ? window : undefined);
  let probe: HTMLElement | undefined;
  const lists: (QueryList | undefined)[] = entries.map(([condition]) => {
    if (!isContainerCondition(condition)) {
      return view?.matchMedia?.(condition);
    }
    if (!host) {
      // No DOM (toScene): container entries never match.
      return undefined;
    }
    const element = host.ownerDocument.createElement('span');
    const match = (element as unknown as { matchContainer?: MatchContainer })
      .matchContainer;
    if (typeof match !== 'function') {
      warnMissingApi();
      return undefined;
    }
    if (!probe) {
      // matchContainer() asks an element about its ancestor containers;
      // the svg is replaced on every render, so a stable probe asks.
      probe = host.appendChild(element);
      probe.className = 'ct-probe';
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText =
        'position:absolute;width:0;height:0;overflow:hidden';
    }
    try {
      return (
        probe as unknown as { matchContainer: MatchContainer }
      ).matchContainer(condition.query);
    } catch (error) {
      probe.remove();
      throw new Error(
        `Chartist: invalid container condition "${condition.query}": ${
          (error as Error).message
        }`
      );
    }
  });

  const read = () =>
    lists.flatMap((list, index) => (list?.matches ? [index] : []));

  const watcher: ResponsiveWatcher & { matching: number[] } = {
    matching: read(),
    check() {
      const next = read();
      if (sameIndexes(next, watcher.matching)) {
        return false;
      }
      watcher.matching = next;
      return true;
    },
    stop() {
      lists.forEach(list => list?.removeEventListener?.('change', onEvent));
      observer?.disconnect();
      probe?.remove();
    }
  };

  function onEvent() {
    if (watcher.check()) {
      onChange();
    }
  }

  lists.forEach(list => list?.addEventListener?.('change', onEvent));
  const Observer = view?.ResizeObserver ?? globalThis.ResizeObserver;
  const observer =
    observeResize && probe && typeof Observer !== 'undefined'
      ? new Observer(onEvent)
      : undefined;
  if (observer && host) {
    observer.observe(host);
  }
  return watcher;
}

/**
 * Responsive entries for `chart()`, with the watcher that evaluates them.
 * Created by `responsive()`, so charts without responsive entries don't
 * bundle the watcher.
 * @experimental
 */
export interface ResponsiveSet<T> {
  /** The entries as given to `responsive()`. */
  readonly entries: readonly ResponsiveEntry<T>[];
  /**
   * Starts watching the entries' conditions; `chart()` calls it. Calls
   * `onChange` when the set of matching entries changes.
   * @param host The chart's container, for container conditions
   * @param onChange Called after the matching entries changed
   */
  watch(host: Element | undefined, onChange: () => void): ResponsiveWatcher;
}

/**
 * Responsive overrides for `chart()`: `[condition, overrides]` entries with
 * a media query string or a `container()` condition. Matching overrides are
 * shallow-merged over the config in order, so later entries win and an
 * override replaces a whole option (e.g. all `layers`).
 *
 * When the matching entries change, the chart emits a `responsive` event
 * with the config before and after, and renders again.
 *
 * @param entries `[condition, overrides]` pairs; the overrides are a
 * partial config: padding, axes, layers, size and the like
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   cartesianAxes,
 *   chart,
 *   line,
 *   responsive,
 *   stepAxis
 * } from 'chartist';
 *
 * const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
 *
 * chart('#chart', {
 *   data: { labels, series: [[12, 9, 7, 8, 5]] },
 *   axes: cartesianAxes([
 *     { id: 'x', side: 'bottom', type: stepAxis(), ticks: labels },
 *     { id: 'y', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [axisGrid(), line({ showArea: true }), axisLabels()],
 *   responsive: responsive([
 *     [
 *       '(max-width: 640px)',
 *       {
 *         padding: 5,
 *         layers: [axisGrid(), line({ showPoint: false }), axisLabels()]
 *       }
 *     ]
 *   ])
 * });
 * ```
 * @experimental
 */
export function responsive<T>(
  entries: readonly ResponsiveEntry<T>[]
): ResponsiveSet<T> {
  return {
    entries,
    watch: (host, onChange) => watchResponsive(entries, host, onChange)
  };
}

/** Merges the overrides of the matching entries over `base`, in order. */
export function applyResponsive<T>(
  base: T,
  entries: readonly ResponsiveEntry<Partial<T>>[] | undefined,
  matching: readonly number[],
  merge: (target: T, overrides: Partial<T>) => T
): T {
  return matching.reduce(
    (result, index) => merge(result, entries![index][1]),
    base
  );
}
