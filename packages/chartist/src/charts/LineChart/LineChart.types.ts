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

/** Turns a series' points into the path of its line (see `Interpolation`). */
export type LineInterpolation = (
  pathCoordinates: number[],
  valueData: SegmentData[]
) => SvgPath;

/** The data of a line chart: series of values, and labels for the X axis. */
export type LineChartData = Data<(Series | SeriesObject)[]>;

/** The options of a line chart (1.x `LineChart`, and `lineChart`). */
export interface LineChartOptions<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> extends Options<TXAxisOptions, TYAxisOptions> {
  /**
   * The class names of the chart's elements. Change them to style the
   * chart with your own CSS instead of Chartist's.
   */
  classNames?: {
    /** The chart's SVG element. */
    chart?: string;
    /** Each axis label. */
    label?: string;
    /** The group of an axis's labels. */
    labelGroup?: string;
    /** The group of each series. */
    series?: string;
    /** Each line. */
    line?: string;
    /** Each point. */
    point?: string;
    /** Each area. */
    area?: string;
    /** Each grid line. */
    grid?: string;
    /** The group of the grid lines. */
    gridGroup?: string;
    /** The grid background (with `showGridBackground`). */
    gridBackground?: string;
    /** Labels and grid lines of the vertical axis. */
    vertical?: string;
    /** Labels and grid lines of the horizontal axis. */
    horizontal?: string;
    /** Labels at the start of their axis (left or top). */
    start?: string;
    /** Labels at the end of their axis (right or bottom). */
    end?: string;
  };
  /** Draws the lines. */
  showLine?: boolean;
  /** Draws a point at each value. */
  showPoint?: boolean;
  /** Fills the area between each line and `areaBase`. */
  showArea?: boolean;
  /** The value the areas close at, usually 0. */
  areaBase?: number;
  /**
   * How a line runs between its points: `true` smooths it with
   * `Interpolation.monotoneCubic`, `false` draws straight segments
   * (`Interpolation.none`), or pass an interpolation such as
   * `Interpolation.cardinal()`, `Interpolation.step()` or your own.
   */
  lineSmooth?: boolean | LineInterpolation;
  /** Fills the grid area with a background (class `ct-grid-background`). */
  showGridBackground?: boolean;
  /**
   * Stretches the X axis so the last value lands on the right edge, without
   * a last grid line. The last label may need chart padding to fit.
   */
  fullWidth?: boolean;
  /** Reverses the labels, the order of the series and each series' values. */
  reverseData?: boolean;
  /** Options per series, by series name: line options for one series. */
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
