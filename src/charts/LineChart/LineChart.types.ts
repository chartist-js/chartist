import type {
  Options,
  AxisOptions,
  Data,
  Series,
  SeriesObject,
  SegmentData,
  CreatedEvent,
  DrawEvent,
  NormalizedSeriesValue,
  NormalizedSeries,
  AxesDrawEvent
} from '../../core';
import type { SvgPath } from '../../svg';
import type { RequiredKeys } from '../../utils';
import type { BaseChartEventsTypes } from '../types';

export type LineInterpolation = (
  pathCoordinates: number[],
  valueData: SegmentData[]
) => SvgPath;

export type LineChartData = Data<(Series | SeriesObject)[]>;

export interface LineChartOptions<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> extends Options<TXAxisOptions, TYAxisOptions> {
  classNames?: {
    chart?: string;
    label?: string;
    labelGroup?: string;
    series?: string;
    line?: string;
    point?: string;
    area?: string;
    grid?: string;
    gridGroup?: string;
    gridBackground?: string;
    vertical?: string;
    horizontal?: string;
    start?: string;
    end?: string;
  };
  showLine?: boolean;
  showPoint?: boolean;
  showArea?: boolean;
  areaBase?: number;
  lineSmooth?: boolean | LineInterpolation;
  showGridBackground?: boolean;
  fullWidth?: boolean;
  reverseData?: boolean;
  series?: Record<
    string,
    Omit<LineChartOptions<TXAxisOptions, TYAxisOptions>, 'series'>
  >;
}

export type LineChartOptionsWithDefaults = RequiredKeys<
  LineChartOptions<
    RequiredKeys<
      AxisOptions,
      | 'offset'
      | 'position'
      | 'labelOffset'
      | 'showLabel'
      | 'showGrid'
      | 'labelInterpolationFnc'
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
  | 'showLine'
  | 'showPoint'
  | 'areaBase'
  | 'lineSmooth'
  | 'chartPadding'
  | 'axisX'
  | 'axisY',
  'classNames'
>;

export type LineChartCreatedEvent = CreatedEvent<LineChartOptions>;

export interface PointDrawEvent extends DrawEvent {
  type: 'point';
  value: NormalizedSeriesValue;
  x: number;
  y: number;
}

export interface LineDrawEvent extends DrawEvent {
  type: 'line';
  values: NormalizedSeries;
  path: SvgPath;
}

export interface AreaDrawEvent extends DrawEvent {
  type: 'area';
  values: NormalizedSeries;
  path: SvgPath;
}

export type LineChartEventsTypes = BaseChartEventsTypes<
  LineChartCreatedEvent,
  AxesDrawEvent | PointDrawEvent | LineDrawEvent | AreaDrawEvent
>;
