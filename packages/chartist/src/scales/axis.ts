/**
 * v2 axes: plain objects created by factories. Same scale math as the 1.x
 * axis classes; see stepAxis, autoScaleAxis and fixedScaleAxis.
 */
import type {
  AxisOptions,
  ChartPadding,
  Label,
  NormalizedSeries,
  NormalizedSeriesPrimitiveValue
} from '../core/types';
import type {
  Area,
  Layer,
  NormalizedChartData,
  PreparedData
} from '../pipeline/types';

/** Which way an axis runs: `x` (horizontal) or `y` (vertical). */
export type AxisDimension = 'x' | 'y';

/** Where an axis sits: `top`/`bottom` are X axes, `left`/`right` Y axes. */
export type AxisSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * What an {@link AxisFactory} gets to create an axis: its direction, the
 * data, the chart area and the axis options.
 */
export interface AxisContext {
  /** Which way the axis runs: `x` or `y`, from its side. */
  readonly dimension: AxisDimension;
  /**
   * Normalized multi-value series (`{ x, y }` values): the series bound to
   * the axis, or all of them.
   */
  readonly series: NormalizedSeries[];
  /** Normalized labels, padded to the longest series. */
  readonly labels: readonly Label[];
  /** The chart area in px, with the offsets of all axes reserved. */
  readonly area: Area;
  /** The options of the axis definition, without `id`, `side` and `type`. */
  readonly options: AxisOptions;
  /**
   * The range the layers drawn on the axis need beyond their values, such
   * as the sums of stacked bars (see {@link Layer.extent}). Scale axes
   * include it in the range they fit to the data; their own `low` and
   * `high` still win.
   */
  readonly extent?: AxisExtent;
}

/**
 * A range of values on an axis, from `low` to `high`: what a layer reports
 * in {@link Layer.extent}.
 */
export interface AxisExtent {
  /** The lowest value. */
  readonly low: number;
  /** The highest value. */
  readonly high: number;
}

/**
 * A positioned axis: ticks, range and projection into px along the axis.
 * An {@link AxisFactory} creates it once the chart area is known; layers
 * read it to place what they draw.
 */
export interface ScaleAxis {
  /** Which way the axis runs: `x` or `y`. */
  readonly dimension: AxisDimension;
  /** The axis type, e.g. `step`, `autoScale`, `fixedScale`. */
  readonly kind: string;
  /** Step axes: whether the last tick sits at the axis end. */
  readonly stretch?: boolean;
  /** Step axes: the distance between two ticks in px. */
  readonly step?: number;
  /**
   * The values at which grid lines and labels are drawn: labels on a step
   * axis, numbers on a scale.
   */
  readonly ticks: readonly Label[];
  /**
   * The values at the axis start (`min`) and end (`max`). Step axes have
   * none.
   */
  readonly range?: { readonly min: number; readonly max: number };
  /** Axis length in px. */
  readonly length: number;
  /**
   * Places a value on the axis: the distance in px from the axis start
   * (left, or bottom for y). Step axes place by `index` instead.
   */
  project(
    value: NormalizedSeriesPrimitiveValue | Label,
    index?: number,
    series?: NormalizedSeries
  ): number;
}

/**
 * An axis type: creates the axis once the chart area and data are known.
 * {@link stepAxis}, {@link autoScaleAxis} and {@link fixedScaleAxis} return
 * one; write your own for a scale they don't cover. It goes in the `type`
 * of an axis.
 */
export interface AxisFactory {
  /**
   * The axis type, e.g. `step`. The axis it creates has the same `kind`;
   * the line and bar layers center on `step` axes.
   */
  readonly kind: string;
  /**
   * Creates the axis for a chart area and data. Runs on every layout, so
   * after resizes too.
   */
  create(context: AxisContext): ScaleAxis;
}

/** A 1.x axis class (or a custom subclass of the 1.x `Axis`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LegacyAxisClass = abstract new (...args: any[]) => unknown;

/**
 * An axis's setup: an axis type plus the 1.x axis options (`offset`,
 * `low`, `high`, `ticks`, `showGrid`, …).
 */
export interface AxisSetup extends Omit<AxisOptions, 'type'> {
  /** A v2 axis factory, or a 1.x axis class. */
  readonly type: AxisFactory | LegacyAxisClass;
}

/**
 * An axis of a composed chart, in the list form of {@link cartesianAxes}:
 * an id that layers bind to, a side, a type and the 1.x axis options.
 */
export interface AxisDefinition extends AxisSetup {
  /**
   * Names the axis, for the `x` and `y` of layers and the `axes` of
   * {@link axisGrid} and {@link axisLabels}. Ids must be unique.
   */
  readonly id: string;
  /**
   * Where the axis sits: `bottom` or `top` makes an X axis, `left` or
   * `right` a Y axis. Axes on the same side stack outward in list order.
   */
  readonly side: AxisSide;
}

/**
 * The config of {@link cartesianAxes}: one X and one Y axis in the 1.x
 * form, or a list of axes, plus how the data is read.
 */
export interface AxesConfig {
  /**
   * The X axis in the 1.x form: at the bottom, or the top with
   * `position: 'start'`. Its `offset` defaults to 30 px.
   */
  readonly x?: AxisSetup;
  /**
   * The Y axis in the 1.x form: on the left, or the right with
   * `position: 'end'`. Its `offset` defaults to 40 px.
   */
  readonly y?: AxisSetup;
  /** The axis list form; used instead of `x`/`y`. */
  readonly axes?: readonly AxisDefinition[];
  /** Reverse labels and series before projecting (1.x `reverseData`). */
  readonly reverseData?: boolean;
  /**
   * How values are normalized (1.x `normalizeData`): `multi` is `true` for
   * `{ x, y }` values, or the dimension single values go to; `distributed`
   * turns a flat series into one series per value.
   */
  readonly normalize?: {
    readonly multi?: true | AxisDimension;
    readonly distributed?: boolean;
  };
}

