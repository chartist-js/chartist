/**
 * The roles of scene nodes and what each one carries: its data context
 * (`ctx`) and its attributes. Checking `node.role` narrows a node to its
 * role, e.g. `node.role === 'point'` gives `node.ctx.x` as a number.
 *
 * Plugins that add nodes with their own role declare it here:
 *
 * ```ts
 * declare module 'chartist' {
 *   interface NodeRoles {
 *     marker: { ctx: { label: string }; attrs: { cx: number; cy: number } };
 *   }
 * }
 * ```
 *
 * @experimental The v2 API may change until v2.0.
 */
import type { Label, NormalizedSeries, NormalizedSeriesValue } from '../core';
import type { ScaleAxis } from '../scales/axis';
import type { SvgPath } from '../svg';

/** A point in chart coordinates (px). */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Contexts without a series say so, so `ctx.seriesIndex` reads as
 * `number | undefined` on any node.
 */
export interface NoSeries {
  readonly seriesIndex?: undefined;
  readonly valueIndex?: undefined;
}

/** What every node of a series knows about its series. */
export interface SeriesContext {
  /** The series as given in the data (array, or object with `data`). */
  readonly series: unknown;
  /** The series' index in the chart's data, across layers. */
  readonly seriesIndex: number;
  /** The series' `meta`, if it's a series object with one. */
  readonly meta: unknown;
}

/** A series group: the series without one of its values. */
export interface SeriesGroupContext extends SeriesContext {
  readonly valueIndex?: undefined;
}

/** A value of a series: its index and its normalized value. */
export interface ValueContext {
  readonly valueIndex: number;
  /** The normalized value: a number, `{ x, y }` numbers, or a hole. */
  readonly value: NormalizedSeriesValue;
}

/** A point of a line chart. */
export interface PointContext extends SeriesContext, ValueContext, Point {}

/** A bar: its value and where it's drawn, from the base to the value. */
export interface BarContext extends SeriesContext, ValueContext {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** A line or an area of a line chart. */
export interface PathContext extends SeriesContext {
  readonly valueIndex?: undefined;
  /** All values of the series. */
  readonly values: NormalizedSeries;
  /** The path as drawn (a copy, safe to change). */
  readonly path: SvgPath;
}

/** A pie or donut slice: one series with one value. */
export interface SliceContext extends SeriesContext {
  readonly value: number;
  /** Always 0: a slice's series has one value. */
  readonly valueIndex: 0;
  /** Same as `seriesIndex`, as in 1.x draw events. */
  readonly index: number;
  /** The sum of all slices (or the `total` option). */
  readonly totalDataSum: number;
  readonly path: SvgPath;
  readonly center: Point;
  readonly radius: number;
  /** Degrees, clockwise from the top. */
  readonly startAngle: number;
  readonly endAngle: number;
}

/** A grid line of an axis, at a tick. */
export interface GridContext extends NoSeries {
  readonly axis: ScaleAxis;
  /** The tick's index. */
  readonly index: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** An axis label, at a tick. */
export interface AxisLabelContext extends NoSeries {
  readonly kind: 'axis';
  readonly axis: ScaleAxis;
  /** The tick's index. */
  readonly index: number;
  /** The label after `labelInterpolationFnc`. */
  readonly text: Label;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A slice's label on a pie or donut. */
export interface PieLabelContext extends SeriesContext, Point {
  readonly kind: 'pie';
  /** Always 0, as for the slice. */
  readonly valueIndex: 0;
  /** Same as `seriesIndex`, as in 1.x draw events. */
  readonly index: number;
  /** The label as drawn. */
  readonly text: string;
}

/** `x1`..`y2` of a `line` element (points, bars and grid lines). */
export interface LineAttrs {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  /** The value as written to the output, for points and bars. */
  readonly 'ct:value'?: string | number;
  readonly 'ct:meta'?: string;
}

export interface PathAttrs {
  readonly d: string;
  readonly 'ct:value'?: string | number;
  readonly 'ct:meta'?: string;
}

export interface SeriesAttrs {
  readonly 'ct:series-name'?: string;
  readonly 'ct:meta'?: string;
}

export interface RectAttrs {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Roles of the built-in layers and axes. Augment it to add your own
 * (see the module comment).
 */
export interface NodeRoles {
  point: { ctx: PointContext; attrs: LineAttrs };
  bar: { ctx: BarContext; attrs: LineAttrs };
  line: { ctx: PathContext; attrs: PathAttrs };
  area: { ctx: PathContext; attrs: PathAttrs };
  slice: { ctx: SliceContext; attrs: PathAttrs };
  series: { ctx: SeriesGroupContext; attrs: SeriesAttrs };
  grid: { ctx: GridContext; attrs: LineAttrs };
  gridBackground: { ctx: NoSeries; attrs: RectAttrs };
  label: { ctx: AxisLabelContext | PieLabelContext; attrs: object };
}

/** A role name: a key of `NodeRoles`. */
export type NodeRole = keyof NodeRoles;
