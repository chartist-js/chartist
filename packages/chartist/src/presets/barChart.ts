/**
 * `barChart`: the 1.x bar chart as a preset over `chart()`. Takes the 1.x
 * arguments and options and renders the 1.x structure.
 */
import type {
  BarChartData,
  BarChartOptions
} from '../charts/BarChart/BarChart.types';
import type { ChartConfig, ChartHandle } from '../chart/types';
import { getHighLow } from '../core/data/highLow';
import type { Label, Options, ResponsiveOptions } from '../core/types';
import { bar, getSerialSums } from '../layers/bar';
import type { AxisFactory, AxisSetup, AxesConfig } from '../scales/axis';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { isLegacyAxisClass, legacyAxis } from '../scales/legacy';
import { barDefaults } from './barDefaults';
import {
  createPreset,
  gridLayer,
  labelLayer,
  seriesGroup,
  type AxisPresetOptions,
  type PresetAxisOptions,
  type PresetController,
  type PresetSpec,
  type PresetState
} from './preset';

/**
 * Options of `barChart`: the 1.x `BarChart` options; axis types may also be
 * v2 axis factories.
 * @experimental
 */
export type BarChartPresetOptions = Omit<BarChartOptions, 'axisX' | 'axisY'> & {
  readonly axisX?: PresetAxisOptions &
    Omit<NonNullable<BarChartOptions['axisX']>, 'type'>;
  readonly axisY?: PresetAxisOptions &
    Omit<NonNullable<BarChartOptions['axisY']>, 'type'>;
};

type Resolved = typeof barDefaults & BarChartPresetOptions;

/** What the bar preset passes to plugins as `ResolvedConfig.preset`. */
export type BarPresetState = PresetState<BarChartData, BarChartPresetOptions>;

export type BarChartController = PresetController<
  BarChartData,
  BarChartPresetOptions
>;

/**
 * The 1.x value axis: bounds from the data (stacked sums when stacking),
 * chart-level `high`/`low`, and `referenceValue: 0`.
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
    kind: inner.kind,
    create(context) {
      const series = context.series;
      const highLow =
        options.stackBars &&
        (options.stackMode as unknown) !== true &&
        series.length
          ? getHighLow([getSerialSums(series)], options as Options, dimension)
          : getHighLow(series, options as Options, dimension);
      if (typeof options.high === 'number') {
        highLow.high = options.high;
      }
      if (typeof options.low === 'number') {
        highLow.low = options.low;
      }
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
    return {
      data,
      axes: cartesianAxes(axesConfig(options)),
      padding: options.chartPadding,
      width: options.width,
      height: options.height,
      viewBox: options.viewBox,
      className:
        options.classNames.chart +
        (options.horizontalBars ? ` ${options.classNames.horizontalBars}` : ''),
      layers: [
        gridLayer(axisOptions, order),
        seriesGroup(
          bar({
            horizontalBars: options.horizontalBars,
            stackBars: options.stackBars,
            stackMode: options.stackMode,
            seriesBarDistance: options.seriesBarDistance,
            distributeSeries: options.distributeSeries,
            reverseData: options.reverseData,
            classNames: options.classNames
          })
        ),
        labelLayer(axisOptions, order)
      ]
    };
  }
};

/** Internal: creates the bar preset; used by `barChart` and `BarChart`. */
export function createBarChart(
  target: string | Element,
  data: BarChartData,
  options: BarChartPresetOptions = {},
  responsiveOptions?: ResponsiveOptions<BarChartPresetOptions>,
  plugins?: ChartConfig['plugins']
): BarChartController {
  return createPreset(
    barSpec,
    target,
    data,
    options,
    responsiveOptions,
    plugins ?? (options.plugins as ChartConfig['plugins'])
  );
}

/**
 * Creates a bar chart with the 1.x options and output, rendered
 * synchronously. Plugins must be v2 plugins; convert 1.x plugins with
 * `fromLegacyPlugin` from `chartist/compat`.
 * @experimental
 */
export function barChart(
  target: string | Element,
  data: BarChartData,
  options: BarChartPresetOptions = {},
  responsiveOptions?: ResponsiveOptions<BarChartPresetOptions>
): ChartHandle {
  return createBarChart(target, data, options, responsiveOptions).handle;
}