/**
 * A created axis with its place in the chart: what the axis layers draw,
 * and what a layer finds in `axes.all`.
 */
export interface PlacedScaleAxis extends ScaleAxis {
  /** The axis id: from its definition, or `x` and `y` in the 1.x form. */
  readonly id: string;
  /** The side the axis sits on. */
  readonly side: AxisSide;
  /** Distance in px from the chart area to this axis's band (stacking). */
  readonly inset: number;
  /** The axis options (offset, labels, grid), without the type. */
  readonly options: Omit<AxisSetup, 'type'>;
}

/** The axes of a laid-out chart. */
export interface ChartAxes {
  /** The X axis (for layers: the bound one; for the chart: the first). */
  readonly x?: ScaleAxis;
  /** The Y axis (for layers: the bound one; for the chart: the first). */
  readonly y?: ScaleAxis;
  /** All axes of the chart, in declaration order. */
  readonly all?: readonly PlacedScaleAxis[];
}

/**
 * Axes for a chart's `axes` option, created by {@link cartesianAxes}. The
 * pipeline asks them for the chart area and, after `layout`, to create the
 * axes. Charts without axes don't bundle any of this.
 */
export interface CartesianAxes {
  /** The config the axes were created from, with the default offsets filled in. */
  readonly config: AxesConfig;
  /** The chart area with the axis offsets reserved. */
  area(
    width: number,
    height: number,
    padding: ChartPadding
  ): { width: number; height: number; area: Area };
  /** The axis definitions, in declaration order. */
  readonly definitions: readonly AxisDefinition[];
  /**
   * Each layer's axis ids and series selection, checked against the data.
   * Without it, every layer draws all series on the first X and Y axis.
   */
  bind?(layers: readonly Layer[], data: PreparedData): LayerBinding[];
  /**
   * The axes for the final chart area, and the data as they see it. With
   * `bindings`, each axis's range comes only from the series bound to it.
   * With `layers`, it also covers the extents they report (see
   * {@link Layer.extent}).
   */
  create(
    data: PreparedData,
    area: Area,
    bindings?: readonly LayerBinding[],
    layers?: readonly Layer[]
  ): { axes: ChartAxes; normalized: NormalizedChartData };
}

/** How a layer is bound: its axis ids and series indexes. */
export interface LayerBinding {
  /** The id of the X axis the layer draws on. */
  readonly x?: string;
  /** The id of the Y axis the layer draws on. */
  readonly y?: string;
  /** Selected series indexes; undefined means all. */
  readonly series?: readonly number[];
}

export const directionOf = (side: AxisSide): AxisDimension =>
  side === 'top' || side === 'bottom' ? 'x' : 'y';

/**
 * The `{ x, y }` shorthand as definitions, with sides from the 1.x
 * `position`: X at the bottom unless `'start'`, Y on the left unless
 * `'end'`.
 */
export function definitionsOf(config: AxesConfig): readonly AxisDefinition[] {
  if (config.axes) {
    return config.axes;
  }
  const definitions: AxisDefinition[] = [];
  if (config.x) {
    definitions.push({
      ...config.x,
      id: 'x',
      side: config.x.position === 'start' ? 'top' : 'bottom'
    });
  }
  if (config.y) {
    definitions.push({
      ...config.y,
      id: 'y',
      side: config.y.position === 'end' ? 'right' : 'left'
    });
  }
  return definitions;
}

/** Per axis, the summed offsets of the axes before it on the same side. */
export function insetsOf(definitions: readonly AxisDefinition[]) {
  const sums: Record<AxisSide, number> = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };
  return definitions.map(definition => {
    const inset = sums[definition.side];
    sums[definition.side] += definition.offset || 0;
    return inset;
  });
}

export function axisLength(dimension: AxisDimension, area: Area) {
  return dimension === 'x' ? area.x2 - area.x1 : area.y1 - area.y2;
}

/**
 * The chart area for a chart with axes, as 1.x `createChartRect` computes
 * it, generalized to several axes per side: the offsets per side are
 * summed, and the area is at least 1 px.
 */
export function axisArea(
  width: number,
  height: number,
  padding: ChartPadding,
  axes: AxesConfig | readonly AxisDefinition[]
): { width: number; height: number; area: Area } {
  const definitions = Array.isArray(axes)
    ? (axes as readonly AxisDefinition[])
    : definitionsOf(axes as AxesConfig);
  const sum: Record<AxisSide, number> = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };
  for (const definition of definitions) {
    sum[definition.side] += definition.offset || 0;
  }
  const w = Math.max(
    width,
    sum.left + sum.right + padding.left + padding.right
  );
  const h = Math.max(
    height,
    sum.top + sum.bottom + padding.top + padding.bottom
  );
  const y2 = padding.top + sum.top;
  const y1 = Math.max(h - padding.bottom - sum.bottom, y2 + 1);
  const x1 = padding.left + sum.left;
  const x2 = Math.max(w - padding.right - sum.right, x1 + 1);
  return {
    width: w,
    height: h,
    area: { x1, y1, x2, y2, width: x2 - x1, height: y1 - y2 }
  };
}

export type { NormalizedSeriesPrimitiveValue };
