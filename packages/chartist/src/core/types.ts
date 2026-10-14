import type { RequiredKeys } from '../utils';
import type { Axis, AxisType } from '../axes';
import type { Svg } from '../svg';

/** Space in px between the chart's edges and its drawing area, per side. */
export interface ChartPadding {
  /** Space above the drawing area, in px. */
  top: number;
  /** Space right of the drawing area, in px. */
  right: number;
  /** Space below the drawing area, in px. */
  bottom: number;
  /** Space left of the drawing area, in px. */
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

/** The size of an SVG `viewBox`. */
export interface ViewBox {
  /** The viewBox width, in SVG units. */
  width: number;
  /** The viewBox height, in SVG units. */
  height: number;
}

export interface Options<
  TXAxisOptions = AxisOptions,
  TYAxisOptions = TXAxisOptions
> {
  /**
   * The chart's width: px as a number, or a CSS length such as `'100%'`.
   * Without it, the chart takes the width of its container.
   */
  width?: number | string;
  /**
   * The chart's height: px as a number, or a CSS length such as `'300px'`.
   * Without it, the chart takes the height of its container.
   */
  height?: number | string;
  /**
   * The lowest value the value axis shows, instead of the data's lowest.
   * Values below it are drawn outside the drawing area.
   */
  low?: number;
  /**
   * The highest value the value axis shows, instead of the data's highest.
   * Values above it are drawn outside the drawing area.
   */
  high?: number;
  /**
   * A value the value axis always includes, such as 0, so it shows even
   * when all values are above or below it. Bar charts use 0.
   */
  referenceValue?: number;
  /**
   * Space in px between the chart's edges and its drawing area (labels sit
   * in it): one number for every side, or an object with some sides.
   */
  chartPadding?: number | Partial<ChartPadding>;
  /** Options of the X axis. */
  axisX?: TXAxisOptions;
  /** Options of the Y axis. */
  axisY?: TYAxisOptions;
  /**
   * The class names of the chart's elements, to style a chart with your
   * own classes instead of Chartist's.
   */
  classNames?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  /**
   * 1.x plugin functions (they run with the compat plugin) and v2 plugins
   * such as `compat`.
   */
  plugins?: (
    | Plugin
    | [Plugin, any]
    | { readonly name: string; install(chart: any, options?: any): void }
  )[];
  /**
   * A `viewBox` for the SVG, so the drawing scales with its box instead of
   * being drawn for its size. Text scales too: adjust it with responsive
   * options.
   */
  viewBox?: ViewBox;
}

/** The options of one axis of a line or bar chart. */
export interface AxisOptions {
  /**
   * The axis type: `StepAxis` (one step per label), `AutoScaleAxis` (a
   * scale fitted to the values) or `FixedScaleAxis` (fixed ticks).
   */
  type?: AxisType;
  /** The lowest value this axis shows, instead of the data's lowest. */
  low?: number;
  /** The highest value this axis shows, instead of the data's highest. */
  high?: number;
  /** A value this axis always includes, such as 0. */
  referenceValue?: number;
  /** Room in px for the axis labels, between the drawing area and the chart's edge. */
  offset?: number;
  /**
   * Where the labels go: `start` (left or top) or `end` (right or
   * bottom).
   */
  position?: 'start' | 'end';
  /** Moves the labels by `x` and `y` px from where they'd go. */
  labelOffset?: {
    x: number;
    y: number;
  };
  /** Draws the axis labels. */
  showLabel?: boolean;
  /** Draws the grid lines of the axis. */
  showGrid?: boolean;
  /**
   * Turns each label (and its index) into the text to show. Return `null`
   * or `undefined` to leave a label out.
   */
  labelInterpolationFnc?(value: Label, index: number): Label | null | undefined;
  /**
   * The minimum space in px between two grid lines of a scale: the scale
   * takes fewer, larger steps to keep it.
   */
  scaleMinSpace?: number;
  /** Only whole numbers on the scale. */
  onlyInteger?: boolean;
  /**
   * The ticks: the labels of a step axis, or the values of a fixed scale
   * axis.
   */
  ticks?: Label[];
  /**
   * Step axis: spreads the ticks over the whole axis, so the last one lands
   * on its end (line charts with `fullWidth` set it).
   */
  stretch?: boolean;
  /**
   * Fixed scale axis without `ticks`: the number of equal steps between
   * its low and high.
   */
  divisor?: number;
  /**
   * The value range of a scale as `{ high, low }`, instead of the one
   * computed from the data.
   */
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

/**
 * Chart data: the series, and labels for the positions of their values (or
 * for the slices of a pie).
 */
export interface Data<T extends AllSeriesTypes = AllSeriesTypes> {
  /**
   * One label per value position: the steps of the X axis in line and bar
   * charts, the slices in pie charts.
   */
  labels?: Label[] | undefined;
  /**
   * The values: an array per series (or a series object with a name, class
   * name and meta), or one flat array for pies and distributed bars.
   */
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

export interface GridDrawEvent extends Omit<
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

export interface LabelDrawEvent extends Omit<
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
