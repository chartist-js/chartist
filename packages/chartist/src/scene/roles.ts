/**
 * The roles of scene nodes and what each one carries: its data context
 * (`ctx`) and its attributes. Checking `node.role` narrows a node to its
 * role, e.g. `node.role === 'point'` gives `node.ctx.x` as a number.
 * Plugins declare their own roles in `NodeRoles`.
 */
import type { Label, NormalizedSeries, NormalizedSeriesValue } from '../core';
import type { ScaleAxis } from '../scales/axis';
import type { LineInterpolation } from '../charts/LineChart/LineChart.types';
import type { SvgPath } from '../svg';

/** A position in the chart's SVG, in px from its top left corner. */
export interface Point {
  /** Px from the left edge of the SVG. */
  readonly x: number;
  /** Px from the top edge of the SVG. */
  readonly y: number;
}

/**
 * The context of nodes that belong to no series, such as grid lines. It
 * says so, so `ctx.seriesIndex` reads as `number | undefined` on any node.
 */
export interface NoSeries {
  /** Always absent: the node belongs to no series. */
  readonly seriesIndex?: undefined;
  /** Always absent: the node stands for no value. */
  readonly valueIndex?: undefined;
}

/**
 * What every node of a series knows about its series: series groups,
 * points, lines, areas, bars and slices.
 */
export interface SeriesContext {
  /** The series as given in the data (array, or object with `data`). */
  readonly series: unknown;
  /** The series' index in the chart's data, across layers. */
  readonly seriesIndex: number;
  /** The series' `meta`, if it's a series object with one. */
  readonly meta: unknown;
}

/**
 * The context of a `series` node: the `g` element that holds one series'
 * lines, areas, points, bars or slice. It knows its series, but no value.
 */
export interface SeriesGroupContext extends SeriesContext {
  /** Always absent: the group stands for the whole series. */
  readonly valueIndex?: undefined;
}

/** What a node of one value knows about it: its index and its value. */
export interface ValueContext {
  /** The value's index in its series, from 0. */
  readonly valueIndex: number;
  /** The normalized value: a number, `{ x, y }` numbers, or a hole. */
  readonly value: NormalizedSeriesValue;
}

/**
 * The context of a `point` node: one value of a line chart's series, and
 * where it's drawn. `x` and `y` are the point's position in px in the SVG.
 * Line values are normalized to `{ x, y }` (or a hole), so the value is
 * `ctx.value.y`.
 */
export interface PointContext extends SeriesContext, ValueContext, Point {}

/**
 * The context of a `bar` node: one value of a bar chart's series, and the
 * line it's drawn as, from the base (`x1`, `y1`) to the value (`x2`,
 * `y2`), in px in the SVG. A stacked bar starts where the one below it
 * ends. Bars are clipped to the chart area.
 */
export interface BarContext extends SeriesContext, ValueContext {
  /** Whether the bar is horizontal (`horizontalBars`). */
  readonly horizontal: boolean;
  /**
   * Whether the bar is a segment of a stack: stacked with `accumulate` or
   * `accumulate-relative`, so its base is where the previous segment
   * ends. False for `overlap`, whose bars all start at zero.
   */
  readonly stacked: boolean;
  /** The X of the bar's base, in px. */
  readonly x1: number;
  /** The Y of the bar's base, in px. */
  readonly y1: number;
  /** The X of the bar's end (the value), in px. */
  readonly x2: number;
  /** The Y of the bar's end (the value), in px. */
  readonly y2: number;
}

/**
 * The context of a `line` or `area` node: the path of a whole series of a
 * line chart, with all its values.
 */
export interface PathContext extends SeriesContext {
  /** Always absent: the path stands for the whole series. */
  readonly valueIndex?: undefined;
  /** All values of the series. */
  readonly values: NormalizedSeries;
  /** The path as drawn (a copy, safe to change). */
  readonly path: SvgPath;
  /**
   * The interpolation the path was drawn with (`lineSmooth`), so the path
   * can be drawn again through other points, e.g. for update animations.
   */
  readonly smoothing: LineInterpolation;
}

/**
 * The context of a `slice` node: a pie or donut slice, which is one series
 * with one value, and its geometry in px and degrees.
 */
