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

/** The data of a bar chart: series of values, and labels for the bar groups. */
export type BarChartData = Data;

/** The options of a bar chart (1.x `BarChart`, and `barChart`). */
export interface BarChartOptions<
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
    /** The chart's SVG element, with `horizontalBars`. */
    horizontalBars?: string;
    /** Each axis label. */
    label?: string;
    /** The group of an axis's labels. */
    labelGroup?: string;
    /** The group of each series. */
    series?: string;
    /** Each bar. */
    bar?: string;
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
  /** The distance in px between the bars of a group (one bar per series). */
  seriesBarDistance?: number;
  /** Stacks the bars of a group on each other; `stackMode` says how. */
  stackBars?: boolean;
  /**
   * How stacked bars stack: `accumulate` adds up each group's values (the
   * value axis fits the totals), `accumulate-relative` stacks positive
   * values up and negative values down, and `true` draws every bar from
   * zero, overlapping.
   */
  stackMode?: 'accumulate' | 'accumulate-relative' | boolean;
  /**
   * Draws horizontal bars. The axes swap: the Y axis shows the labels and
   * the X axis the values, so swap their options too.
   */
  horizontalBars?: boolean;
  /**
   * Treats one flat array of values as one series per value, each in its
   * own color: a profile rather than values over time.
   */
  distributeSeries?: boolean;
  /** Reverses the labels, the order of the series and each series' values. */
  reverseData?: boolean;
  /** Fills the grid area with a background (class `ct-grid-background`). */
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
