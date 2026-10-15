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

/**
 * The options of a line chart (1.x `LineChart`, and `lineChart`).
 *
 * @deprecated For `lineChart()`, the options type is `LineChartPresetOptions`. Removed in 3.0.
 */
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

/**
 * {@link LineChartOptions} after the defaults are applied: the 1.x `LineChart` works with these.
 *
 * @deprecated The resolved options of the 1.x `LineChart`. Removed in 3.0.
 */
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

/**
 * The payload of a line chart's 1.x `created` event.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export type LineChartCreatedEvent = CreatedEvent<LineChartOptions>;

/**
 * The 1.x `draw` event of a line chart's point, one per value. The point is a
 * very short `line` element at `x`, `y` (CSS gives it a round cap).
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export interface PointDrawEvent extends DrawEvent {
  /** Always `'point'`. */
  type: 'point';
  /** The point's normalized value: `{ x, y }` numbers, or a number. */
  value: NormalizedSeriesValue;
  /** The point's x, in px. */
  x: number;
  /** The point's y, in px. */
  y: number;
}

/**
 * The 1.x `draw` event of a line, one per series. `index` is the series'
 * index and `meta` the series' meta.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export interface LineDrawEvent extends DrawEvent {
  /** Always `'line'`. */
  type: 'line';
  /** All normalized values of the series. */
  values: NormalizedSeries;
  /** The line's path as drawn (a copy, safe to change). */
  path: SvgPath;
}

/**
 * The 1.x `draw` event of an area (with `showArea`), one per series and
 * segment. `index` is the series' index and `meta` the series' meta.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export interface AreaDrawEvent extends DrawEvent {
  /** Always `'area'`. */
  type: 'area';
  /** All normalized values of the series. */
  values: NormalizedSeries;
  /** The area's path as drawn (a copy, safe to change). */
  path: SvgPath;
}

/**
 * The 1.x events of a {@link LineChart} and their payloads, by event name.
 *
 * @deprecated The 1.x events of a `LineChart`. On `lineChart()`, the handle's `on()` knows its events. Removed in 3.0.
 */
export type LineChartEventsTypes = BaseChartEventsTypes<
  LineChartCreatedEvent,
  AxesDrawEvent | PointDrawEvent | LineDrawEvent | AreaDrawEvent
>;
