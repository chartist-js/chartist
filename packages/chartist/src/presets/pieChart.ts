/**
 * `pieChart`: the 1.x pie chart as a preset over `chart()`, in polar
 * coordinates. Takes the 1.x arguments and options and renders the 1.x
 * structure.
 */
import type {
  PieChartData,
  PieChartOptions
} from '../charts/PieChart/PieChart.types';
import type { ChartConfig, ChartHandle, PluginEntry } from '../chart/types';
import { pie } from '../layers/pie';
import { pieDefaults } from './pieDefaults';
import {
  createPreset,
  type PresetController,
  type PresetSpec,
  type PresetState,
  type PresetResponsiveOptions
} from './preset';

/** @experimental */
export type PieChartPresetOptions = Omit<PieChartOptions, 'plugins'> & {
  /** v2 plugins; convert 1.x plugins with `fromLegacyPlugin`. */
  readonly plugins?: readonly PluginEntry[];
};

type Resolved = typeof pieDefaults & PieChartOptions;

/** What the pie preset passes to plugins as `ResolvedConfig.preset`. */
export type PiePresetState = PresetState<PieChartData, PieChartPresetOptions>;

export type PieChartController = PresetController<
  PieChartData,
  PieChartPresetOptions
>;

const pieSpec: PresetSpec<PieChartData, PieChartPresetOptions> = {
  kind: 'pie',
  defaults: pieDefaults,
  config(data, preset): ChartConfig {
    const options = preset as Resolved;
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
        pie({
          startAngle: options.startAngle,
          total: options.total,
          donut: options.donut,
          donutWidth: options.donutWidth,
          showLabel: options.showLabel,
          labelOffset: options.labelOffset,
          labelPosition: options.labelPosition,
          labelInterpolationFnc: options.labelInterpolationFnc as (
            value: unknown,
            index: number
          ) => unknown,
          labelDirection: options.labelDirection,
          ignoreEmptyValues: options.ignoreEmptyValues,
          preventOverlappingLabelOffset: options.preventOverlappingLabelOffset,
          classNames: options.classNames
        })
      ]
    };
  }
};

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
): ChartHandle {
  return createPieChart(target, data, options, responsiveOptions).handle;
}
