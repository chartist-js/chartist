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
  BarChart,
  LineChart,
  PieChart,
  Svg,
  StepAxis,
  axisUnits,
  findAll,
  getHighLow,
  isNumeric,
  normalizeData,
  safeHasProperty,
  serialMap,
  type ChartHandle,
  type ChartPlugin,
  type ChartRect,
  type Data,
  type Layout,
  type PresetState,
  type NormalizedSeries,
  type AxisLabelContext,
  type PieLabelContext,
  type RoleNode,
  type SceneNode
} from '../index';
import { untyped } from '../chart/types';
import { nonEmptyRange } from '../core/data/range';
import type {
  AnimationEvent,
  AreaDrawEvent,
  AxesDrawEvent,
  BarChartCreatedEvent,
  BarDrawEvent,
  DataEvent,
  LineChartCreatedEvent,
  LineDrawEvent,
  OptionsChangedEvent,
  PieChartCreatedEvent,
  PointDrawEvent,
  SliceDrawEvent,
  SliceLabelDrawEvent
} from '../index';

// With chartist/compat, the 1.x events are typed on every chart handle.
declare module '../chart/types' {
  interface ChartEvents {
    /**
     * 1.x: the chart's data, before the first render (`type: 'initial'`)
     * and after an update with new data (`type: 'update'`). Listeners can
     * change it in place. Needs the {@link compat} plugin.
     */
    data: DataEvent;
    /**
     * 1.x: the responsive options changed, with the options before and
     * after. Needs the {@link compat} plugin.
     */
    optionsChanged: OptionsChangedEvent;
    /**
     * 1.x: an element was drawn: a grid line, label, point, line, area,
     * bar or slice, with its live `element`. Check `type` to narrow it.
     * Needs the {@link compat} plugin.
     */
    draw:
      | PointDrawEvent
      | LineDrawEvent
      | AreaDrawEvent
      | BarDrawEvent
      | SliceDrawEvent
      | SliceLabelDrawEvent
      | AxesDrawEvent;
    /**
     * 1.x: the chart is drawn and in the DOM, after its `draw` events,
     * with the `svg`, the chart area and the axes. Needs the {@link compat}
     * plugin.
     */
    created:
      | LineChartCreatedEvent
      | BarChartCreatedEvent
      | PieChartCreatedEvent;
    /**
     * 1.x: an SMIL animation began, started with `animate()` on an element
     * of the chart, such as the `element` of a `draw` event. Needs the
     * {@link compat} plugin.
     */
    animationBegin: AnimationEvent;
    /**
     * 1.x: an SMIL animation ended, started with `animate()` on an element
     * of the chart. Needs the {@link compat} plugin.
     */
    animationEnd: AnimationEvent;
  }
}

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
  preset?: PresetState<Data, AnyOptions>;
  /** The data object of the last `data` event, and its mutable copy. */
  source?: unknown;
  copy?: Data;
  layout?: Layout;
  svg?: Svg;
  /** 1.x chart instances whose `svg` field follows the chart's. */
  instances: { svg?: Svg }[];
}

const states = new WeakMap<ChartHandle, CompatState>();

/**
 * Where `Svg#animate()` looks for the emitter of an element's animations
 * when it gets none (on the element or an ancestor). The core reads the
 * same global symbol.
 */
const ANIMATION_EMITTER = Symbol.for('chartist.animationEmitter');

/**
 * Where a preset's chart handle holds its preset state from the moment
 * plugins install. The core sets the same global symbol.
 */
const PRESET_STATE = Symbol.for('chartist.presetState');

/**
 * Set on the chart handle, so the chart never hands its renderer the
 * previous render: 1.x draw listeners and plugins expect new elements on
 * every render. The core reads the same global symbol.
 */
const REPLACES_OUTPUT = Symbol.for('chartist.replacesOutput');

const presetOf = (handle: ChartHandle) =>
  (handle as { [PRESET_STATE]?: PresetState<Data, AnyOptions> })[PRESET_STATE];

