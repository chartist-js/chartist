/**
 * `lineChart`: the 1.x line chart as a preset over `chart()`. Takes the 1.x
 * arguments and options and renders the 1.x structure.
 */
import type {
  LineChartData,
  LineChartOptions
} from '../charts/LineChart/LineChart.types';
import type { Label } from '../core/types';
import type { ChartConfig, PluginEntry } from '../chart/types';
import type { PhaseListeners } from '../pipeline/types';
import { line, type LineSeriesOptions } from '../layers/line';
import type { AxisFactory, AxisSetup, AxesConfig } from '../scales/axis';
import type { LabelMode } from '../render/measure';
import { presetAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { isNumeric } from '../utils/utils';
import { lineDefaults } from './lineDefaults';
import {
  createPreset,
  gridLayer,
  labelLayer,
  seriesGroup,
  type AxisPresetOptions,
  type PresetAxisOptions,
  type PresetController,
  type PresetHandle,
  type PresetSpec,
  type PresetState,
  type PresetResponsiveOptions
} from './preset';

/**
 * Options of `lineChart`: the 1.x `LineChart` options; axis types may also
 * be v2 axis factories.
 * @experimental
 */
export type LineChartPresetOptions = Omit<
  LineChartOptions,
  'axisX' | 'axisY' | 'plugins' | 'series'
> & {
  /** v2 plugins; convert 1.x plugins with `fromLegacyPlugin`. */
  readonly plugins?: readonly PluginEntry[];
  /**
   * Phase listeners by phase name (or `'*'` for all phases), as `on` in
   * the config of `chart()`. They're registered before the first render,
   * so they see it too.
   */
  readonly on?: PhaseListeners;
  /** Options per series name: only these five apply per series. */
  readonly series?: Readonly<Record<string, LineSeriesOptions>>;
  /** Options of the X axis; its `type` may also be a v2 axis factory. */
  readonly axisX?: PresetAxisOptions &
    Omit<NonNullable<LineChartOptions['axisX']>, 'type'>;
  /** Options of the Y axis; its `type` may also be a v2 axis factory. */
  readonly axisY?: PresetAxisOptions &
    Omit<NonNullable<LineChartOptions['axisY']>, 'type'>;
  /** HTML (1.x) or SVG text labels; default: the renderer's mode. */
  readonly labels?: LabelMode;
};

type Resolved = typeof lineDefaults & LineChartPresetOptions;

/** What the line preset passes to plugins as `ResolvedConfig.preset`. */
export type LinePresetState = PresetState<
  LineChartData,
  LineChartPresetOptions,
  'line'
>;

/** Internal: the line preset with 1.x-style data and option updates. */
export type LineChartController = PresetController<
  LineChartData,
  LineChartPresetOptions
>;

/** The default 1.x X axis: one step per label; `fullWidth` stretches it. */
function labelStepAxis(stretch: boolean): AxisFactory {
  const step = stepAxis();
  return {
    kind: 'step',
    create: context =>
      step.create({
        ...context,
        options: {
          ...context.options,
          ticks: context.labels as Label[],
          stretch
        }
      })
  };
}

function axesConfig(options: Resolved): AxesConfig {
  const { axisX, axisY } = options;
  const x: AxisSetup = {
    ...axisX,
    type: axisX.type ?? labelStepAxis(options.fullWidth)
  };
  const y: AxisSetup =
    axisY.type === undefined
      ? {
          ...axisY,
          type: autoScaleAxis(),
          high: isNumeric(options.high) ? options.high : axisY.high,
          low: isNumeric(options.low) ? options.low : axisY.low
        }
      : { ...axisY, type: axisY.type };
  return { x, y, reverseData: options.reverseData };
}

const lineSpec: PresetSpec<LineChartData, LineChartPresetOptions> = {
  kind: 'line',
  defaults: lineDefaults,
  config(data, preset): ChartConfig {
    const options = preset as Resolved;
    const axisOptions = options as unknown as AxisPresetOptions;
    return {
      data,
      axes: presetAxes(axesConfig(options)),
      padding: options.chartPadding,
      width: options.width,
      height: options.height,
      viewBox: options.viewBox,
      className: options.classNames.chart,
      labels: options.labels,
      layers: [
        gridLayer(axisOptions),
        seriesGroup(
          line({
            lineSmooth: options.lineSmooth,
            showPoint: options.showPoint,
            showLine: options.showLine,
            showArea: options.showArea,
            areaBase: options.areaBase,
            overrides: options.series,
            reverseData: options.reverseData,
            classNames: options.classNames
          })
        ),
        labelLayer(axisOptions)
      ]
    };
  }
};

/** Internal: creates the line preset; used by `lineChart` and `LineChart`. */
export function createLineChart(
  target: string | Element,
  data: LineChartData,
  options: LineChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<LineChartPresetOptions>,
  plugins?: ChartConfig['plugins']
): LineChartController {
  return createPreset(
    lineSpec,
    target,
    data,
    options,
    responsiveOptions,
    plugins ?? options.plugins
  );
}

/**
 * Creates a line chart with the 1.x options and output, rendered
 * synchronously. Plugins must be v2 plugins; convert 1.x plugins with
 * `fromLegacyPlugin` from `chartist/compat`.
 * @experimental
 */
export function lineChart(
  target: string | Element,
  data: LineChartData,
  options: LineChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<LineChartPresetOptions>
): PresetHandle<LineChartPresetOptions> {
  return createLineChart(target, data, options, responsiveOptions).handle;
}
