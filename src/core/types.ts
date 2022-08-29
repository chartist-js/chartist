import type { RequiredKeys } from '../utils';
import type { Axis, AxisType } from '../axes';
import type { Svg } from '../svg';

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartRect {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  padding: ChartPadding;
  width(): number;
  height(): number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Plugin = (chart: any, options?: any) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Meta = any;

export interface Options<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> {
  /**
   * Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
   */
  width?: number | string;
  /**
   * Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
   */
  height?: number | string;
  /**
   * Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
   */
  low?: number;
  /**
   * Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
   */
  high?: number;
  /**
   * Unless low/high are explicitly set, bar chart will be centered at zero by default. Set referenceValue to null to auto scale.
   */
  referenceValue?: number;
  /**
   *  Padding of the chart drawing area to the container element and labels as a number or padding object.
   */
  chartPadding?: number | Partial<ChartPadding>;
  /**
   * Options for X-Axis
   */
  axisX?: TXAxisOptions;
  /**
   * Options for Y-Axis
   */
  axisY?: TYAxisOptions;
  /**
   * Override the class names that get used to generate the SVG structure of the chart
   */
  classNames?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins?: (Plugin | [Plugin, any])[];
}

export interface AxisOptions {
  type?: AxisType;
  /**
   * Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
   */
  low?: number;
  /**
   * Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
   */
  high?: number;
  /**
   * Unless low/high are explicitly set, bar chart will be centered at zero by default. Set referenceValue to null to auto scale.
   */
  referenceValue?: number;
  /**
   * The offset of the chart drawing area to the border of the container
   */
  offset?: number;
  /**
   * Position where labels are placed.
   * Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
   */
  position?: 'start' | 'end';
  /**
   * Allows you to correct label positioning on this axis by positive or negative x and y offset.
   */
  labelOffset?: {
    x: number;
    y: number;
  };
  /**
   * If labels should be shown or not
   */
  showLabel?: boolean;
  /**
   * If the axis grid should be drawn or not
   */
  showGrid?: boolean;
  /**
   * Interpolation function that allows you to intercept the value from the axis label
   */
  labelInterpolationFnc?(value: Label, index: number): Label | null | undefined;
  /**
   * This value specifies the minimum width in pixel of the scale steps
   */
  scaleMinSpace?: number;
  /**
   * Use only integer values (whole numbers) for the scale steps
   */
  onlyInteger?: boolean;
  ticks?: Label[];
  stretch?: boolean;
  divisor?: number;
  highLow?: {
    high: number;
    low: number;
  };
}

export type OptionsWithDefaults = RequiredKeys<
  Options<
    RequiredKeys<
      AxisOptions,
      'offset' | 'labelOffset' | 'labelInterpolationFnc'
    >,
    RequiredKeys<
      AxisOptions,
      'offset' | 'labelOffset' | 'labelInterpolationFnc'
    >
  >,
  'axisX' | 'axisY' | 'classNames'
>;

export type ResponsiveOptions<T = Options> = [string, T][];

export interface Bounds {
  high: number;
  low: number;
  valueRange: number;
  oom: number;
  step: number;
  min: number;
  max: number;
  range: number;
  numberOfSteps: number;
  values: number[];
}

export interface Segment {
  pathCoordinates: number[];
  valueData: SegmentData[];
}

export interface SegmentData {
  value: NormalizedSeriesValue;
  valueIndex: number;
  meta?: Meta;
}

export type AxisName = 'x' | 'y';

export type Multi =
  | {
      x: number | string | Date | null;
      y: number | string | Date | null;
    }
  | {
      x: number | string | Date | null;
    }
  | {
      y: number | string | Date | null;
    };

export type NormalizedMulti =
  | {
      x: number;
      y: number;
    }
  | {
      x: number;
    }
  | {
      y: number;
    };

/**
 * Data
 */

export type Label = string | number | Date;

export type AllSeriesTypes = FlatSeries | (Series | SeriesObject)[];

export interface Data<T extends AllSeriesTypes = AllSeriesTypes> {
  labels?: Label[] | undefined;
  series: T;
}

/**
 * Series
 */

export type Series<T = SeriesPrimitiveValue> = SeriesValue<T>[];

export interface SeriesObject<T = SeriesPrimitiveValue> {
  name?: string;
  className?: string;
  meta?: Meta;
  data: SeriesValue<T>[];
}

export type SeriesValue<T = SeriesPrimitiveValue> = SeriesObjectValue<T> | T;

export type SeriesPrimitiveValue =
  | number
  | string
  | boolean
  | Date
  | Multi
  | null
  | undefined;

export interface SeriesObjectValue<T = SeriesPrimitiveValue> {
  meta?: Meta;
  value: T;
}

/**
 * Flat Series
 */

export type FlatSeries<T = FlatSeriesPrimitiveValue> = FlatSeriesValue<T>[];

export type FlatSeriesValue<T = FlatSeriesPrimitiveValue> =
  | SeriesValue<T>
  | FlatSeriesObjectValue<T>;

export type FlatSeriesPrimitiveValue = number | string | null | undefined;

export interface FlatSeriesObjectValue<T = FlatSeriesPrimitiveValue> {
  name?: string;
  className?: string;
  meta?: Meta;
  value: T;
}

/**
 * Normalized Data
 */

export type AllNormalizedSeriesTypes =
  | NormalizedFlatSeries
  | NormalizedSeries[];

export interface NormalizedData<
  T extends AllNormalizedSeriesTypes = AllNormalizedSeriesTypes
> extends Data {
  labels: Label[];
  series: T;
}

/**
 * Normalized Series
 */

export type NormalizedSeries = NormalizedSeriesValue[];

export type NormalizedSeriesValue = NormalizedSeriesPrimitiveValue;

export type NormalizedSeriesPrimitiveValue =
  | number
  | NormalizedMulti
  | undefined;

/**
 * Normalized Flat Series
 */

export type NormalizedFlatSeries = number[];

/**
 * Events
 */

export interface CreatedEvent<TOptions = Options> {
  chartRect: ChartRect;
  axisX: Axis;
  axisY: Axis;
  svg: Svg;
  options: TOptions;
}

export interface DrawEvent {
  type: string;
  element: Svg;
  group: Svg;
  chartRect: ChartRect;
  axisX: Axis;
  axisY: Axis;
  meta: Meta;
  index: number;
  series: FlatSeriesValue | Series | SeriesObject;
  seriesIndex: number;
}

export interface DataEvent {
  type: 'initial' | 'update';
  data: Data;
}

export interface OptionsChangedEvent<T = Options> {
  previousOptions: T;
  currentOptions: T;
}

export interface GridDrawEvent
  extends Omit<
    DrawEvent,
    'chartRect' | 'axisX' | 'axisY' | 'meta' | 'series' | 'seriesIndex'
  > {
  type: 'grid';
  axis: Axis;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GridBackgroundDrawEvent {
  type: 'gridBackground';
  group: Svg;
  element: Svg;
}

export interface LabelDrawEvent
  extends Omit<
    DrawEvent,
    'chartRect' | 'axisX' | 'axisY' | 'meta' | 'series' | 'seriesIndex'
  > {
  type: 'label';
  axis: Axis;
  text: Label;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AxesDrawEvent =
  | GridDrawEvent
  | GridBackgroundDrawEvent
  | LabelDrawEvent;
