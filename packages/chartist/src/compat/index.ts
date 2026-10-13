/**
 * The compat plugin: 1.x events, `Svg` wrappers and 1.x plugins on v2
 * charts. Opt-in: `plugins: [compat]`, or convert a 1.x plugin with
 * `fromLegacyPlugin()`.
 *
 * Imports only from the package root, so the built `chartist/compat` entry
 * shares the core with `chartist` instead of bundling a copy.
 */
import {
  AutoScaleAxis,
  Svg,
  StepAxis,
  axisUnits,
  findAll,
  isNumeric,
  normalizeData,
  type ChartHandle,
  type ChartPlugin,
  type ChartRect,
  type Data,
  type Layout,
  type LinePresetState,
  type NormalizedSeries,
  type SceneNode
} from '../index';

/** The 1.x events the compat plugin emits. */
const LEGACY_EVENTS = [
  'data',
  'optionsChanged',
  'draw',
  'created',
  'animationBegin',
  'animationEnd'
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyPlugin = (chart: any, options?: any) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOptions = any;

interface CompatState {
  preset?: LinePresetState;
  /** The data object of the last `data` event, and its mutable copy. */
  source?: unknown;
  copy?: Data;
  layout?: Layout;
  svg?: Svg;
}

const states = new WeakMap<ChartHandle, CompatState>();

/** Copies plain arrays and objects; other values are kept by reference. */
function mutableCopy<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(mutableCopy) as T;
  }
  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, mutableCopy(entry)])
      ) as T;
    }
  }
  return value;
}

const isLegacyAxisClass = (
  type: unknown
): type is new (...args: unknown[]) => unknown =>
  typeof type === 'function' &&
  typeof (type as { prototype?: { projectValue?: unknown } }).prototype
    ?.projectValue === 'function';

function chartRectOf(layout: Layout): ChartRect {
  const { area, padding } = layout;
  return {
    x1: area.x1,
    x2: area.x2,
    y1: area.y1,
    y2: area.y2,
    padding,
    width() {
      return this.x2 - this.x1;
    },
    height() {
      return this.y1 - this.y2;
    }
  };
}

/** The 1.x axes, constructed as 1.x `LineChart.createChart` does. */
function legacyAxes(options: AnyOptions, data: Data, chartRect: ChartRect) {
  const normalized = normalizeData(
    data as Data<NormalizedSeries[]>,
    options.reverseData,
    true
  );
  const series = normalized.series as NormalizedSeries[];
  const axisX = isLegacyAxisClass(options.axisX.type)
    ? new options.axisX.type(axisUnits.x, series, chartRect, options.axisX)
    : new StepAxis(axisUnits.x, series, chartRect, {
        ...options.axisX,
        ticks: normalized.labels,
        stretch: options.fullWidth
      });
  const axisY = isLegacyAxisClass(options.axisY.type)
    ? new options.axisY.type(axisUnits.y, series, chartRect, options.axisY)
    : new AutoScaleAxis(axisUnits.y, series, chartRect, {
        ...options.axisY,
        high: isNumeric(options.high) ? options.high : options.axisY.high,
        low: isNumeric(options.low) ? options.low : options.axisY.low
      });
  return { axisX, axisY };
}

/** 1.x `draw` payloads in 1.x order, then `created`. */
function emitDrawEvents(
  handle: ChartHandle,
  state: CompatState,
  scene: SceneNode,
  svgElement: Element,
  elementOf: (node: SceneNode) => Element | undefined
) {
  const options = state.preset?.options as AnyOptions;
  const data = (state.copy ?? state.preset?.data) as Data;
  const chartRect = chartRectOf(state.layout!);
  const { axisX, axisY } = legacyAxes(options, data, chartRect);
  const axisOf = (dimension: string) => (dimension === 'x' ? axisX : axisY);
  const wrap = (element: Element) => new Svg(element);
  const draw = (payload: Record<string, unknown>) =>
    handle.emit('draw', payload);
  const parts = (node: SceneNode) => {
    const element = elementOf(node)!;
    return { element: wrap(element), group: wrap(element.parentElement!) };
  };

  // Axes: per tick its grid line, then its label; X before Y.
  const grids = findAll(scene, { role: 'grid' });
  const labels = findAll(scene, { role: 'label' });
  for (const dimension of ['x', 'y']) {
    const onAxis = (node: SceneNode) =>
      (node.ctx?.axis as { dimension?: string } | undefined)?.dimension ===
      dimension;
    const indexes = [
      ...new Set(
        [...grids, ...labels].filter(onAxis).map(n => n.ctx!.index as number)
      )
    ].sort((a, b) => a - b);
    for (const index of indexes) {
      const grid = grids.find(n => onAxis(n) && n.ctx!.index === index);
      if (grid) {
        const { x1, y1, x2, y2 } = grid.attrs;
        draw({
          type: 'grid',
          axis: axisOf(dimension),
          index,
          ...parts(grid),
          x1,
          y1,
          x2,
          y2
        });
      }
      const label = labels.find(n => onAxis(n) && n.ctx!.index === index);
      if (label) {
        const { x, y, width, height } = label.attrs;
        draw({
          type: 'label',
          axis: axisOf(dimension),
          index,
          ...parts(label),
          text: label.ctx!.text,
          x,
          y,
          width,
          height
        });
      }
    }
  }
  for (const background of findAll(scene, { role: 'gridBackground' })) {
    draw({ type: 'gridBackground', ...parts(background) });
  }

  // Series: points, then the line, then the areas in creation order.
  const rawSeries = (data.series ?? []) as unknown[];
  for (const series of findAll(scene, { role: 'series' })) {
    const seriesIndex = series.ctx!.seriesIndex as number;
    const original =
      rawSeries[
        options.reverseData ? rawSeries.length - 1 - seriesIndex : seriesIndex
      ];
    const common = { series: original, seriesIndex, axisX, axisY };
    const children = series.children;
    for (const point of children.filter(n => n.role === 'point')) {
      const ctx = point.ctx!;
      draw({
        type: 'point',
        value: ctx.value,
        index: ctx.valueIndex,
        meta: ctx.meta,
        ...common,
        ...parts(point),
        x: ctx.x,
        y: ctx.y,
        chartRect
      });
    }
    const shapes = [
      ...children.filter(n => n.role === 'line'),
      // Areas are inserted first, so the DOM order is the reverse.
      ...children.filter(n => n.role === 'area').reverse()
    ];
    for (const shape of shapes) {
      const ctx = shape.ctx!;
      draw({
        type: shape.role,
        values: ctx.values,
        path: (ctx.path as { clone(): unknown }).clone(),
        chartRect,
        index: seriesIndex,
        ...common,
        meta: ctx.meta,
        ...parts(shape)
      });
    }
  }

  handle.emit('created', {
    chartRect,
    axisX,
    axisY,
    svg: wrap(svgElement),
    options
  });
}

