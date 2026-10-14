import type { PipelineOptions } from '../pipeline/phases';
import type {
  AllPhasesListener,
  PhaseListener,
  PhaseListeners,
  PhaseName
} from '../pipeline/types';
import type { Renderer } from '../render/types';
import type { ResponsiveSet } from '../responsive/responsive';

/**
 * The custom events a chart can emit, by name, with their payloads. The
 * core emits only `responsive`. A plugin that emits events of its own
 * declares them here (TypeScript merges your declaration into Chartist's),
 * so `on()`, `off()` and `emit()` check the names and payloads:
 *
 * ```ts
 * declare module 'chartist' {
 *   interface ChartEvents {
 *     'legend:click': { readonly seriesIndex: number };
 *   }
 * }
 * ```
 *
 * `chartist/compat` declares the 1.x events (`draw`, `created`, …).
 * @experimental
 */
export interface ChartEvents {
  /**
   * Responsive entries changed which overrides apply: the config before
   * and after (`chart()`), or the options before and after (presets).
   */
  responsive:
    | {
        readonly previousConfig: ChartConfig;
        readonly currentConfig: ChartConfig;
      }
    | { readonly previousOptions: unknown; readonly currentOptions: unknown };
}

/**
 * The name of a custom event: a key of {@link ChartEvents}. Plugins list
 * the names they emit in `provides`.
 */
export type CustomEventName = keyof ChartEvents & string;

/**
 * A plugin: a name and an `install` function that registers listeners on
 * the chart. Plugins go into `plugins`, in the config of {@link chart} or
 * the options of the presets. They install in order, so with two
 * listeners on the same event, the earlier plugin's runs first.
 *
 * For options, write a function that takes them and returns the plugin, or
 * read them from the second argument of `install` and pass the plugin
 * with {@link withOptions}.
 *
 * @example
 * ```ts
 * import { barChart, type ChartPlugin } from 'chartist';
 *
 * // Bars at or above the limit get the class ct-over.
 * const threshold = (limit: number): ChartPlugin => ({
 *   name: 'threshold',
 *   install(chart) {
 *     chart.on('compose', current => {
 *       if (current.role !== 'bar') {
 *         return;
 *       }
 *       const { value } = current.ctx;
 *       const y =
 *         typeof value === 'number'
 *           ? value
 *           : value && 'y' in value
 *             ? value.y
 *             : undefined;
 *       return y !== undefined && y >= limit
 *         ? current.addClass('ct-over')
 *         : undefined;
 *     });
 *   }
 * });
 *
 * barChart('#chart', { series: [[5, 4, 3, 7]] }, { plugins: [threshold(5)] });
 * ```
 * @experimental
 */
export interface ChartPlugin<TOptions = unknown> {
  /** Names the plugin. Prefix your custom events with it to keep them apart. */
  readonly name: string;
  /**
   * The custom events this plugin emits with `chart.emit()`, each declared
   * in {@link ChartEvents}. They're known before any plugin installs, so
   * another plugin may listen to them.
   */
  readonly provides?: readonly CustomEventName[];
  /**
   * Sets the plugin up: runs once, before the first render, with the
   * chart's handle. Listeners registered here stay for every later render,
   * after updates and resizes too.
   * @param chart The chart's handle, to listen to events and emit them.
   * @param options The options of a `[plugin, options]` entry, if any.
   */
  install(chart: ChartHandle, options?: TOptions): void;
}

/**
 * A plugin paired with its options, as {@link withOptions} creates it.
 * `install` receives the options as its second argument.
 */
export type PluginWithOptions<TOptions = unknown> = readonly [
  ChartPlugin<TOptions>,
  TOptions
];

/**
 * An entry of a chart's `plugins`: a plugin, or a plugin with its options.
 * Prefer {@link withOptions} (it checks the options) or a function that
 * returns a plugin over a bare `[plugin, options]` pair. A 1.x plugin (a
 * plain function) throws; convert it with `fromLegacyPlugin()` from
 * `chartist/compat`.
 */
export type PluginEntry =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ChartPlugin<any> | PluginWithOptions<any>;

/**
 * The config of {@link chart}: the data, the layers that draw it and the
 * axes they draw on, plus size, padding, plugins and listeners.
 *
 * Without `axes`, layers draw into the whole chart area; the pie layer
 * needs `coordinates: 'polar'`. {@link toScene} takes the same config.
 * @experimental
 */
