import type {
  Options,
  AxisOptions,
  Data,
  Series,
  SeriesObject,
  SegmentData,
  CreatedEvent,
  DrawEvent,
  NormalizedSeriesValue,
  NormalizedSeries,
  AxesDrawEvent
} from '../../core';
import type { SvgPath } from '../../svg';
import type { RequiredKeys } from '../../utils';
import type { BaseChartEventsTypes } from '../types';

export type LineInterpolation = (
  pathCoordinates: number[],
  valueData: SegmentData[]
) => SvgPath;

export type LineChartData = Data<(Series | SeriesObject)[]>;

export interface LineChartOptions<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> extends Options<TXAxisOptions, TYAxisOptions> {
  /**
   * Override the class names that get used to generate the SVG structure of the chart
   */
  classNames?: {
    chart?: string;
    label?: string;
    labelGroup?: string;
    series?: string;
    line?: string;
    point?: string;
    area?: string;
    grid?: string;
    gridGroup?: string;
    gridBackground?: string;
    vertical?: string;
    horizontal?: string;
    start?: string;
    end?: string;
  };
  /**
   * If the line should be drawn or not
   */
  showLine?: boolean;
  /**
   * If dots should be drawn or not
   */
  showPoint?: boolean;
  /**
   * If the line chart should draw an area
   */
  showArea?: boolean;
  /**
   * The base for the area chart that will be used to close the area shape (is normally 0)
   */
  areaBase?: number;
  /**
   * Specify if the lines should be smoothed.
   * This value can be true or false where true will result in smoothing using the default smoothing interpolation function Chartist.Interpolation.cardinal and false results in Chartist.Interpolation.none.
   * You can also choose other smoothing / interpolation functions available in the Chartist.Interpolation module, or write your own interpolation function.
   * Check the examples for a brief description.
   */
  lineSmooth?: boolean | LineInterpolation;
  /**
   * If the line chart should add a background fill to the .ct-grids group.
   */
  showGridBackground?: boolean;
  /**
   * When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler.
   */
  fullWidth?: boolean;
  /**
   * If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
   */
  reverseData?: boolean;
  series?: Record<
    string,
    Omit<LineChartOptions<TXAxisOptions, TYAxisOptions>, 'series'>
  >;
}

export type LineChartOptionsWithDefaults = RequiredKeys<
  LineChartOptions<
    RequiredKeys<
      AxisOptions,
      | 'offset'
      | 'position'
      | 'labelOffset'
      | 'showLabel'
      | 'showGrid'
      | 'labelInterpolationFnc'
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
  | 'showLine'
  | 'showPoint'
  | 'areaBase'
  | 'lineSmooth'
  | 'chartPadding'
  | 'axisX'
  | 'axisY',
  'classNames'
>;

export type LineChartCreatedEvent = CreatedEvent<LineChartOptions>;

export interface PointDrawEvent extends DrawEvent {
  type: 'point';
  value: NormalizedSeriesValue;
  x: number;
  y: number;
}

export interface LineDrawEvent extends DrawEvent {
  type: 'line';
  values: NormalizedSeries;
  path: SvgPath;
}

export interface AreaDrawEvent extends DrawEvent {
  type: 'area';
  values: NormalizedSeries;
  path: SvgPath;
}

export type LineChartEventsTypes = BaseChartEventsTypes<
  LineChartCreatedEvent,
  AxesDrawEvent | PointDrawEvent | LineDrawEvent | AreaDrawEvent
>;
