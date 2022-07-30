import type {
  Options,
  AxisOptions,
  Data,
  CreatedEvent,
  DrawEvent,
  NormalizedMulti,
  AxesDrawEvent
} from '../../core';
import type { RequiredKeys } from '../../utils';
import type { BaseChartEventsTypes } from '../types';

export type BarChartData = Data;

export interface BarChartOptions<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> extends Options<TXAxisOptions, TYAxisOptions> {
  classNames?: {
    chart?: string;
    horizontalBars?: string;
    label?: string;
    labelGroup?: string;
    series?: string;
    bar?: string;
    grid?: string;
    gridGroup?: string;
    gridBackground?: string;
    vertical?: string;
    horizontal?: string;
    start?: string;
    end?: string;
  };
  seriesBarDistance?: number;
  stackBars?: boolean;
  stackMode?: 'accumulate' | boolean;
  horizontalBars?: boolean;
  distributeSeries?: boolean;
  reverseData?: boolean;
  showGridBackground?: boolean;
}

export type BarChartOptionsWithDefaults = RequiredKeys<
  BarChartOptions<
    RequiredKeys<
      AxisOptions,
      | 'offset'
      | 'position'
      | 'labelOffset'
      | 'showLabel'
      | 'showGrid'
      | 'labelInterpolationFnc'
      | 'scaleMinSpace'
    >,
    RequiredKeys<
      AxisOptions,
      | 'offset'
      | 'position'
      | 'labelOffset'
      | 'showLabel'
      | 'showGrid'
      | 'labelInterpolationFnc'
      | 'scaleMinSpace'
    >
  >,
  | 'referenceValue'
  | 'chartPadding'
  | 'seriesBarDistance'
  | 'stackMode'
  | 'axisX'
  | 'axisY',
  'classNames'
>;

export type BarChartCreatedEvent = CreatedEvent<BarChartOptions>;

export interface BarDrawEvent extends DrawEvent {
  type: 'bar';
  value: number | NormalizedMulti;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type BarChartEventsTypes = BaseChartEventsTypes<
  BarChartCreatedEvent,
  AxesDrawEvent | BarDrawEvent
>;