export interface ChartConfig extends PipelineOptions {
  /**
   * Plugins to install before the first render, in order: plugins, or
   * plugins with their options from {@link withOptions}.
   */
  readonly plugins?: readonly PluginEntry[];
  /**
   * Phase listeners by phase name (or `'*'` for all phases). They're
   * registered before the first render, so they see it too.
   */
  readonly on?: PhaseListeners;
  /** Turns the scene into output; the DOM renderer by default. */
  readonly renderer?: Renderer;
  /**
   * Overrides that apply while their condition matches, created with
   * `responsive([...])`: entries of a media query string or a
   * `container()` condition, and a partial config. The chart renders again
   * when the matching entries change.
   */
  readonly responsive?: ResponsiveSet<ChartOverrides>;
}

/**
 * The part of a {@link ChartConfig} that responsive entries can override:
 * everything but `responsive`, `plugins`, `on` and `renderer`. The
 * matching entries merge over the config in order, shallowly.
 * @experimental
 */
export type ChartOverrides = Partial<
  Omit<ChartConfig, 'responsive' | 'plugins' | 'on' | 'renderer'>
>;

/**
 * The handle {@link chart} returns: update or remove the chart, and listen
 * to its events. Plugins get the same handle in `install`. The methods
 * other than `destroy` and `emit` return the handle, so calls chain.
 * @experimental
 */
export interface ChartHandle {
  /** The element the chart renders into (undefined in `toScene`). */
  readonly container?: Element;
  /**
   * Shallow-merges the changes into the config and renders again. Plugins
   * and listeners stay; `plugins` and `on` can't change.
   */
  update(config: Partial<Omit<ChartConfig, 'plugins' | 'on'>>): ChartHandle;
  /**
   * Stops reacting to container size changes (and media queries in
   * presets). The output and the listeners stay.
   */
  detach(): ChartHandle;
  /** Detaches, removes the output and clears all listeners. */
  destroy(): void;
  /**
   * Emits a custom event (declared in {@link ChartEvents}), e.g. from a
   * plugin. Phase names are reserved: emitting one throws.
   */
  emit<K extends CustomEventName>(name: K, payload: ChartEvents[K]): void;
  /**
   * Listens to a phase event, which fires on every render. Listeners of
   * `resolve` to `scene` may return a new payload to change what's drawn;
   * `compose` listeners may return `null` to drop a node.
   */
  on<K extends PhaseName>(name: K, listener: PhaseListener<K>): ChartHandle;
  /** Listens to every phase event, with the phase name and its payload. */
  on(name: '*', listener: AllPhasesListener): ChartHandle;
  /** Listens to a custom event, declared in {@link ChartEvents}. */
  on<K extends CustomEventName>(
    name: K,
    listener: (payload: ChartEvents[K]) => void
  ): ChartHandle;
  /**
   * Removes a phase listener. Without a listener, removes every listener
   * of the phase, plugins' too.
   */
  off<K extends PhaseName>(name: K, listener?: PhaseListener<K>): ChartHandle;
  /** Removes a listener of all phases, or all of them without a listener. */
  off(name: '*', listener?: AllPhasesListener): ChartHandle;
  /** Removes a custom event listener, or all of the event's listeners. */
  off<K extends CustomEventName>(
    name: K,
    listener?: (payload: ChartEvents[K]) => void
  ): ChartHandle;
}

/**
 * Pairs a plugin with its options for a chart's `plugins`, and checks the
 * options against the plugin's options type. `install` receives them as
 * its second argument.
 *
 * @example
 * ```ts
 * import { lineChart, withOptions, type ChartPlugin } from 'chartist';
 *
 * const lastPoint: ChartPlugin<{ className: string }> = {
 *   name: 'last-point',
 *   install(chart, options) {
 *     chart.on('compose', current => {
 *       if (current.role !== 'series') {
 *         return;
 *       }
 *       const last = current.children.at(-1);
 *       return last && options
 *         ? current.replace(last, last.addClass(options.className))
 *         : undefined;
 *     });
 *   }
 * };
 *
 * lineChart(
 *   '#chart',
 *   { series: [[1, 3, 2, 5]] },
 *   { plugins: [withOptions(lastPoint, { className: 'ct-last' })] }
 * );
 * ```
 * @experimental
 */
export function withOptions<TOptions>(
  plugin: ChartPlugin<TOptions>,
  options: TOptions
): PluginWithOptions<TOptions> {
  return [plugin, options];
}

/**
 * The handle without event typing, for code that routes event names it
 * doesn't know (the 1.x chart classes, compat). Internal.
 */
export interface UntypedEvents {
  on(name: string, listener: (payload: unknown) => void): unknown;
  off(name: string, listener?: (payload: unknown) => void): unknown;
  emit(name: string, payload?: unknown): void;
}

/** The same handle, seen without event typing. Internal. */
export const untyped = (handle: ChartHandle): UntypedEvents =>
  handle as unknown as UntypedEvents;
