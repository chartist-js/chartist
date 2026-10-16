/**
 * `pieChart`: the 1.x pie chart as a preset over `chart()`, in polar
 * coordinates. Takes the 1.x arguments and options and renders the 1.x
 * structure.
 */
import type {
  PieChartData,
  PieChartOptions
} from '../charts/PieChart/PieChart.types';
import type { ChartConfig, PluginEntry } from '../chart/types';
import type { PhaseListeners } from '../pipeline/types';
import { pie } from '../layers/pie';
import { pieDefaults } from './pieDefaults';
import {
  createPreset,
  presetConfig,
  type PresetController,
  type PresetLayers,
  type PresetHandle,
  type PresetSpec,
  type PresetState,
  type PresetResponsiveOptions
} from './preset';

/**
 * Options of `pieChart`: the 1.x `PieChart` options, with v2 plugins and
 * phase listeners.
 * @experimental
 */
export type PieChartPresetOptions = Omit<PieChartOptions, 'plugins'> & {
  /** v2 plugins; convert 1.x plugins with `fromLegacyPlugin`. */
  readonly plugins?: readonly PluginEntry[];
  /**
   * Phase listeners by phase name (or `'*'` for all phases), as `on` in
   * the config of `chart()`. They're registered before the first render,
   * so they see it too.
   */
  readonly on?: PhaseListeners;
  /** Extra layers below or above the pie's slices, in polar coordinates. */
  readonly layers?: PresetLayers;
};

type Resolved = typeof pieDefaults & PieChartOptions;

/** What the pie preset passes to plugins as `ResolvedConfig.preset`. */
export type PiePresetState = PresetState<
  PieChartData,
  PieChartPresetOptions,
  'pie'
>;

export type PieChartController = PresetController<
  PieChartData,
  PieChartPresetOptions
>;

const pieSpec: PresetSpec<PieChartData, PieChartPresetOptions> = {
  kind: 'pie',
  defaults: pieDefaults,
  config(data, preset): ChartConfig {
    const options = preset as Resolved;
    const { below = [], above = [] } = preset.layers ?? {};
    return {
      data,
      coordinates: 'polar',
      padding: options.chartPadding,
      width: options.width,
      height: options.height,
      viewBox: options.viewBox,
      className: options.donut
        ? options.classNames.chartDonut
        : options.classNames.chartPie,
      layers: [
        ...below,
        pie({
          startAngle: options.startAngle,
          total: options.total,
          donut: options.donut,
          donutWidth: options.donutWidth,
          showLabel: options.showLabel,
          labelOffset: options.labelOffset,
          labelPosition: options.labelPosition,
          labelTransform: options.labelTransform,
          labelInterpolationFnc: options.labelInterpolationFnc,
          labelDirection: options.labelDirection,
          ignoreEmptyValues: options.ignoreEmptyValues,
          preventOverlappingLabelOffset: options.preventOverlappingLabelOffset,
          classNames: options.classNames
        }),
        ...above
      ]
    };
  }
};

/**
 * Builds the chart config that `pieChart()` renders for the data and
 * options, without a container: the pie layer with its labels. Pass it to `toScene()` to render
 * the preset chart with another renderer. Responsive options and the
 * inline size style of the root svg are left out; both need a container.
 * @experimental
 */
export function pieChartConfig(
  data: PieChartData,
  options: PieChartPresetOptions = {}
): ChartConfig {
  return presetConfig(pieSpec, data, options);
}

/** Internal: creates the pie preset; used by `pieChart` and `PieChart`. */
export function createPieChart(
  target: string | Element,
  data: PieChartData,
  options: PieChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<PieChartPresetOptions>,
  plugins?: ChartConfig['plugins']
): PieChartController {
  return createPreset(
    pieSpec,
    target,
    data,
    options,
    responsiveOptions,
    plugins ?? options.plugins
  );
}

/**
 * Creates a pie or donut chart with the 1.x options and output, rendered
 * synchronously. Plugins must be v2 plugins; convert 1.x plugins with
 * `fromLegacyPlugin` from `chartist/compat`.
 * @experimental
 */
export function pieChart(
  target: string | Element,
  data: PieChartData,
  options: PieChartPresetOptions = {},
  responsiveOptions?: PresetResponsiveOptions<PieChartPresetOptions>
): PresetHandle<PieChartPresetOptions> {
  return createPieChart(target, data, options, responsiveOptions).handle;
}
