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

/**
 * The options of a bar chart (1.x `BarChart`, and `barChart`).
 *
 * @deprecated For `barChart()`, the options type is `BarChartPresetOptions`. Removed in 3.0.
 */
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

/**
 * {@link BarChartOptions} after the defaults are applied: the 1.x `BarChart` works with these.
 *
 * @deprecated The resolved options of the 1.x `BarChart`. Removed in 3.0.
 */
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

/**
 * The payload of a bar chart's 1.x `created` event.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export type BarChartCreatedEvent = CreatedEvent<BarChartOptions>;

/**
 * The 1.x `draw` event of a bar, one per value. The bar is a `line` element
 * from its base (`x1`, `y1`) to its value (`x2`, `y2`).
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export interface BarDrawEvent extends DrawEvent {
  /** Always `'bar'`. */
  type: 'bar';
  /** The bar's normalized value: a number, or `{ x, y }` numbers. */
  value: number | NormalizedMulti;
  /** The x of the bar's base, in px. */
  x1: number;
  /** The y of the bar's base, in px. */
  y1: number;
  /** The x of the bar's end (its value), in px. */
  x2: number;
  /** The y of the bar's end (its value), in px. */
  y2: number;
}

/**
 * The 1.x events of a {@link BarChart} and their payloads, by event name.
 *
 * @deprecated The 1.x events of a `BarChart`. On `barChart()`, the handle's `on()` knows its events. Removed in 3.0.
 */
export type BarChartEventsTypes = BaseChartEventsTypes<
  BarChartCreatedEvent,
  AxesDrawEvent | BarDrawEvent
>;
