import type {
  Options,
  Label,
  Data,
  FlatSeries,
  CreatedEvent,
  DrawEvent,
  NormalizedSeriesValue
} from '../../core';
import type { RequiredKeys } from '../../utils';
import type { SvgPath } from '../../svg';
import type { BaseChartEventsTypes } from '../types';

/** The data of a pie chart: one value per slice, and labels for the slices. */
export type PieChartData = Data<FlatSeries>;

/** Which way pie labels anchor: see `labelDirection` in {@link PieChartOptions}. */
export type LabelDirection = 'implode' | 'neutral' | 'explode';

/** The `text-anchor` of a pie label: `'start'`, `'middle'` or `'end'`. */
export type AnchorPosition = 'start' | 'middle' | 'end';

/** Where pie labels go: see `labelPosition` in {@link PieChartOptions}. */
export type RadialLabelPosition = 'inside' | 'center' | 'outside';

/** A point in px, such as the center of a pie. */
export interface Dot {
  /** The x, in px. */
  x: number;
  /** The y, in px. */
  y: number;
}

/**
 * The options of a pie or donut chart (1.x `PieChart`, and `pieChart`).
 *
 * @deprecated For `pieChart()`, the options type is `PieChartPresetOptions`. Removed in 3.0.
 */
export interface PieChartOptions extends Omit<Options, 'axisX' | 'axisY'> {
  /**
   * The class names of the chart's elements. Change them to style the
   * chart with your own CSS instead of Chartist's.
   */
  classNames?: {
    /** The chart's SVG element, for pies. */
    chartPie?: string;
    /** The chart's SVG element, for donuts. */
    chartDonut?: string;
    /** The group of each series. */
    series?: string;
    /** Each pie slice. */
    slicePie?: string;
    /** Each donut slice. */
    sliceDonut?: string;
    /** Each axis label. */
    label?: string;
  };
  /** Where the first slice starts, in degrees clockwise from the top. */
  startAngle?: number;
  /**
   * The value a full circle stands for. With a total above the sum of the
   * values, the pie stays open, as for a gauge.
   */
  total?: number;
  /** Draws a donut: rings instead of filled slices. */
  donut?: boolean;
  /**
   * The width of a donut's ring: px as a number, or a share of the radius as
   * a string (`'30%'`). Without it, the stylesheet sets the width
   * (`--ct-donut-width`, 60px by default), and the ring is laid out for
   * 60 px.
   */
  donutWidth?: number | string;
  /** Draws a label for each slice. */
  showLabel?: boolean;
  /**
   * Moves the labels away from the center (positive) or toward it
   * (negative), in px.
   */
  labelOffset?: number;
  /**
   * Where labels go: `inside` (halfway out on a pie, on the middle of a
   * donut's ring, plus `labelOffset`), `outside` (at the outer edge) or
   * `center` (in the middle; move them with `labelOffset`).
   */
  labelPosition?: RadialLabelPosition;
  /**
   * Turns each slice's label (or value) and index into the text to show.
   * Return `null` or `undefined` to leave a label out.
   */
  labelInterpolationFnc?(value: Label, index: number): Label | null | undefined;
  /**
   * Which way labels anchor: `neutral`, `explode` (away from the center,
   * for labels outside the pie) or `implode` (toward it).
   */
  labelDirection?: LabelDirection;
  /** Leaves out the slices and labels of empty values. */
  ignoreEmptyValues?: boolean;
  /**
   * Moves labels apart so they don't overlap, using this offset in px. The
   * overlap is judged by the length of the drawn label text. 0 leaves them
   * where they are.
   */
  preventOverlappingLabelOffset?: number;
}

/**
 * {@link PieChartOptions} after the defaults are applied: the 1.x `PieChart` works with these.
 *
 * @deprecated The resolved options of the 1.x `PieChart`. Removed in 3.0.
 */
export type PieChartOptionsWithDefaults = RequiredKeys<
  PieChartOptions,
  | 'chartPadding'
  | 'startAngle'
  | 'showLabel'
  | 'labelOffset'
  | 'labelPosition'
  | 'labelInterpolationFnc'
  | 'labelDirection'
  | 'preventOverlappingLabelOffset',
  'classNames'
>;

/**
 * The payload of a pie chart's 1.x `created` event: as for other charts, without axes.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export type PieChartCreatedEvent = Omit<
  CreatedEvent<PieChartOptions>,
  'axisX' | 'axisY'
>;

/**
 * The 1.x `draw` event of a pie or donut slice, one per value. `index` is
 * the slice's index and `series` its value as given in the data.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export interface SliceDrawEvent extends Omit<
  DrawEvent,
  'axisX' | 'axisY' | 'seriesIndex'
> {
  /** Always `'slice'`. */
  type: 'slice';
  /** The slice's value. */
  value: NormalizedSeriesValue;
  /** The value of the full circle: the sum of all values, or the `total` option. */
  totalDataSum: number;
  /** The slice's path as drawn (a copy, safe to change). */
  path: SvgPath;
  /** The center of the pie, in px. */
  center: Dot;
  /** The radius of the pie, in px. */
  radius: number;
  /** Where the slice starts, in degrees clockwise from the top. */
  startAngle: number;
  /** Where the slice ends, in degrees clockwise from the top. */
  endAngle: number;
}

/**
 * The 1.x `draw` event of a pie slice's label. `index` is the slice's
 * index; the label is a `text` element anchored at `x`, `y`.
 *
 * @deprecated Import it from `chartist/compat`, which turns on the 1.x events and plugins. Removed in 3.0.
 */
export interface SliceLabelDrawEvent extends Omit<
  DrawEvent,
  'axisX' | 'axisY' | 'seriesIndex'
> {
  /** Always `'label'`. */
  type: 'label';
  /** The label as shown, after `labelInterpolationFnc`. */
  text: string;
  /** The x the label is anchored at, in px. */
  x: number;
  /** The y the label is anchored at, in px. */
  y: number;
}

/**
 * The 1.x events of a {@link PieChart} and their payloads, by event name.
 *
 * @deprecated The 1.x events of a `PieChart`. On `pieChart()`, the handle's `on()` knows its events. Removed in 3.0.
 */
export type PieChartEventsTypes = BaseChartEventsTypes<
  PieChartCreatedEvent,
  SliceDrawEvent | SliceLabelDrawEvent
>;
