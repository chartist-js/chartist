import type {
  LineChartData,
  LineChartOptions,
  LineChartOptionsWithDefaults,
  LineChartEventsTypes
} from './LineChart.types';
import type { Series, SeriesObject, ResponsiveOptions } from '../../core';
import type { PluginEntry } from '../../chart/types';
import {
  createLineChart,
  type LineChartPresetOptions
} from '../../presets/lineChart';
import { lineDefaults } from '../../presets/lineDefaults';
import type { PresetController } from '../../presets/preset';
import { safeHasProperty } from '../../utils';
import { PresetChart } from '../PresetChart';

/**
 * Reads a line chart option for a series: the per-series value from
 * `options.series[name]` if the series has a name and sets it, the chart's
 * value otherwise.
 */
export function getSeriesOption<
  T extends keyof Omit<LineChartOptionsWithDefaults, 'series'>
>(
  series: Series | SeriesObject,
  options: LineChartOptionsWithDefaults,
  key: T
) {
  if (
    safeHasProperty(series, 'name') &&
    series.name &&
    options.series?.[series.name]
  ) {
    const seriesOptions = options?.series[series.name];
    const value = seriesOptions[key];
    const result = value === undefined ? options[key] : value;

    return result as LineChartOptionsWithDefaults[T];
  } else {
    return options[key];
  }
}

/**
 * The 1.x line chart class: a wrapper over the `lineChart` preset with the
 * 1.x API. 1.x events and 1.x plugin functions need the compat plugin
 * (`chartist/compat`).
 * @see {@link lineChart} for the v2 functional API.
 */
export class LineChart extends PresetChart<
  LineChartEventsTypes,
  LineChartData,
  LineChartOptions
> {
  /**
   * Creates a line chart. The first render happens on the next tick, so
   * listeners registered right after construction receive it.
   * @param query A selector query string or a DOM element
   * @param data The data with labels and series
   * @param options Options that override the defaults
   * @param responsiveOptions `[mediaQuery, options]` pairs
   */
  constructor(
    query: string | Element | null,
    data: LineChartData,
    options?: LineChartOptions,
    responsiveOptions?: ResponsiveOptions<LineChartOptions>
  ) {
    super(
      query,
      data,
      lineDefaults as LineChartOptions,
      options,
      responsiveOptions
    );
  }

  protected createController(
    container: Element,
    data: LineChartData,
    options: LineChartOptions | undefined,
    responsiveOptions: ResponsiveOptions<LineChartOptions> | undefined,
    plugins: PluginEntry[]
  ) {
    return createLineChart(
      container,
      data,
      options as LineChartPresetOptions,
      responsiveOptions as ResponsiveOptions<LineChartPresetOptions>,
      plugins
    ) as unknown as PresetController<LineChartData, LineChartOptions>;
  }
}
