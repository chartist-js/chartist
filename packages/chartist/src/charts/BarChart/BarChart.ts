import type {
  BarChartData,
  BarChartOptions,
  BarChartEventsTypes
} from './BarChart.types';
import type { ResponsiveOptions } from '../../core';
import type { PluginEntry } from '../../chart/types';
import {
  createBarChart,
  type BarChartPresetOptions
} from '../../presets/barChart';
import { barDefaults } from '../../presets/barDefaults';
import type { PresetController } from '../../presets/preset';
import { PresetChart } from '../PresetChart';

/**
 * The 1.x bar chart class: a wrapper over the `barChart` preset with the
 * 1.x API. 1.x events and 1.x plugin functions need the compat plugin
 * (`chartist/compat`).
 * @see {@link barChart} for the v2 functional API.
 */
export class BarChart extends PresetChart<
  BarChartEventsTypes,
  BarChartData,
  BarChartOptions
> {
  /**
   * Creates a bar chart. The first render happens on the next tick, so
   * listeners registered right after construction receive it.
   * @param query A selector query string or a DOM element
   * @param data The data with labels and series
   * @param options Options that override the defaults
   * @param responsiveOptions `[mediaQuery, options]` pairs
   */
  constructor(
    query: string | Element | null,
    data: BarChartData,
    options?: BarChartOptions,
    responsiveOptions?: ResponsiveOptions<BarChartOptions>
  ) {
    super(
      query,
      data,
      barDefaults as unknown as BarChartOptions,
      options,
      responsiveOptions
    );
  }

  protected createController(
    container: Element,
    data: BarChartData,
    options: BarChartOptions | undefined,
    responsiveOptions: ResponsiveOptions<BarChartOptions> | undefined,
    plugins: PluginEntry[]
  ) {
    return createBarChart(
      container,
      data,
      options as BarChartPresetOptions,
      responsiveOptions as ResponsiveOptions<BarChartPresetOptions>,
      plugins
    ) as unknown as PresetController<BarChartData, BarChartOptions>;
  }
}
