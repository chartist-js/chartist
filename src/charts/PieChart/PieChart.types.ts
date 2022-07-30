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
  classNames?: {
    chartPie?: string;
    chartDonut?: string;
    series?: string;
    slicePie?: string;
    sliceDonut?: string;
    label?: string;
  };
  startAngle?: number;
  total?: number;
  donut?: boolean;
  donutWidth?: number | string;
  showLabel?: boolean;
  labelOffset?: number;
  labelPosition?: RadialLabelPosition;
  labelInterpolationFnc?(value: Label, index: number): Label | null | undefined;
  labelDirection?: LabelDirection;
  reverseData?: boolean;
  ignoreEmptyValues?: boolean;
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
  | 'labelDirection',
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
