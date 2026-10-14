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

/**
 * The drawing area of a 1.x chart in px: `x1`, `y1` is its bottom left
 * corner and `x2`, `y2` its top right (SVG y grows downward, so `y1` is the
 * larger one).
 */
export interface ChartRect {
  /** The left edge of the drawing area, in px. */
  x1: number;
  /** The right edge of the drawing area, in px. */
  x2: number;
  /** The bottom edge of the drawing area, in px. */
  y1: number;
  /** The top edge of the drawing area, in px. */
  y2: number;
  /** The chart padding on each side, in px. */
  padding: ChartPadding;
  /** The width of the drawing area (`x2 - x1`), in px. */
  width(): number;
  /** The height of the drawing area (`y1 - y2`), in px. */
  height(): number;
}

/**
 * A 1.x plugin: a function that gets the chart object (and its options)
 * and registers listeners with `chart.on('draw', …)`. It runs with the
 * `compat` plugin from `chartist/compat`, whose `fromLegacyPlugin()` also
 * turns it into a v2 plugin.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Plugin = (chart: any, options?: any) => void;

/**
 * Anything you attach to a series or value as `meta`, such as a tooltip
 * text. Chartist doesn't read it: it hands it back in events and writes it
 * to the `ct:meta` attribute.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Meta = any;

/** The size of an SVG `viewBox`. */
export interface ViewBox {
  /** The viewBox width, in SVG units. */
  width: number;
  /** The viewBox height, in SVG units. */
  height: number;
}

/**
 * The options all 1.x charts share: size, value range, padding, axes, class
 * names and plugins. {@link LineChartOptions}, {@link BarChartOptions} and
 * {@link PieChartOptions} build on them.
 */
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
   * its low and high, with a tick at each end.
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

/** {@link Options} after the defaults are applied: the axes and class names are set. */
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

/**
 * The 1.x responsive options: `[mediaQuery, options]` pairs, applied over
 * the chart's options while the media query matches.
 */
export type ResponsiveOptions<T = Options> = [string, T][];

/** The scale {@link getBounds} computes for an axis: its range and steps. */
export interface Bounds {
  /** The highest value to show. */
  high: number;
  /** The lowest value to show. */
  low: number;
  /** `high - low`. */
  valueRange: number;
  /** The order of magnitude of the value range. */
  oom: number;
  /** The distance between two ticks. */
  step: number;
  /** The first tick: `low` rounded down to a step. */
  min: number;
  /** The last tick: `high` rounded up to a step. */
  max: number;
  /** `max - min`. */
  range: number;
  /** The number of steps between `min` and `max`. */
  numberOfSteps: number;
  /** The tick values, from `min` to `max`. */
  values: number[];
}

/** A run of points without holes, as {@link splitIntoSegments} returns it. */
export interface Segment {
  /** The points' coordinates in px, as `[x1, y1, x2, y2, …]`. */
  pathCoordinates: number[];
  /** The value of each point, in the same order. */
  valueData: SegmentData[];
}

/** A point's value, its index in the series and its meta. */
export interface SegmentData {
  /** The normalized value. */
  value: NormalizedSeriesValue;
  /** The value's index in its series. */
  valueIndex: number;
  /** The value's `meta`, if it has one. */
  meta?: Meta;
}

/** An axis dimension: `'x'` or `'y'`. */
export type AxisName = 'x' | 'y';

/**
 * A value with coordinates: `{ x, y }`, or only `x` or `y`. Line charts
 * draw `{ x, y }` values on two scale axes (scatter plots).
 */
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

/** A {@link Multi} value after normalizing: its coordinates as numbers. */
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

// Data

/** A label of an axis step or a pie slice. */
export type Label = string | number | Date;

/**
 * Every shape `series` can take: a {@link FlatSeries} (pies, distributed
 * bars), or a list of {@link Series} arrays and {@link SeriesObject}s.
 */
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

// Series

/**
 * A series as an array of values: `[5, 2, 4]`. Use a {@link SeriesObject}
 * to give it a name, class name or meta.
 */
export type Series<T = SeriesPrimitiveValue> = SeriesValue<T>[];

