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

export type LabelDirection = 'implode' | 'neutral' | 'explode';

export type AnchorPosition = 'start' | 'middle' | 'end';

export type RadialLabelPosition = 'inside' | 'center' | 'outside';

export interface Dot {
  x: number;
  y: number;
}

/** The options of a pie or donut chart (1.x `PieChart`, and `pieChart`). */
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
   * a string (`'30%'`).
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
   * Where labels go: `inside` (halfway out, plus `labelOffset`), `outside`
   * (at the edge) or `center` (in the middle; move them with
   * `labelOffset`).
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
   * Moves labels apart so they don't overlap, using this offset in px. 0
   * leaves them where they are.
   */
  preventOverlappingLabelOffset?: number;
}

export type PieChartOptionsWithDefaults = RequiredKeys<
  PieChartOptions,
  | 'chartPadding'
  | 'startAngle'
  | 'donutWidth'
  | 'showLabel'
  | 'labelOffset'
  | 'labelPosition'
  | 'labelInterpolationFnc'
  | 'labelDirection'
  | 'preventOverlappingLabelOffset',
  'classNames'
>;

export type PieChartCreatedEvent = Omit<
  CreatedEvent<PieChartOptions>,
  'axisX' | 'axisY'
>;

export interface SliceDrawEvent extends Omit<
  DrawEvent,
  'axisX' | 'axisY' | 'seriesIndex'
> {
  type: 'slice';
  value: NormalizedSeriesValue;
  totalDataSum: number;
  path: SvgPath;
  center: Dot;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface SliceLabelDrawEvent extends Omit<
  DrawEvent,
  'axisX' | 'axisY' | 'seriesIndex'
> {
  type: 'label';
  text: string;
  x: number;
  y: number;
}

export type PieChartEventsTypes = BaseChartEventsTypes<
  PieChartCreatedEvent,
  SliceDrawEvent | SliceLabelDrawEvent
>;