/** Turns the 1.x events on for a chart, once. */
function enable(handle: ChartHandle): CompatState {
  const existing = states.get(handle);
  if (existing) {
    return existing;
  }
  const state: CompatState = {};
  states.set(handle, state);

  handle.on('resolve', ({ config }) => {
    state.preset = config.preset as LinePresetState | undefined;
    if (config.data !== state.source) {
      // 1.x data handlers mutate the data; they get a copy, and the copy
      // is used from now on (as 1.x keeps its mutated data).
      state.copy = mutableCopy(config.data) as Data;
      handle.emit('data', {
        type: state.source === undefined ? 'initial' : 'update',
        data: state.copy
      });
      state.source = config.data;
    }
    return { config: { ...config, data: state.copy as typeof config.data } };
  });
  handle.on('layout', layout => {
    state.layout = layout;
  });
  handle.on('responsive', ({ previousOptions, currentOptions }) =>
    handle.emit('optionsChanged', { previousOptions, currentOptions })
  );
  handle.on('mount', ({ scene, output, elementOf }) => {
    const svg = (output as { svg?: Element }).svg;
    if (!svg) {
      throw new Error('Chartist: the compat plugin requires the DOM renderer');
    }
    state.svg = new Svg(svg);
    if (state.preset) {
      emitDrawEvents(handle, state, scene, svg, elementOf);
    }
  });
  return state;
}

/** A 1.x-style chart object for 1.x plugins on the functional API. */
function legacyChart(handle: ChartHandle, state: CompatState) {
  const chart = {
    get container() {
      return handle.container;
    },
    get data() {
      return state.copy ?? state.preset?.data;
    },
    get options() {
      return state.preset?.options;
    },
    get svg() {
      return state.svg;
    },
    eventEmitter: {
      on: (event: string, listener: (payload: unknown) => void) =>
        handle.on(event, listener),
      off: (event: string, listener?: (payload: unknown) => void) =>
        handle.off(event, listener),
      emit: (event: string, payload: unknown) => handle.emit(event, payload)
    },
    on(event: string, listener: (payload: unknown) => void) {
      handle.on(event, listener);
      return chart;
    },
    off(event: string, listener?: (payload: unknown) => void) {
      handle.off(event, listener);
      return chart;
    },
    update(data?: unknown, options?: unknown, override?: boolean) {
      if (state.preset) {
        state.preset.update(data as never, options as never, override);
      } else {
        handle.update(data ? { data: data as never } : {});
      }
      return chart;
    },
    detach() {
      if (state.preset) {
        state.preset.detach();
      } else {
        handle.detach();
      }
      return chart;
    }
  };
  return chart;
}

/**
 * Runs a 1.x plugin function as a v2 plugin, with the given chart object.
 * Used by the 1.x chart classes, which pass themselves.
 */
function legacyPlugin(
  plugin: LegacyPlugin,
  options?: unknown,
  chart?: unknown
): ChartPlugin {
  return {
    name: plugin.name || 'legacy-plugin',
    provides: LEGACY_EVENTS,
    install(handle) {
      const state = enable(handle);
      if (chart) {
        // A 1.x chart instance: keep its `svg` field current, as 1.x did.
        handle.on('mount', () => {
          (chart as { svg?: Svg }).svg = state.svg;
        });
      }
      const chartObject = chart ?? legacyChart(handle, state);
      // As 1.x: plugins without options are called with the chart only.
      if (options === undefined) {
        plugin(chartObject);
      } else {
        plugin(chartObject, options);
      }
    }
  };
}

/**
 * The compat plugin. Restores the 1.x events (`data`, `optionsChanged`,
 * `draw`, `created`, `animationBegin`, `animationEnd`) with 1.x payloads.
 * With it, the 1.x chart classes also run 1.x plugin functions.
 */
export const compat: ChartPlugin & { legacyPlugin: typeof legacyPlugin } = {
  name: 'compat',
  provides: LEGACY_EVENTS,
  install: handle => void enable(handle),
  legacyPlugin
};

/**
 * Converts a 1.x plugin function into a v2 plugin for `chart()` and the
 * preset functions. It turns the 1.x events on for the chart and calls the
 * plugin with a 1.x-style chart object (`container`, `data`, `options`,
 * `svg`, `eventEmitter`, `on`, `off`, `update`, `detach`).
 */
export function fromLegacyPlugin(
  plugin: LegacyPlugin,
  options?: unknown
): ChartPlugin {
  return legacyPlugin(plugin, options);
}