/**
 * A series with a name, class name or meta:
 * `{ name: 'Sales', data: [5, 2, 4] }`.
 */
export interface SeriesObject<T = SeriesPrimitiveValue> {
  /**
   * The series' name. Line charts look up per-series options in `series`
   * by it.
   */
  name?: string;
  /** A class name for the series' group, instead of `ct-series-a`, `-b`, … */
  className?: string;
  /** Anything to attach to the series, handed back in events. */
  meta?: Meta;
  /** The series' values. */
  data: SeriesValue<T>[];
}

/** A value of a series: a plain value, or `{ value, meta }`. */
export type SeriesValue<T = SeriesPrimitiveValue> = SeriesObjectValue<T> | T;

/**
 * A plain value of a series: a number (numeric strings are read as
 * numbers), a {@link Multi} `{ x, y }`, or `null` or `undefined` for a hole.
 */
export type SeriesPrimitiveValue =
  | number
  | string
  | boolean
  | Date
  | Multi
  | null
  | undefined;

/** A value with meta: `{ value: 5, meta: 'Tuesday' }`. */
export interface SeriesObjectValue<T = SeriesPrimitiveValue> {
  /** Anything to attach to the value, handed back in events. */
  meta?: Meta;
  /** The value. */
  value: T;
}

// Flat series

/**
 * One flat array of values, one per slice or bar: the series of a pie
 * chart, or of a bar chart with `distributeSeries`.
 */
export type FlatSeries<T = FlatSeriesPrimitiveValue> = FlatSeriesValue<T>[];

/**
 * A value of a {@link FlatSeries}: a plain value, `{ value, meta }`, or a
 * {@link FlatSeriesObjectValue} with a name and class name for its slice.
 */
export type FlatSeriesValue<T = FlatSeriesPrimitiveValue> =
  | SeriesValue<T>
  | FlatSeriesObjectValue<T>;

/**
 * A plain value of a {@link FlatSeries}: a number (numeric strings are read
 * as numbers), or `null` or `undefined` for a hole.
 */
export type FlatSeriesPrimitiveValue = number | string | null | undefined;

/**
 * A value of a flat series that is its own series, such as a pie slice:
 * `{ value: 20, name: 'Rent', className: 'rent' }`.
 */
export interface FlatSeriesObjectValue<T = FlatSeriesPrimitiveValue> {
  /** The name of the value's series. */
  name?: string;
  /** A class name for the value's series group, such as a slice's. */
  className?: string;
  /** Anything to attach to the value, handed back in events. */
  meta?: Meta;
  /** The value. */
  value: T;
}

// Normalized data

/**
 * Every shape a normalized `series` can take: a
 * {@link NormalizedFlatSeries} or a list of {@link NormalizedSeries}.
 */
export type AllNormalizedSeriesTypes =
  | NormalizedFlatSeries
  | NormalizedSeries[];

/**
 * Chart data after {@link normalizeData}: labels filled in, and every
 * series an array of numbers, `{ x, y }` numbers or holes.
 */
export interface NormalizedData<
  T extends AllNormalizedSeriesTypes = AllNormalizedSeriesTypes
> extends Data {
  /** One label per value position, empty strings where none was given. */
  labels: Label[];
  /** The normalized series. */
  series: T;
}

// Normalized series

/** A series after normalizing: its values without meta or series object. */
export type NormalizedSeries = NormalizedSeriesValue[];

/** A normalized value: a number, `{ x, y }` numbers, or `undefined` for a hole. */
export type NormalizedSeriesValue = NormalizedSeriesPrimitiveValue;

/** A normalized value: a number, `{ x, y }` numbers, or `undefined` for a hole. */
export type NormalizedSeriesPrimitiveValue =
  | number
  | NormalizedMulti
  | undefined;

// Normalized flat series

/** A {@link FlatSeries} after normalizing: one number per slice or bar. */
export type NormalizedFlatSeries = number[];

// Events

/**
 * The payload of the 1.x `created` event, emitted once a chart is drawn:
 * its SVG, drawing area, axes and options.
 */
