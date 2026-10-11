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

export type PieChartData = Data<FlatSeries>;

export type LabelDirection = 'implode' | 'neutral' | 'explode';

export type AnchorPosition = 'start' | 'middle' | 'end';

export type RadialLabelPosition = 'inside' | 'center' | 'outside';

export interface Dot {
  x: number;
  y: number;
}

export interface PieChartOptions extends Omit<Options, 'axisX' | 'axisY'> {
  /**
   * Override the class names that are used to generate the SVG structure of the chart
   */
  classNames?: {
    chartPie?: string;
    chartDonut?: string;
    series?: string;
    slicePie?: string;
    sliceDonut?: string;
    label?: string;
  };
  /**
   * The start angle of the pie chart in degrees where 0 points north. A higher value offsets the start angle clockwise.
   */
  startAngle?: number;
  /**
   * An optional total you can specify. By specifying a total value, the sum of the values in the series must be this total in order to draw a full pie. You can use this parameter to draw only parts of a pie or gauge charts.
   */
  total?: number;
  /**
   * If specified the donut CSS classes will be used and strokes will be drawn instead of pie slices.
   */
  donut?: boolean;
  /**
   * Specify the donut stroke width, currently done in javascript for convenience. May move to CSS styles in the future.
   * This option can be set as number or string to specify a relative width (i.e. 100 or '30%').
   */
  donutWidth?: number | string;
  /**
   * If a label should be shown or not
   */
  showLabel?: boolean;
  /**
   * Label position offset from the standard position which is half distance of the radius. This value can be either positive or negative. Positive values will position the label away from the center.
   */
  labelOffset?: number;
  /**
   * This option can be set to 'inside', 'outside' or 'center'.
   * Positioned with 'inside' the labels will be placed on half the distance of the radius to the border of the Pie by respecting the 'labelOffset'.
   * The 'outside' option will place the labels at the border of the pie and 'center' will place the labels in the absolute center point of the chart.
   * The 'center' option only makes sense in conjunction with the 'labelOffset' option.
   */
  labelPosition?: RadialLabelPosition;
  /**
   * An interpolation function for the label value
   */
  labelInterpolationFnc?(value: Label, index: number): Label | null | undefined;
  /**
   * Label direction can be 'neutral', 'explode' or 'implode'.
   * The labels anchor will be positioned based on those settings as well as the fact if the labels are on the right or left side of the center of the chart.
   * Usually explode is useful when labels are positioned far away from the center.
   */
  labelDirection?: LabelDirection;
  /**
   * If true empty values will be ignored to avoid drawing unnecessary slices and labels
   */
  ignoreEmptyValues?: boolean;
  /**
   * If nonzero labels will not overlap.
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

export interface SliceDrawEvent
  extends Omit<DrawEvent, 'axisX' | 'axisY' | 'seriesIndex'> {
  type: 'slice';
  value: NormalizedSeriesValue;
  totalDataSum: number;
  path: SvgPath;
  center: Dot;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface SliceLabelDrawEvent
  extends Omit<DrawEvent, 'axisX' | 'axisY' | 'seriesIndex'> {
  type: 'label';
  text: string;
  x: number;
  y: number;
}

export type PieChartEventsTypes = BaseChartEventsTypes<
  PieChartCreatedEvent,
  SliceDrawEvent | SliceLabelDrawEvent
>;
