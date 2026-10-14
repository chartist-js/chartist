import type {
  Dot,
  PieChartData,
  PieChartOptions,
  PieChartEventsTypes
} from './PieChart.types';
import type { ResponsiveOptions } from '../../core';
import type { PluginEntry } from '../../chart/types';
import { moveLabel } from '../../layers/pie';
import {
  createPieChart,
  type PieChartPresetOptions
} from '../../presets/pieChart';
import { pieDefaults } from '../../presets/pieDefaults';
import type { PresetController } from '../../presets/preset';
import { PresetChart } from '../PresetChart';

export { determineAnchorPosition } from '../../layers/pie';

/**
 * The 1.x pie chart class: a wrapper over the `pieChart` preset with the
 * 1.x API. 1.x events and 1.x plugin functions need the compat plugin
 * (`chartist/compat`).
 * @see pieChart for the v2 functional API.
 */
export class PieChart extends PresetChart<
  PieChartEventsTypes,
  PieChartData,
  PieChartOptions
> {
  /**
   * Creates a pie chart. The first render happens on the next tick, so
   * listeners registered right after construction receive it.
   * @param query A selector query string or a DOM element
   * @param data The data with labels and series
   * @param options Options that override the defaults
   * @param responsiveOptions `[mediaQuery, options]` pairs
   */
  constructor(
    query: string | Element | null,
    data: PieChartData,
    options?: PieChartOptions,
    responsiveOptions?: ResponsiveOptions<PieChartOptions>
  ) {
    super(
      query,
      data,
      pieDefaults as unknown as PieChartOptions,
      options,
      responsiveOptions
    );
  }

  /**
   * Checks if a label overlaps another one and moves it up and left until
   * it doesn't (1.x).
   */
  moveLabel(
    labelPos: Dot,
    existingLabelPos: Dot,
    textOffset: number,
    length: number
  ) {
    moveLabel(labelPos, existingLabelPos, textOffset, length);
  }

  protected createController(
    container: Element,
    data: PieChartData,
    options: PieChartOptions | undefined,
    responsiveOptions: ResponsiveOptions<PieChartOptions> | undefined,
    plugins: PluginEntry[]
  ) {
    return createPieChart(
      container,
      data,
      options as PieChartPresetOptions,
      responsiveOptions as ResponsiveOptions<PieChartPresetOptions>,
      plugins
    ) as unknown as PresetController<PieChartData, PieChartOptions>;
  }
}
