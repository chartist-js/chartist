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

export type AxisDimension = 'x' | 'y';

/** Where an axis sits: `top`/`bottom` are X axes, `left`/`right` Y axes. */
export type AxisSide = 'top' | 'bottom' | 'left' | 'right';

export interface AxisContext {
  readonly dimension: AxisDimension;
  /** Normalized multi-value series (`{ x, y }` values). */
  readonly series: NormalizedSeries[];
  /** Normalized labels, padded to the longest series. */
  readonly labels: readonly Label[];
  readonly area: Area;
  readonly options: AxisOptions;
}

/**
 * A positioned axis: ticks, range and projection into px along the axis.
 * @experimental
 */
export interface ScaleAxis {
  readonly dimension: AxisDimension;
  /** The axis type, e.g. `step`, `autoScale`, `fixedScale`. */
  readonly kind: string;
  /** Step axes: whether the last tick sits at the axis end. */
  readonly stretch?: boolean;
  /** Step axes: the distance between two ticks in px. */
  readonly step?: number;
  readonly ticks: readonly Label[];
  readonly range?: { readonly min: number; readonly max: number };
  /** Axis length in px. */
  readonly length: number;
  /** Distance in px from the axis start (left, or bottom for y). */
  project(
    value: NormalizedSeriesPrimitiveValue | Label,
    index?: number,
    series?: NormalizedSeries
  ): number;
}

/**
 * Creates an axis once the chart area and data are known.
 * @experimental
 */
export interface AxisFactory {
  readonly kind: string;
  create(context: AxisContext): ScaleAxis;
}

/** A 1.x axis class (or a custom subclass of the 1.x `Axis`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LegacyAxisClass = abstract new (...args: any[]) => unknown;

/** Axis configuration: an axis type plus the 1.x axis options. */
export interface AxisSetup extends Omit<AxisOptions, 'type'> {
  /** A v2 axis factory, or a 1.x axis class. */
  readonly type: AxisFactory | LegacyAxisClass;
}

/**
 * An axis of a composed chart: an id that layers bind to, a side, a type
 * and the 1.x axis options.
 * @experimental
 */
export interface AxisDefinition extends AxisSetup {
  readonly id: string;
  readonly side: AxisSide;
}

export interface AxesConfig {
  readonly x?: AxisSetup;
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

/** A created axis with its place in the chart. */
export interface PlacedScaleAxis extends ScaleAxis {
  readonly id: string;
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
 * Axes for a chart's `axes` option, created by `cartesianAxes()`. The
 * pipeline asks them for the chart area and, after `layout`, to create the
 * axes. Charts without axes don't bundle any of this.
 * @experimental
 */
export interface CartesianAxes {
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
   */
  create(
    data: PreparedData,
    area: Area,
    bindings?: readonly LayerBinding[]
  ): { axes: ChartAxes; normalized: NormalizedChartData };
}

/** How a layer is bound: its axis ids and series indexes. */
export interface LayerBinding {
  readonly x?: string;
  readonly y?: string;
  /** Selected series indexes; undefined means all. */
  readonly series?: readonly number[];
}

export const directionOf = (side: AxisSide): AxisDimension =>
  side === 'top' || side === 'bottom' ? 'x' : 'y';

/** The `{ x, y }` shorthand as definitions: sides from the 1.x `position`. */
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
      side: config.y.position === 'start' ? 'left' : 'right'
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