/** The 1.x class of each preset, for 0.x and 1.x type checks in plugins. */
const CLASSES: Record<string, { prototype: object }> = {
  line: LineChart,
  bar: BarChart,
  pie: PieChart
};

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
function lineAxes(options: AnyOptions, data: Data, chartRect: ChartRect) {
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

/** Sums per index across series, as 1.x `BarChart` stacks them. */
function serialSums(series: NormalizedSeries[]) {
  return serialMap(series, (...values) =>
    values.reduce<{ x: number; y: number }>(
      (sum, value) => ({
        x: sum.x + (safeHasProperty(value, 'x') ? (value.x as number) : 0),
        y: sum.y + (safeHasProperty(value, 'y') ? (value.y as number) : 0)
      }),
      { x: 0, y: 0 }
    )
  );
}

/** The 1.x axes, constructed as 1.x `BarChart.createChart` does. */
function barAxes(options: AnyOptions, data: Data, chartRect: ChartRect) {
  const horizontal = Boolean(options.horizontalBars);
  const valueDimension = horizontal ? 'x' : 'y';
  const labelDimension = horizontal ? 'y' : 'x';
  const normalized = normalizeData(
    data as Data<NormalizedSeries[]>,
    options.reverseData,
    valueDimension,
    true
  );
  const series = normalized.series as NormalizedSeries[];
  const found =
    options.stackBars && options.stackMode !== true && series.length
      ? getHighLow([serialSums(series)], options, valueDimension)
      : getHighLow(series, options, valueDimension);
  // The chart-level bounds win, but can empty the range again (#1057).
  const highLow = nonEmptyRange({
    high: typeof options.high === 'number' ? options.high : found.high,
    low: typeof options.low === 'number' ? options.low : found.low
  });
  const valueOptions = horizontal ? options.axisX : options.axisY;
  const labelOptions = horizontal ? options.axisY : options.axisX;
  const ValueAxis = isLegacyAxisClass(valueOptions.type)
    ? valueOptions.type
    : AutoScaleAxis;
  const valueAxis = new ValueAxis(
    axisUnits[valueDimension],
    series,
    chartRect,
    {
      ...valueOptions,
      highLow,
      referenceValue: 0
    }
  );
  const labelAxis = isLegacyAxisClass(labelOptions.type)
    ? new labelOptions.type(
        axisUnits[labelDimension],
        series,
        chartRect,
        labelOptions
      )
    : new StepAxis(axisUnits[labelDimension], series, chartRect, {
        ticks:
          options.distributeSeries && options.stackBars
            ? normalized.labels.slice(0, 1)
            : normalized.labels
      });
  return horizontal
    ? { axisX: valueAxis, axisY: labelAxis }
    : { axisX: labelAxis, axisY: valueAxis };
}

const AXES: Record<
  string,
  (
    options: AnyOptions,
    data: Data,
    chartRect: ChartRect
  ) => { axisX: unknown; axisY: unknown }
> = {
  line: lineAxes,
  bar: barAxes,
  // Pie charts have no axes.
  pie: () => ({ axisX: undefined, axisY: undefined })
};

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
  const { axisX, axisY } = AXES[state.preset!.kind](options, data, chartRect);
  const axisOf = (dimension?: string) => (dimension === 'x' ? axisX : axisY);
  const wrap = (element: Element) => new Svg(element);
  const draw = (payload: Record<string, unknown>) =>
    untyped(handle).emit('draw', payload);
  const parts = (node: SceneNode) => {
    const element = elementOf(node)!;
    return { element: wrap(element), group: wrap(element.parentElement!) };
  };

  // Axes: per tick its grid line, then its label, in the order the axes
  // appear in the chart (X first for lines, the label axis first for bars).
  const grids = findAll(scene, { role: 'grid' });
  // Only axis labels; pie labels belong to their slice.
  const allLabels = findAll(scene, { role: 'label' });
  const labels = allLabels.filter(
    (n): n is RoleNode<'label'> & { ctx: AxisLabelContext } =>
      n.ctx.kind === 'axis'
  );
  const sliceLabels = allLabels.filter(
    (n): n is RoleNode<'label'> & { ctx: PieLabelContext } =>
      n.ctx.kind === 'pie'
  );
  const order = [
    ...new Set([...grids, ...labels].map(n => n.ctx.axis.dimension))
  ];
  for (const dimension of order) {
    const onAxis = (node: { ctx: { axis: { dimension: string } } }) =>
      node.ctx.axis.dimension === dimension;
    const indexes = [
      ...new Set([...grids, ...labels].filter(onAxis).map(n => n.ctx.index))
    ].sort((a, b) => a - b);
    for (const index of indexes) {
      const grid = grids.find(n => onAxis(n) && n.ctx.index === index);
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
      const label = labels.find(n => onAxis(n) && n.ctx.index === index);
      if (label) {
        const { x, y, width, height } = label.attrs;
        draw({
          type: 'label',
          axis: axisOf(dimension),
          index,
          ...parts(label),
          text: label.ctx.text,
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
    const seriesIndex = series.ctx.seriesIndex;
    const original =
      rawSeries[
        options.reverseData ? rawSeries.length - 1 - seriesIndex : seriesIndex
      ];
    const common = { series: original, seriesIndex, axisX, axisY };
    const children = series.children;
    const slice = children.find(n => n.role === 'slice');
    if (slice) {
      const ctx = slice.ctx;
      draw({
        type: 'slice',
        value: ctx.value,
        totalDataSum: ctx.totalDataSum,
        index: ctx.index,
        meta: ctx.meta,
        series: ctx.series,
        ...parts(slice),
        path: ctx.path.clone(),
        center: ctx.center,
        radius: ctx.radius,
        startAngle: ctx.startAngle,
        endAngle: ctx.endAngle,
        chartRect
      });
      const label = sliceLabels.find(n => n.ctx.index === ctx.index);
      if (label) {
        const labelCtx = label.ctx;
        draw({
          type: 'label',
          index: labelCtx.index,
          ...parts(label),
          text: labelCtx.text,
          chartRect,
          series: labelCtx.series,
          meta: labelCtx.meta,
          x: labelCtx.x,
          y: labelCtx.y
        });
      }
      continue;
    }
    for (const barNode of children.filter(n => n.role === 'bar')) {
      const ctx = barNode.ctx!;
      draw({
        type: 'bar',
        value: ctx.value,
        index: ctx.valueIndex,
        meta: ctx.meta,
        series: ctx.series,
        seriesIndex,
        axisX,
        axisY,
        chartRect,
        ...parts(barNode),
        x1: ctx.x1,
        y1: ctx.y1,
        x2: ctx.x2,
        y2: ctx.y2
      });
    }
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
        path: ctx.path.clone(),
        chartRect,
        index: seriesIndex,
        ...common,
        meta: ctx.meta,
        ...parts(shape)
      });
    }
  }

  // 0.x plugins also read `bounds`, the value axis's scale, which 0.x
  // passed next to the axes (auto scale axes only, as in 0.x).
  const valueAxis = options.horizontalBars ? axisX : axisY;
  untyped(handle).emit(
    'created',
    state.preset!.kind === 'pie'
      ? { chartRect, svg: wrap(svgElement), options }
      : {
          chartRect,
          axisX,
          axisY,
          bounds: (valueAxis as { bounds?: unknown }).bounds,
          svg: wrap(svgElement),
          options
        }
  );
}

/** Turns the 1.x events on for a chart, once. */
function enable(handle: ChartHandle): CompatState {
  const existing = states.get(handle);
  if (existing) {
    return existing;
  }
  const state: CompatState = { instances: [] };
  states.set(handle, state);
  (handle as { [REPLACES_OUTPUT]?: boolean })[REPLACES_OUTPUT] = true;

  handle.on('resolve', ({ config }) => {
    state.preset = config.preset as CompatState['preset'];
    if (config.data !== state.source) {
      // 1.x data handlers mutate the data; they get a copy, and the copy
      // is used from now on (as 1.x keeps its mutated data).
      state.copy = mutableCopy(config.data) as Data;
      untyped(handle).emit('data', {
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
  handle.on('responsive', change =>
    'previousOptions' in change
      ? untyped(handle).emit('optionsChanged', {
          previousOptions: change.previousOptions,
          currentOptions: change.currentOptions
        })
      : undefined
  );
  handle.on('mount', ({ scene, output, elementOf }) => {
    const svg = (output as { svg?: Element }).svg;
    if (!svg) {
      throw new Error('Chartist: the compat plugin requires the DOM renderer');
    }
    state.svg = new Svg(svg);
    // Set before the draw events, so listeners can query the chart.
    for (const instance of state.instances) {
      instance.svg = state.svg;
    }
    // Animations of the chart's elements emit animationBegin and
    // animationEnd on the chart, as 1.x did with the chart's emitter.
    (svg as { [ANIMATION_EMITTER]?: unknown })[ANIMATION_EMITTER] = {
      emit: (event: string, payload: unknown) =>
        untyped(handle).emit(event, payload)
    };
    if (state.preset) {
      emitDrawEvents(handle, state, scene, svg, elementOf);
    }
  });
  return state;
}

/** 1.x `optionsProvider`: the options in effect, after responsive options. */
function optionsProviderOf(getOptions: () => unknown) {
  return {
    getCurrentOptions: getOptions,
    // The preset watches the media queries and stops on `detach()`.
    removeMediaQueryListeners: () => undefined
  };
}

/**
 * A 1.x-style chart object for 1.x plugins on the functional API. For a
 * preset it is an instance of the preset's 1.x class (without running its
 * constructor), so type checks such as `chart instanceof LineChart` hold;
 * for `chart()` compositions a plain object.
 */
function legacyChart(handle: ChartHandle, state: CompatState) {
  const preset = presetOf(handle);
  const chart = {
    get container() {
      return handle.container;
    },
    get data() {
      return state.copy ?? preset?.data;
    },
    get options() {
      return preset?.options;
    },
    get svg() {
      return state.svg;
    },
    eventEmitter: {
      on: (event: string, listener: (payload: unknown) => void) =>
        untyped(handle).on(event, listener),
      off: (event: string, listener?: (payload: unknown) => void) =>
        untyped(handle).off(event, listener),
      emit: (event: string, payload: unknown) =>
        untyped(handle).emit(event, payload)
    },
    optionsProvider: optionsProviderOf(() => preset?.options),
    on(event: string, listener: (payload: unknown) => void) {
      untyped(handle).on(event, listener);
      return chart;
    },
    off(event: string, listener?: (payload: unknown) => void) {
      untyped(handle).off(event, listener);
      return chart;
    },
    update(data?: unknown, options?: unknown, override?: boolean) {
      if (preset) {
        preset.update(data as never, options as never, override);
      } else {
        handle.update(data ? { data: data as never } : {});
      }
      return chart;
    },
    detach() {
      if (preset) {
        preset.detach();
      } else {
        handle.detach();
      }
      return chart;
    }
  };
  // The fields above are own properties, so they shadow the class's.
  const type = preset && CLASSES[preset.kind];
  return type ? Object.setPrototypeOf(chart, type.prototype) : chart;
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
        state.instances.push(chart as { svg?: Svg });
        // The 1.x classes run on a preset and have no options provider;
        // plugins call it for the options in effect.
        const instance = chart as { optionsProvider?: unknown };
        if (!instance.optionsProvider) {
          instance.optionsProvider = optionsProviderOf(
            () => presetOf(handle)?.options
          );
        }
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
 *
 * Add it to `plugins`, of a 1.x class, a preset or `chart()`. The `draw`
 * events come in the 1.x order, right after the chart is in the DOM, so
 * `element` is a live element; then `created`. Animations started with
 * `animate()` on the chart's elements emit `animationBegin` and
 * `animationEnd`. Importing
 * `chartist/compat` also types the 1.x events on every chart handle. It
 * needs the DOM renderer, and the `draw` and `created` events need a
 * chart made by a preset or a 1.x class.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { compat } from 'chartist/compat';
 *
 * const chart = lineChart(
 *   '#chart',
 *   {
 *     labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
 *     series: [[12, 9, 7, 8, 5]]
 *   },
 *   { plugins: [compat] }
 * );
 *
 * // Registered after the first render, so it runs from the next one on.
 * chart.on('draw', data => {
 *   if (data.type === 'point' && data.index === 4) {
 *     data.element.addClass('is-friday');
 *   }
 * });
 * ```
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
 * `svg`, `eventEmitter`, `on`, `off`, `update`, `detach`). You don't need
 * {@link compat} in the list as well.
 *
 * @param plugin The 1.x plugin: a function that gets the chart (and its
 * options)
 * @param options The plugin's options; without them, the plugin is called
 * with the chart only, as in 1.x
 * @example
 * ```ts
 * import { lineChart, type Plugin } from 'chartist';
 * import { fromLegacyPlugin } from 'chartist/compat';
 *
 * // A 1.x plugin: a function that gets the chart and its options.
 * const caption: Plugin = (chart, options) => {
 *   chart.on('created', () => {
 *     chart.container.setAttribute('aria-label', options.text);
 *   });
 * };
 *
 * lineChart(
 *   '#chart',
 *   { series: [[1, 3, 2, 4]] },
 *   { plugins: [fromLegacyPlugin(caption, { text: 'Visitors per week' })] }
 * );
 * ```
 */
export function fromLegacyPlugin(
  plugin: LegacyPlugin,
  options?: unknown
): ChartPlugin {
  return legacyPlugin(plugin, options);
}

// The types of the 1.x events and plugins this plugin turns on.
export type * from './types';