export interface SliceContext extends SeriesContext {
  /** The slice's value. */
  readonly value: number;
  /** Always 0: a slice's series has one value. */
  readonly valueIndex: 0;
  /** Same as `seriesIndex`, as in 1.x draw events. */
  readonly index: number;
  /** The sum of all slices (or the `total` option). */
  readonly totalDataSum: number;
  /** The slice's outline as drawn (a copy, safe to change). */
  readonly path: SvgPath;
  /** The center of the pie, in px in the SVG. */
  readonly center: Point;
  /** The pie's radius in px (for a donut, to the middle of its ring). */
  readonly radius: number;
  /** Where the slice starts, in degrees clockwise from the top. */
  readonly startAngle: number;
  /** Where the slice ends, in degrees clockwise from the top. */
  readonly endAngle: number;
}

/**
 * The context of a `grid` node: the grid line of an axis at one tick,
 * across the chart area. Its ends are in px in the SVG.
 */
export interface GridContext extends NoSeries {
  /** The axis the line belongs to; `axis.dimension` is `x` or `y`. */
  readonly axis: ScaleAxis;
  /** The tick's index, in `axis.minorTicks` for a minor grid line. */
  readonly index: number;
  /** `true` for a grid line at one of the axis's `minorTicks`. */
  readonly minor?: true;
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
 * The context of an axis `label` node: the label of an axis at one tick,
 * and the box it's laid out in, in px in the SVG.
 */
export interface AxisLabelContext extends NoSeries {
  /** `axis` for axis labels; check it to tell them from pie labels. */
  readonly kind: 'axis';
  /** The axis the label belongs to; `axis.dimension` is `x` or `y`. */
  readonly axis: ScaleAxis;
  /** The tick's index. */
  readonly index: number;
  /** The label after `labelInterpolationFnc`. */
  readonly text: Label;
  /** The left edge of the label's box, in px. */
  readonly x: number;
  /** The top edge of the label's box, in px. */
  readonly y: number;
  /**
   * The width of the label's box in px. On the X axis, the space to the
   * next tick.
   */
  readonly width: number;
  /**
   * The height of the label's box in px. On the Y axis, the space to the
   * next tick.
   */
  readonly height: number;
}

/**
 * The context of a pie `label` node: a slice's label on a pie or donut.
 * `x` and `y` are where the label is anchored, in px in the SVG.
 */
export interface PieLabelContext extends SeriesContext, Point {
  /** `pie` for slice labels; check it to tell them from axis labels. */
  readonly kind: 'pie';
  /** Always 0, as for the slice. */
  readonly valueIndex: 0;
  /** Same as `seriesIndex`, as in 1.x draw events. */
  readonly index: number;
  /** The label as drawn. */
  readonly text: string;
}

/**
 * An edge of a band: a constant value, the edge's own values (`undefined`
 * for a hole), or the chart-wide index of the series it follows.
 */
export type BandEdge =
  | { readonly value: number }
  | { readonly values: readonly (number | undefined)[] }
  | { readonly seriesIndex: number };

/**
 * The context of a `band` node: one filled piece of a `band()` layer
 * (the band breaks at holes), and the edges it was drawn from.
 */
export interface BandContext extends NoSeries {
  /** The low edge, when the band has edges. */
  readonly low?: BandEdge;
  /** The high edge, when the band has edges. */
  readonly high?: BandEdge;
  /**
   * The chart-wide indexes of the series whose minimum and maximum the
   * band covers, when it's drawn from a group.
   */
  readonly series?: readonly number[];
  /** The piece's outline as drawn (a copy, safe to change). */
  readonly path: SvgPath;
  /** The interpolation the edges were drawn with (`lineSmooth`). */
  readonly smoothing: LineInterpolation;
}

/** The attributes of a target label's SVG `text` element. */
export interface TextAttrs {
  /** The X of the anchor, in px. */
  readonly x: number;
  /** The Y of the text's baseline, in px. */
  readonly y: number;
  /** `start` or `end`: which end of the text sits at the anchor. */
  readonly 'text-anchor': 'start' | 'end';
}

/**
 * The attributes of a `line` element: points, bars and grid lines. A point
 * is a line of 0.01 px, which the CSS draws as a dot with a round cap.
 */
export interface LineAttrs {
  /** The X of the line's start, in px. */
  readonly x1: number;
  /** The Y of the line's start, in px. */
  readonly y1: number;
  /** The X of the line's end, in px. */
  readonly x2: number;
  /** The Y of the line's end, in px. */
  readonly y2: number;
  /** The value as written to the output, for points and bars. */
  readonly 'ct:value'?: string | number;
  /** The value's `meta`, serialized, for points and bars that have one. */
  readonly 'ct:meta'?: string;
}

/** The attributes of a `path` element: lines, areas and slices. */
export interface PathAttrs {
  /** The path data, as in SVG's `d` attribute. */
  readonly d: string;
  /** The value as written to the output, for slices. */
  readonly 'ct:value'?: string | number;
  /** The series' `meta`, serialized, for slices that have one. */
  readonly 'ct:meta'?: string;
}

/** The attributes of a series' `g` element. */
export interface SeriesAttrs {
  /** The series' `name`, if it has one. */
  readonly 'ct:series-name'?: string;
  /** The series' `meta`, serialized, if it has one (line and bar charts). */
  readonly 'ct:meta'?: string;
}

/** The attributes of a `rect` element: the grid background. */
export interface RectAttrs {
  /** The left edge, in px. */
  readonly x: number;
  /** The top edge, in px. */
  readonly y: number;
  /** The width in px. */
  readonly width: number;
  /** The height in px. */
  readonly height: number;
}

/**
 * The roles of scene nodes, and for each its data context (`ctx`) and
 * attributes (`attrs`). Checking `node.role` narrows a {@link SceneNode} to
 * its role, so `ctx` has that role's fields.
 *
 * The built-in layers and axes use the roles below; the class names are
 * their defaults. A plugin that adds nodes with a role of its own declares
 * it here with TypeScript's module augmentation; {@link node} and
 * {@link findAll} then accept it, and its `compose` listeners see it.
 *
 * @example
 * ```ts
 * import { node, type ChartPlugin } from 'chartist';
 *
 * declare module 'chartist' {
 *   interface NodeRoles {
 *     marker: {
 *       ctx: { readonly seriesIndex: number; readonly label: string };
 *       attrs: { readonly cx: number; readonly cy: number };
 *     };
 *   }
 * }
 *
 * // A marker on the last point of each series.
 * export const markers: ChartPlugin = {
 *   name: 'markers',
 *   install(chart) {
 *     chart.on('compose', current => {
 *       if (current.role !== 'series') {
 *         return;
 *       }
 *       const last = current.children.at(-1);
 *       if (last?.role !== 'point') {
 *         return;
 *       }
 *       const { x, y, seriesIndex } = last.ctx;
 *       return current.append(
 *         node('circle', { cx: x, cy: y, r: 6 }, 'ct-marker', {
 *           role: 'marker',
 *           ctx: { seriesIndex, label: 'last' }
 *         })
 *       );
 *     });
 *   }
 * };
 * ```
 */
export interface NodeRoles {
  /** A value of a line chart: a `line` of 0.01 px (class `ct-point`). */
  point: { ctx: PointContext; attrs: LineAttrs };
  /** A value of a bar chart: a `line` (class `ct-bar`). */
  bar: { ctx: BarContext; attrs: LineAttrs };
  /** A series' line in a line chart: a `path` (class `ct-line`). */
  line: { ctx: PathContext; attrs: PathAttrs };
  /** A series' filled area in a line chart: a `path` (class `ct-area`). */
  area: { ctx: PathContext; attrs: PathAttrs };
  /**
   * A pie or donut slice: a `path` (class `ct-slice-pie` or
   * `ct-slice-donut`).
   */
  slice: { ctx: SliceContext; attrs: PathAttrs };
  /** The `g` element that holds a series' nodes (class `ct-series`). */
  series: { ctx: SeriesGroupContext; attrs: SeriesAttrs };
  /** A grid line of an axis at a tick: a `line` (class `ct-grid`). */
  grid: { ctx: GridContext; attrs: LineAttrs };
  /** The `rect` behind the chart area (class `ct-grid-background`). */
  gridBackground: { ctx: NoSeries; attrs: RectAttrs };
  /**
   * An axis label (a `foreignObject` with a `span`, or SVG `text`) or a
   * pie label (SVG `text`). Check `ctx.kind` to tell them apart.
   */
  label: { ctx: AxisLabelContext | PieLabelContext; attrs: object };
  /** A filled piece of a `band()` layer: a `path` (class `ct-band-area`). */
  band: { ctx: BandContext; attrs: PathAttrs };
}

/** A role name, such as `point` or `bar`: a key of {@link NodeRoles}. */
export type NodeRole = keyof NodeRoles;
