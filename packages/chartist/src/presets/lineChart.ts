/**
 * `lineChart`: the 1.x line chart as a preset over `chart()`. Takes the 1.x
 * arguments and options and renders the 1.x structure.
 */
import type { Renderer } from '../render/types';
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
 * Options of `lineChart`: the 1.x `LineChart` options; axis types may also
 * be v2 axis factories.
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
  /**
   * Turns the scene into output, as `renderer` in the config of
   * `chart()`: the DOM renderer by default, or `liveDomRenderer()` from
   * `chartist/live` for a chart that changes in place on updates. It can't
   * change after the chart is created.
   */
  readonly renderer?: Renderer;
  /** Extra layers below or above the chart's lines. */
  readonly layers?: PresetLayers;
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
          low: isNumeric(options.low) ? options.low : axisY.low,
          // As for bars, the axis's own reference value wins.
          referenceValue: axisY.referenceValue ?? options.referenceValue
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
    const { below = [], above = [] } = options.layers ?? {};
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
        ...below,
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
        ...above,
        labelLayer(axisOptions)
      ]
    };
  }
};

/**
 * Builds the chart config that `lineChart()` renders for the data and
 * options, without a container: the line layer with its axes, grid and labels. Pass it to `toScene()` to render
 * the preset chart with another renderer. Responsive options and the
 * inline size style of the root svg are left out; both need a container.
 * @example
 * ```ts
 * import { lineChartConfig } from 'chartist';
 * import { renderToString, toScene } from 'chartist/server';
 *
 * const config = lineChartConfig(
 *   { labels: ['Mon', 'Tue', 'Wed'], series: [[5, 2, 4]] },
 *   { showArea: true }
 * );
 * export const svg = renderToString(
 *   toScene(config, { width: 600, height: 300 })
 * );
 * ```
 */
export function lineChartConfig(
  data: LineChartData,
  options: LineChartPresetOptions = {}
): ChartConfig {
  return presetConfig(lineSpec, data, options);
}

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
 */
export function lineChart(
  target: string | Element,
  data: LineChartData,
  options: LineChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<LineChartPresetOptions>
): PresetHandle<LineChartPresetOptions> {
  return createLineChart(target, data, options, responsiveOptions).handle;
}
