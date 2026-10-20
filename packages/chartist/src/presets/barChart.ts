/**
 * `barChart`: the 1.x bar chart as a preset over `chart()`. Takes the 1.x
 * arguments and options and renders the 1.x structure.
 */
import type { Renderer } from '../render/types';
import type {
  BarChartData,
  BarChartOptions
} from '../charts/BarChart/BarChart.types';
import type { ChartConfig, PluginEntry } from '../chart/types';
import type { PhaseListeners } from '../pipeline/types';
import { getHighLow } from '../core/data/highLow';
import { nonEmptyRange } from '../core/data/range';
import type { Label, Options } from '../core/types';
import { bar } from '../layers/bar';
import type { AxisFactory, AxisSetup, AxesConfig } from '../scales/axis';
import type { LabelMode } from '../render/measure';
import { presetAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { isLegacyAxisClass, legacyAxis } from '../scales/legacy';
import { barDefaults } from './barDefaults';
import {
  createPreset,
  presetConfig,
  gridLayer,
  labelLayer,
  seriesGroup,
  type AxisPresetOptions,
  type PresetAxisOptions,
  type PresetController,
  type PresetLayers,
  type PresetHandle,
  type PresetSpec,
  type PresetState,
  type PresetResponsiveOptions
} from './preset';

/**
 * Options of `barChart`: the 1.x `BarChart` options; axis types may also be
 * v2 axis factories.
 */
export type BarChartPresetOptions = Omit<
  BarChartOptions,
  'axisX' | 'axisY' | 'plugins' | 'stackMode'
> & {
  /** v2 plugins; convert 1.x plugins with `fromLegacyPlugin`. */
  readonly plugins?: readonly PluginEntry[];
  /**
   * Phase listeners by phase name (or `'*'` for all phases), as `on` in
   * the config of `chart()`. They're registered before the first render,
   * so they see it too.
   */
  readonly on?: PhaseListeners;
  /**
   * Turns the scene into output, as `renderer` in the config of
   * `chart()`: the DOM renderer by default, or `liveDomRenderer()` from
   * `chartist/live` for a chart that changes in place on updates. It can't
   * change after the chart is created.
   */
  readonly renderer?: Renderer;
  /** Extra layers below or above the chart's bars. */
  readonly layers?: PresetLayers;
  /**
   * How stacked bars stack: `accumulate` (default), `accumulate-relative`
   * (positives up, negatives down), or `overlap` (also `true`): every bar
   * from zero.
   */
  readonly stackMode?:
    | 'accumulate'
    | 'accumulate-relative'
    | 'overlap'
    | boolean;
  /** Options of the X axis; its `type` may also be a v2 axis factory. */
  readonly axisX?: PresetAxisOptions &
    Omit<NonNullable<BarChartOptions['axisX']>, 'type'>;
  /** Options of the Y axis; its `type` may also be a v2 axis factory. */
  readonly axisY?: PresetAxisOptions &
    Omit<NonNullable<BarChartOptions['axisY']>, 'type'>;
  /** HTML (1.x) or SVG text labels; default: the renderer's mode. */
  readonly labels?: LabelMode;
};

type Resolved = Omit<typeof barDefaults, 'stackMode'> & BarChartPresetOptions;

/** What the bar preset passes to plugins as `ResolvedConfig.preset`. */
export type BarPresetState = PresetState<
  BarChartData,
  BarChartPresetOptions,
  'bar'
>;

export type BarChartController = PresetController<
  BarChartData,
  BarChartPresetOptions
>;

/**
 * The 1.x value axis: bounds from the data and the stacks the bar layer
 * reports, chart-level `high`/`low`, and `referenceValue: 0`.
 */
function valueAxis(
  options: Resolved,
  type: AxisSetup['type'] | undefined
): AxisFactory {
  const dimension = options.horizontalBars ? 'x' : 'y';
  const inner = !type
    ? autoScaleAxis()
    : isLegacyAxisClass(type)
      ? legacyAxis(type)
      : type;
  return {
    // The kind, and a transform such as a log axis's.
    ...inner,
    create(context) {
      const found = getHighLow(
        context.series,
        options as Options,
        dimension,
        context.extent
      );
      // The chart-level bounds win, but can empty the range again (#1057).
      const highLow = nonEmptyRange({
        high: typeof options.high === 'number' ? options.high : found.high,
        low: typeof options.low === 'number' ? options.low : found.low
      });
      return inner.create({
        ...context,
        options: { ...context.options, highLow, referenceValue: 0 }
      });
    }
  };
}

/** The default 1.x label axis: one step per label (only the first for stacked distributed bars). */
function labelAxis(options: Resolved): AxisFactory {
  const step = stepAxis();
  return {
    kind: 'step',
    create: context =>
      step.create({
        ...context,
        options: {
          ticks: (options.distributeSeries && options.stackBars
            ? context.labels.slice(0, 1)
            : context.labels) as Label[]
        }
      })
  };
}

function axesConfig(options: Resolved): AxesConfig {
  const horizontal = options.horizontalBars;
  const value = horizontal ? options.axisX : options.axisY;
  const label = horizontal ? options.axisY : options.axisX;
  const valueSetup: AxisSetup = {
    ...value,
    type: valueAxis(options, value.type)
  };
  const labelSetup: AxisSetup = {
    ...label,
    type: label.type ?? labelAxis(options)
  };
  return {
    x: horizontal ? valueSetup : labelSetup,
    y: horizontal ? labelSetup : valueSetup,
    reverseData: options.reverseData,
    normalize: { multi: horizontal ? 'x' : 'y', distributed: true }
  };
}

const barSpec: PresetSpec<BarChartData, BarChartPresetOptions> = {
  kind: 'bar',
  defaults: barDefaults,
  config(data, preset): ChartConfig {
    const options = preset as Resolved;
    const axisOptions = options as unknown as AxisPresetOptions;
    // 1.x draws the label axis grid and labels before the value axis.
    const order = options.horizontalBars
      ? (['y', 'x'] as const)
      : (['x', 'y'] as const);
    const layer = bar({
      horizontalBars: options.horizontalBars,
      stackBars: options.stackBars,
      stackMode: options.stackMode,
      seriesBarDistance: options.seriesBarDistance,
      distributeSeries: options.distributeSeries,
      reverseData: options.reverseData,
      classNames: options.classNames
    });
    // As 1.x, `overlap` keeps the axis at the stacked sums, though its
    // bars all start at zero; only `true` fits the axis to the values.
    const extentOf =
      options.stackMode === 'overlap'
        ? bar({
            horizontalBars: options.horizontalBars,
            stackBars: options.stackBars
          })
        : layer;
    const bars = { ...seriesGroup(layer), extent: extentOf.extent };
    const { below = [], above = [] } = options.layers ?? {};
    return {
      data,
      axes: presetAxes(axesConfig(options)),
      padding: options.chartPadding,
      width: options.width,
      height: options.height,
      viewBox: options.viewBox,
      className:
        options.classNames.chart +
        (options.horizontalBars ? ` ${options.classNames.horizontalBars}` : ''),
      labels: options.labels,
      layers: [
        gridLayer(axisOptions, order),
        ...below,
        bars,
        ...above,
        labelLayer(
          {
            ...axisOptions,
            labelKind: options.horizontalBars ? 'horizontalBar' : 'bar'
          },
          order
        )
      ]
    };
  }
};

/**
 * Builds the chart config that `barChart()` renders for the data and
 * options, without a container: the bar layer with its axes, grid and labels, horizontal or stacked as the options say. Pass it to `toScene()` to render
 * the preset chart with another renderer. Responsive options and the
 * inline size style of the root svg are left out; both need a container.
 */
export function barChartConfig(
  data: BarChartData,
  options: BarChartPresetOptions = {}
): ChartConfig {
  return presetConfig(barSpec, data, options);
}

/** Internal: creates the bar preset; used by `barChart` and `BarChart`. */
export function createBarChart(
  target: string | Element,
  data: BarChartData,
  options: BarChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<BarChartPresetOptions>,
  plugins?: ChartConfig['plugins']
): BarChartController {
  return createPreset(
    barSpec,
    target,
    data,
    options,
    responsiveOptions,
    plugins ?? options.plugins
  );
}

/**
 * Creates a bar chart with the 1.x options and output, rendered
 * synchronously. Plugins must be v2 plugins; convert 1.x plugins with
 * `fromLegacyPlugin` from `chartist/compat`.
 */
export function barChart(
  target: string | Element,
  data: BarChartData,
  options: BarChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<BarChartPresetOptions>
): PresetHandle<BarChartPresetOptions> {
  return createBarChart(target, data, options, responsiveOptions).handle;
}
