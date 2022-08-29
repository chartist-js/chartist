import type {
  Options,
  AxisOptions,
  Data,
  CreatedEvent,
  DrawEvent,
  NormalizedMulti,
  AxesDrawEvent
} from '../../core';
import type { RequiredKeys } from '../../utils';
import type { BaseChartEventsTypes } from '../types';

export type BarChartData = Data;

export interface BarChartOptions<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> extends Options<TXAxisOptions, TYAxisOptions> {
  /**
   * Override the class names that get used to generate the SVG structure of the chart
   */
  classNames?: {
    chart?: string;
    horizontalBars?: string;
    label?: string;
    labelGroup?: string;
    series?: string;
    bar?: string;
    grid?: string;
    gridGroup?: string;
    gridBackground?: string;
    vertical?: string;
    horizontal?: string;
    start?: string;
    end?: string;
  };
  /**
   * Specify the distance in pixel of bars in a group
   */
  seriesBarDistance?: number;
  /**
   * If set to true this property will cause the series bars to be stacked. Check the `stackMode` option for further stacking options.
   */
  stackBars?: boolean;
  /**
   * If set to 'overlap' this property will force the stacked bars to draw from the zero line.
   * If set to 'accumulate' this property will form a total for each series point. This will also influence the y-axis and the overall bounds of the chart. In stacked mode the seriesBarDistance property will have no effect.
   */
  stackMode?: 'accumulate' | boolean;
  /**
   * Inverts the axes of the bar chart in order to draw a horizontal bar chart. Be aware that you also need to invert your axis settings as the Y Axis will now display the labels and the X Axis the values.
   */
  horizontalBars?: boolean;
  /**
   * If set to true then each bar will represent a series and the data array is expected to be a one dimensional array of data values rather than a series array of series. This is useful if the bar chart should represent a profile rather than some data over time.
   */
  distributeSeries?: boolean;
  /**
   * If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
   */
  reverseData?: boolean;
  /**
   * If the bar chart should add a background fill to the .ct-grids group.
   */
  showGridBackground?: boolean;
}

export type BarChartOptionsWithDefaults = RequiredKeys<
  BarChartOptions<
    RequiredKeys<
      AxisOptions,
      | 'offset'
      | 'position'
      | 'labelOffset'
      | 'showLabel'
      | 'showGrid'
      | 'labelInterpolationFnc'
      | 'scaleMinSpace'
    >,
    RequiredKeys<
      AxisOptions,
      | 'offset'
      | 'position'
      | 'labelOffset'
      | 'showLabel'
      | 'showGrid'
      | 'labelInterpolationFnc'
      | 'scaleMinSpace'
    >
  >,
  | 'referenceValue'
  | 'chartPadding'
  | 'seriesBarDistance'
  | 'stackMode'
  | 'axisX'
  | 'axisY',
  'classNames'
>;

export type BarChartCreatedEvent = CreatedEvent<BarChartOptions>;

export interface BarDrawEvent extends DrawEvent {
  type: 'bar';
  value: number | NormalizedMulti;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type BarChartEventsTypes = BaseChartEventsTypes<
  BarChartCreatedEvent,
  AxesDrawEvent | BarDrawEvent
>;