export interface CreatedEvent<TOptions = Options> {
  /** The drawing area, in px. */
  chartRect: ChartRect;
  /** The X axis, a 1.x {@link Axis} object. */
  axisX: Axis;
  /** The Y axis, a 1.x {@link Axis} object. */
  axisY: Axis;
  /** The chart's SVG element, wrapped in {@link Svg}. */
  svg: Svg;
  /** The options the chart was drawn with, defaults and responsive options applied. */
  options: TOptions;
}

/**
 * The fields every 1.x `draw` event shares. A `draw` listener gets one per
 * element drawn; check `type` to tell them apart.
 */
export interface DrawEvent {
  /** What was drawn: `'point'`, `'line'`, `'bar'`, `'grid'`, … */
  type: string;
  /** The drawn element, wrapped in {@link Svg}: change or animate it here. */
  element: Svg;
  /** The group the element is in, wrapped in {@link Svg}. */
  group: Svg;
  /** The drawing area, in px. */
  chartRect: ChartRect;
  /** The X axis, a 1.x {@link Axis} object. */
  axisX: Axis;
  /** The Y axis, a 1.x {@link Axis} object. */
  axisY: Axis;
  /** The `meta` of the value (or of the series, for lines and areas). */
  meta: Meta;
  /** The index of the value in its series (of the series, for lines and areas). */
  index: number;
  /** The series as given in the data: an array or a series object. */
  series: FlatSeriesValue | Series | SeriesObject;
  /** The index of the series in the data. */
  seriesIndex: number;
}

/**
 * The payload of the 1.x `data` event, emitted before a chart draws new
 * data. Listeners may change `data` in place to transform it.
 */
export interface DataEvent {
  /** `'initial'` for the first data, `'update'` for data set later. */
  type: 'initial' | 'update';
  /** The data the chart is about to draw (a copy, safe to change). */
  data: Data;
}

/**
 * The payload of the 1.x `optionsChanged` event, emitted when a responsive
 * option starts or stops applying.
 */
export interface OptionsChangedEvent<T = Options> {
  /** The options before the change. */
  previousOptions: T;
  /** The options now in effect. */
  currentOptions: T;
}

/**
 * The 1.x `draw` event of a grid line, one per tick of each axis. `x1`,
 * `y1`, `x2`, `y2` are the line's ends in px.
 */
export interface GridDrawEvent extends Omit<
  DrawEvent,
  'chartRect' | 'axisX' | 'axisY' | 'meta' | 'series' | 'seriesIndex'
> {
  /** Always `'grid'`. */
  type: 'grid';
  /** The axis the grid line belongs to. */
  axis: Axis;
  /** The x of the line's start, in px. */
  x1: number;
  /** The y of the line's start, in px. */
  y1: number;
  /** The x of the line's end, in px. */
  x2: number;
  /** The y of the line's end, in px. */
  y2: number;
}

/**
 * The 1.x `draw` event of the grid background, the `rect` behind the
 * drawing area (with `showGridBackground`).
 */
export interface GridBackgroundDrawEvent {
  /** Always `'gridBackground'`. */
  type: 'gridBackground';
  /** The grid group the background is in. */
  group: Svg;
  /** The background `rect`. */
  element: Svg;
}

/**
 * The 1.x `draw` event of an axis label, one per tick. The label is a
 * `foreignObject` with a `span`, placed at `x`, `y` with the given size.
 */
export interface LabelDrawEvent extends Omit<
  DrawEvent,
  'chartRect' | 'axisX' | 'axisY' | 'meta' | 'series' | 'seriesIndex'
> {
  /** Always `'label'`. */
  type: 'label';
  /** The axis the label belongs to. */
  axis: Axis;
  /** The label as shown, after `labelInterpolationFnc`. */
  text: Label;
  /** The x of the label's box, in px. */
  x: number;
  /** The y of the label's box, in px. */
  y: number;
  /** The width of the label's box, in px. */
  width: number;
  /** The height of the label's box, in px. */
  height: number;
}

/** The 1.x `draw` events of the axes: grid lines, the grid background and labels. */
export type AxesDrawEvent =
  | GridDrawEvent
  | GridBackgroundDrawEvent
  | LabelDrawEvent;
