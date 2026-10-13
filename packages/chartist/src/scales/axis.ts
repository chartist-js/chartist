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
  NormalizedChartData,
  PreparedData
} from '../pipeline/types';

export type AxisDimension = 'x' | 'y';

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

export interface AxesConfig {
  readonly x?: AxisSetup;
  readonly y?: AxisSetup;
  /** Reverse labels and series before projecting (1.x `reverseData`). */
  readonly reverseData?: boolean;
}

/** The axes of a laid-out chart. */
export interface ChartAxes {
  readonly x?: ScaleAxis;
  readonly y?: ScaleAxis;
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
  /** The axes for the final chart area, and the data as they see it. */
  create(
    data: PreparedData,
    area: Area
  ): { axes: ChartAxes; normalized: NormalizedChartData };
}

export function axisLength(dimension: AxisDimension, area: Area) {
  return dimension === 'x' ? area.x2 - area.x1 : area.y1 - area.y2;
}

/**
 * The chart area for a chart with axes, as 1.x `createChartRect` computes
 * it: axis offsets on their side, at least 1 px of area.
 */
export function axisArea(
  width: number,
  height: number,
  padding: ChartPadding,
  axes: AxesConfig
): { width: number; height: number; area: Area } {
  const yOffset = axes.y?.offset || 0;
  const xOffset = axes.x?.offset || 0;
  const w = Math.max(width, yOffset + padding.left + padding.right);
  const h = Math.max(height, xOffset + padding.top + padding.bottom);

  let y1: number;
  let y2: number;
  if (axes.x?.position === 'start') {
    y2 = padding.top + xOffset;
    y1 = Math.max(h - padding.bottom, y2 + 1);
  } else {
    y2 = padding.top;
    y1 = Math.max(h - padding.bottom - xOffset, y2 + 1);
  }

  let x1: number;
  let x2: number;
  if (axes.y?.position === 'start') {
    x1 = padding.left + yOffset;
    x2 = Math.max(w - padding.right, x1 + 1);
  } else {
    x1 = padding.left;
    x2 = Math.max(w - padding.right - yOffset, x1 + 1);
  }

  return {
    width: w,
    height: h,
    area: { x1, y1, x2, y2, width: x2 - x1, height: y1 - y2 }
  };
}

export type { NormalizedSeriesPrimitiveValue };
