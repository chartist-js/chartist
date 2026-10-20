/**
 * The context types of the target and trend line nodes, and their roles,
 * declared in chartist's `NodeRoles` so a node's role narrows them.
 */
import type { LineAttrs, NoSeries, ScaleAxis, TextAttrs } from 'chartist';

/**
 * The context of a `targetLine` node: the line of a `targetLine()` layer,
 * across the chart area at a value on an axis. Its ends are in px in the
 * SVG.
 */
export interface TargetLineContext extends NoSeries {
  /** The axis the value is on; `axis.dimension` is `x` or `y`. */
  readonly axis: ScaleAxis;
  /** The value the line is drawn at. */
  readonly value: number;
  /** The line's label, if it has one. */
  readonly label?: string;
  /** The X of the line's start, in px. */
  readonly x1: number;
  /** The Y of the line's start, in px. */
  readonly y1: number;
  /** The X of the line's end, in px. */
  readonly x2: number;
  /** The Y of the line's end, in px. */
  readonly y2: number;
}

/**
 * The context of a `targetLabel` node: the label of a target line, and
 * where it's anchored, in px in the SVG.
 */
export interface TargetLabelContext extends NoSeries {
  /** The axis of the line's value. */
  readonly axis: ScaleAxis;
  /** The value of the line. */
  readonly value: number;
  /** The label as drawn. */
  readonly text: string;
  /** Px from the left edge of the SVG. */
  readonly x: number;
  /** Px from the top edge of the SVG. */
  readonly y: number;
}

/**
 * The context of a `trendLine` node: the line a `trendLine()` layer fits
 * through a series' values, `y = slope * x + intercept` in the axes'
 * values (X is the value's index on a step axis). Its ends are in px in
 * the SVG.
 */
export interface TrendLineContext {
  /** The series' index in the chart's data, across layers. */
  readonly seriesIndex: number;
  /** Always absent: the line stands for the whole series. */
  readonly valueIndex?: undefined;
  /**
   * How much the fitted value changes per unit of X. On axes with a
   * transform, such as a log axis, it's in their transformed values: on a
   * base 10 log Y axis, the powers of ten per unit of X.
   */
  readonly slope: number;
  /** The fitted value at X 0, in transformed values like `slope`. */
  readonly intercept: number;
  /**
   * How closely the values follow the line: Pearson's correlation
   * coefficient r, from -1 (every value on a falling line) through 0 (no
   * straight trend) to 1 (every value on a rising line). Its square is R²,
   * the share of the values' variation the line explains, as spreadsheets
   * show it next to a trendline. It describes the fit, not how reliable it
   * is: with two values it's always 1 or -1. On axes with a transform,
   * it's computed in their transformed values, so it says how straight
   * the values look on the chart. Absent when all values are equal, where
   * it isn't defined.
   */
  readonly correlation?: number;
  /** The X of the line's start (the series' smallest X), in px. */
  readonly x1: number;
  /** The Y of the line's start, in px. */
  readonly y1: number;
  /** The X of the line's end (the series' largest X), in px. */
  readonly x2: number;
  /** The Y of the line's end, in px. */
  readonly y2: number;
}

declare module 'chartist' {
  interface NodeRoles {
    /**
     * A line of a `targetLine()` layer: a `line` across the chart area
     * (class `ct-target-line`).
     */
    targetLine: { ctx: TargetLineContext; attrs: LineAttrs };
    /** A target line's label: SVG `text` (class `ct-target-label`). */
    targetLabel: { ctx: TargetLabelContext; attrs: TextAttrs };
    /**
     * The fitted line of a `trendLine()` layer through a series: a `line`
     * (class `ct-trend-line`).
     */
    trendLine: { ctx: TrendLineContext; attrs: LineAttrs };
  }
}
