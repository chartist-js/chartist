/**
 * Test helpers for rendering charts through the public API in jsdom.
 * jsdom has no layout, so SVG elements report a fixed 500 × 500 size,
 * as in the 1.x unit tests.
 */
import type { BaseChart } from 'chartist';

const SIZE = 500;
// Read lazily, so this module also loads in the Node environment.
let originalRect: typeof SVGElement.prototype.getBoundingClientRect;

export function mockLayout() {
  originalRect ??= SVGElement.prototype.getBoundingClientRect;
  SVGElement.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: SIZE,
      height: SIZE,
      top: 0,
      right: SIZE,
      bottom: SIZE,
      left: 0
    }) as DOMRect;
  Object.defineProperties(SVGElement.prototype, {
    clientWidth: { configurable: true, get: () => SIZE },
    clientHeight: { configurable: true, get: () => SIZE }
  });
}

export function restoreLayout() {
  const ElementPrototype = Object.getPrototypeOf(SVGElement.prototype);
  SVGElement.prototype.getBoundingClientRect = originalRect;
  Object.defineProperties(SVGElement.prototype, {
    clientWidth: Object.getOwnPropertyDescriptor(
      ElementPrototype,
      'clientWidth'
    )!,
    clientHeight: Object.getOwnPropertyDescriptor(
      ElementPrototype,
      'clientHeight'
    )!
  });
}

/** Adds an empty chart container to the document. */
export function container(className = 'ct-chart') {
  const element = document.createElement('div');
  element.className = className;
  document.body.appendChild(element);
  return element;
}

const charts = new Set<BaseChart>();

/** Detaches every chart passed to created(), so none reacts to later events. */
export function detachAll() {
  charts.forEach(chart => chart.detach());
  charts.clear();
}

/** Resolves on the chart's next `created` event. */
export function created<T = unknown>(chart: BaseChart): Promise<T> {
  charts.add(chart);
  return new Promise(resolve => {
    const listener = (event: T) => {
      chart.off('created', listener);
      resolve(event);
    };
    chart.on('created', listener);
  });
}

/** Records every event a chart emits, in order. */
export function recordEvents(chart: BaseChart) {
  const events: { name: string; data: any }[] = [];
  chart.on('*', (name: string, data: unknown) => events.push({ name, data }));
  return events;
}

/** The `class` attribute of each element, in document order. */
export function classesOf(root: ParentNode, selector: string) {
  return Array.from(root.querySelectorAll(selector), el =>
    el.getAttribute('class')
  );
}

/**
 * Replaces window.matchMedia with queries whose match state the test
 * controls. setMatches() fires `change` like a real MediaQueryList.
 */
export function mockMedia(initiallyMatching: string[] = []) {
  const matching = new Set(initiallyMatching);
  const listeners = new Map<string, Set<(event: object) => void>>();
  const original = window.matchMedia;

  window.matchMedia = (query: string) =>
    ({
      media: query,
      get matches() {
        return matching.has(query);
      },
      addEventListener(_type: string, listener: (event: object) => void) {
        if (!listeners.has(query)) {
          listeners.set(query, new Set());
        }
        listeners.get(query)!.add(listener);
      },
      removeEventListener(_type: string, listener: (event: object) => void) {
        listeners.get(query)?.delete(listener);
      }
    }) as unknown as MediaQueryList;

  return {
    setMatches(query: string, matches: boolean) {
      if (matches) {
        matching.add(query);
      } else {
        matching.delete(query);
      }
      listeners
        .get(query)
        ?.forEach(listener =>
          listener({ type: 'change', matches, media: query })
        );
    },
    listenerCount(query: string) {
      return listeners.get(query)?.size ?? 0;
    },
    restore() {
      window.matchMedia = original;
    }
  };
}
