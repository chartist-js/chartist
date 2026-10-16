import type { LinePresetState } from '../presets/lineChart';
import type { BarPresetState } from '../presets/barChart';
import type { PiePresetState } from '../presets/pieChart';
import type {
  Keyframes,
  RenderCause,
  RenderOutput,
  SceneChange,
  UpdateAnimation
} from '../render/types';
import type { ChartPadding, Label, NormalizedSeries } from '../core/types';
import type { LabelMode, MeasureStyle, MeasureText } from '../render/measure';
import type { AxisExtent, CartesianAxes, ChartAxes } from '../scales/axis';
import type { SceneNode } from '../scene/node';

/**
 * The coordinate system a chart draws in: `cartesian` places values on X
 * and Y axes (lines, bars), `polar` around a center (pies and donuts).
 */
export type Coordinates = 'cartesian' | 'polar';

/** Chart data as passed to `chart()` or `toScene()`. */
export interface ChartData {
  /** The labels of the values, e.g. for the X axis or the slices. */
  readonly labels?: readonly (string | number | Date)[];
  /**
   * The series: arrays of values, series objects with `data`, or, for a
   * pie, one value per slice.
   */
  readonly series: readonly unknown[];
}

/** One series after the `prepare` phase. */
export interface PreparedSeries {
  /** The series' `name`, from a series object. */
  readonly name?: string;
  /** The series' `className`, from a series object. */
  readonly className?: string;
  /** The series' `meta`, from a series object. */
  readonly meta?: unknown;
  /** The series' values, as given. */
  readonly values: readonly unknown[];
}

/**
 * The data after the `prepare` phase: every series as a
 * {@link PreparedSeries}, whether it was given as an array or an object.
 */
export interface PreparedData {
  /** The labels as given, or an empty array. */
  readonly labels: readonly (string | number | Date)[];
  /** The series, each with its `values`. */
  readonly series: readonly PreparedSeries[];
  /** The input was a flat series (e.g. pie or distributed bar data). */
  readonly flat?: boolean;
}

/**
 * The drawing area inside the padding (and the axes), in px in the SVG.
 * `y1` is the bottom edge, as in 1.x.
 */
export interface Area {
  /** The left edge. */
  readonly x1: number;
  /** The bottom edge. */
  readonly y1: number;
  /** The right edge. */
  readonly x2: number;
  /** The top edge. */
  readonly y2: number;
  /** The area's width in px. */
  readonly width: number;
  /** The area's height in px. */
  readonly height: number;
}

/**
 * The payload of the `layout` phase: the chart's size and the drawing area
 * inside its padding and axes. A `layout` listener can return a changed
 * layout, e.g. to make room for a legend.
 */
export interface Layout {
  /** The chart's width in px (at least the left and right padding). */
  readonly width: number;
  /** The chart's height in px (at least the top and bottom padding). */
  readonly height: number;
  /** The padding around the drawing area, in px. */
  readonly padding: ChartPadding;
  /** Where the layers draw, inside the padding and the axes. */
  readonly area: Area;
}

/** Data normalized for axes: multi values (`{ x, y }`), padded labels. */
export interface NormalizedChartData {
  /** The labels, padded with empty strings to the longest series. */
  readonly labels: readonly Label[];
  /**
   * The series' values as numbers, `{ x, y }` values or holes, each
   * series padded with holes to the longest one.
   */
  readonly series: readonly NormalizedSeries[];
}

/**
 * What a layer's `compose` gets: the data it draws, the area to draw in,
 * the axes and ways to measure text and styles.
 */
export interface LayerContext {
  /** The prepared data; only the layer's series when it selects some. */
  readonly data: PreparedData;
  /** The drawing area, in px in the SVG. */
  readonly area: Area;
  /** The chart's padding, in px. */
  readonly padding: ChartPadding;
  /** The layer's index in the chart's `layers`; part of its nodes' keys. */
  readonly layerIndex: number;
  /** The chart's coordinate system. */
  readonly coordinates: Coordinates;
  /**
   * Measures text with the renderer's metrics (in the browser, with the
   * page's fonts and the chart's classes), for layers that lay out labels.
   */
  readonly measureText: MeasureText;
  /**
   * Reads computed styles with the renderer (in the browser, with the
   * page's CSS and the chart's classes), for layout that depends on the
   * stylesheet, such as a donut's ring width. Absent without a DOM.
   */
  readonly measureStyle?: MeasureStyle;
  /** Axes created after `layout`, when the chart has axes. */
  readonly axes: ChartAxes;
  /** The data as the axes see it, when the chart has axes. */
  readonly normalized?: NormalizedChartData;
  /**
   * Chart-wide index of each series in `data` (a layer may select a subset
   * of the series). Absent when the layer draws all series.
   */
  readonly seriesIndexes?: readonly number[];
  /** How label layers draw labels: chart option, else the renderer's. */
  readonly labels: LabelMode;
}

/**
 * What a layer's `extent` gets: its series as the axes see them, and the
 * ids of the axes it draws on.
 */
export interface ExtentContext {
  /**
   * The layer's series, normalized as for the axes (`{ x, y }` values or
   * holes); only the layer's series when it selects some.
   */
  readonly normalized: NormalizedChartData;
  /** The ids of the X and Y axis the layer draws on. */
  readonly axes: { readonly x?: string; readonly y?: string };
}

/**
 * A layer renders series into the chart area. Built-in and custom layers
 * use the same contract: the "Custom layers" guide explains each field
 * and how to write and share a layer.
 * @see https://chartist.dev/docs/custom-layers/
 */
export interface Layer {
  /** Name used in error messages, e.g. `line`. */
  readonly type: string;
  /**
   * The kind of chart the layer draws, when `type` doesn't say it: a
   * {@link chart} without `className` gets `ct-chart-bar` if a layer is a
   * `bar`, else `ct-chart-pie` or `ct-chart-donut` for a `pie` or `donut`,
   * else `ct-chart-line`. Without it, `type` counts.
   */
  readonly chartType?: string;
  /** Coordinate systems the layer can draw in. */
  readonly coordinates: readonly Coordinates[];
  /** Axis ids to draw on; default: the first X and the first Y axis. */
  readonly axes?: { readonly x?: string; readonly y?: string };
  /** Series to draw, by index or name; default: all series. */
  readonly series?: readonly (number | string)[];
  /**
   * Reports the range of values the layer needs on its axes beyond the
   * values themselves, by axis id, such as the sums of stacked bars. Scale
   * axes include it in the range they fit to the data (an axis's own `low`
   * and `high` still win); on an axis several layers report a range for,
   * the axis covers them all. Runs before the axes are created, on every
   * layout.
   *
   * @example
   * ```ts
   * import type { Layer } from 'chartist';
   *
   * // Keeps 0 to 100 on the layer's Y axis, e.g. for a target line.
   * const withTarget = (base: Layer): Layer => ({
   *   ...base,
   *   extent: ({ axes }) => (axes.y ? { [axes.y]: { low: 0, high: 100 } } : {})
   * });
   * ```
   */
  extent?(context: ExtentContext): Readonly<Record<string, AxisExtent>>;
  /**
   * Draws the layer: returns its top-level nodes, usually one `series`
   * group per series. The pipeline keys their data nodes and passes every
   * node with a role through the `compose` listeners.
   */
  compose(context: LayerContext): readonly SceneNode[];
  /**
   * Refines what the layers drew: once every layer has composed, called
   * for each node with a role, from all layers (children before their
   * parents), before the `compose` events, so listeners see the result.
   * Return a changed node, such as one with a class added, or `undefined`
   * to leave it. The node keeps its key and its children whatever you
   * return, and refining can't drop a node. With several refining layers,
   * a node passes through them in the order of `layers`. Leave it out when
   * the layer only draws its own nodes: charts without a refining layer
   * skip this step.
   *
   * @param node The node, possibly refined by layers listed earlier.
   * @param context The context this layer's `compose` got.
   *
   * @example
   * ```ts
   * import type { Layer } from 'chartist';
   *
   * // Marks the points of every layer that are above a limit.
   * const markAbove = (limit: number): Layer => ({
   *   type: 'markAbove',
   *   coordinates: ['cartesian'],
   *   series: [],
   *   compose: () => [],
   *   refine: node =>
   *     node.role === 'point' &&
   *     typeof node.ctx.value === 'object' &&
   *     (node.ctx.value.y ?? -Infinity) > limit
   *       ? node.addClass('ct-above')
   *       : undefined
   * });
   * ```
   */
  refine?(node: SceneNode, context: LayerContext): SceneNode | undefined;
  /**
   * Gives the keyframes of an update animation for one of the layer's
   * nodes, for attributes that don't move well number by number, such as
   * an arc that should turn around its center. A renderer that animates
   * updates (`smilAnimations()` from `chartist/live`) asks once per update,
   * never per frame, with the progress points of the chart's easing: 0 is
   * the previous node, 1 the new one, and points beyond them come from an
   * easing that overshoots. Plugins with `keyframes` are asked first.
   * Leave it out to animate the layer's nodes number by number.
   *
   * @param previous The node in the previous scene
   * @param next The node in the new scene
   * @param context The context this layer's `compose` got for `next`
   * @param progress The progress points to give attributes for
   * @returns One set of attributes per progress point, or nothing.
   *
   * @example
   * ```ts
   * import type { Layer } from 'chartist';
   *
   * // A gauge whose needle (its angle in `ct:angle`) turns on an update.
   * declare const gauge: Layer;
   * const turningGauge: Layer = {
   *   ...gauge,
   *   keyframes: (previous, next, context, progress) => {
   *     const from = Number(previous.attrs['ct:angle']);
   *     const to = Number(next.attrs['ct:angle']);
   *     const { x1, y1, width, height } = context.area;
   *     return progress.map(p => ({
   *       transform: `rotate(${from + (to - from) * p} ${x1 + width / 2} ${y1 - height / 2})`
   *     }));
   *   }
   * };
   * ```
   */
  keyframes?(
    previous: SceneNode,
    next: SceneNode,
    context: LayerContext,
    progress: readonly number[]
  ): Keyframes | undefined;
}

/** Options after the `resolve` phase: defaults applied, listeners removed. */
export interface ResolvedConfig {
  /** The chart's data, as given. */
  readonly data: ChartData;
  /** The layers, drawn in this order. */
  readonly layers: readonly Layer[];
  /** The coordinate system; `cartesian` unless the config says otherwise. */
  readonly coordinates: Coordinates;
  /** The padding in px on every side, the 1.x defaults filled in. */
  readonly padding: ChartPadding;
  /** The chart's axes, from `cartesianAxes()`, if it has any. */
  readonly axes?: CartesianAxes;
  /** The root svg's `width` from the config, e.g. `100%` or `600`. */
  readonly width?: number | string;
  /** The root svg's `height` from the config, e.g. `300px`. */
  readonly height?: number | string;
  /** Fixed drawing coordinates for the root svg's `viewBox`, in px. */
  readonly viewBox?: { readonly width: number; readonly height: number };
  /** Class names of the root svg, e.g. `ct-chart-line`. */
  readonly className?: string;
  /** Label mode for all label layers; else the renderer decides. */
  readonly labels?: LabelMode;
  /**
   * The preset that created the chart, if any: its kind, options and data.
   * Check `kind` to narrow it, e.g. `config.preset?.kind === 'line'`.
   */
  readonly preset?: LinePresetState | BarPresetState | PiePresetState;
}

/**
 * The payloads of the phase events, by phase, in the order the phases run.
 * Listen with `on` in the config of `chart()`, `chart.on()` or a plugin. A
 * listener can return a new payload to change the phase (see
 * {@link PhaseResult}); later phases build on the change.
 *
 * When the container resizes, the chart runs again from `layout`, so
 * `resolve` and `prepare` listeners aren't called.
 *
 * @example
 * ```ts
 * import { barChart, type ChartPlugin } from 'chartist';
 *
 * // Bars at or above the limit get the class ct-over.
 * const threshold = (limit: number): ChartPlugin => ({
 *   name: 'threshold',
 *   install(chart) {
 *     chart.on('compose', current => {
 *       if (current.role !== 'bar') {
 *         return;
 *       }
 *       // A number, { x, y } (with an X scale axis) or a hole.
 *       const { value } = current.ctx;
 *       const y =
 *         typeof value === 'number'
 *           ? value
 *           : value && 'y' in value
 *             ? value.y
 *             : undefined;
 *       return y !== undefined && y >= limit
 *         ? current.addClass('ct-over')
 *         : undefined;
 *     });
 *   }
 * });
 *
 * barChart(
 *   '#chart',
 *   { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [[5, 4, 3, 7]] },
 *   { plugins: [threshold(5)] }
 * );
 * ```
 */
export interface PhaseEvents {
  /** The config with defaults applied: padding, coordinates, layers, axes. */
  resolve: { readonly config: ResolvedConfig };
  /** The data, each series as `{ values, name, className, meta }`. */
  prepare: { readonly data: PreparedData };
  /** The chart's size and the drawing area inside the padding and axes. */
  layout: Layout;
  /**
   * Each node with a role that a layer draws, children before their
   * parents: series, lines, areas, points, bars, slices, grid lines and
   * labels. Return a changed node, a new one, or `null` to drop it.
   */
  compose: SceneNode;
  /** The whole scene, its root the `svg`. */
  scene: { readonly scene: SceneNode };
  /**
   * The renderer has applied the scene: created, replaced or changed the
   * output in place. `output` is what it returned.
   */
  render: RenderEvent;
  /**
   * The output is in the page; touch elements only here. Return a function
   * to undo what the listener did: it runs before the next render changes
   * the output, and on `destroy()`.
   */
  mount: RenderEvent & {
    /**
     * The rendered element of a scene node, if the renderer has one; for a
     * node of a `remove` change, the element just taken out of the page.
     */
    readonly elementOf: (node: SceneNode) => Element | undefined;
    /**
     * The timing of the update animation the renderer started, if it
     * animated this render. Animate what your plugin draws with it, so it
     * moves in step with the chart.
     */
    readonly animation?: UpdateAnimation;
  };
}

/**
 * What the `render` and `mount` events carry about a render: the scene, the
 * renderer's output, why the chart rendered and what changed.
 */
export interface RenderEvent {
  /** The scene the renderer applied. */
  readonly scene: SceneNode;
  /** What the renderer returned. */
  readonly output: RenderOutput;
  /** Why the chart rendered, e.g. `update` or `resize`. */
  readonly cause: RenderCause;
  /** The previous render's scene; absent on the first render. */
  readonly previous?: SceneNode;
  /**
   * What the render did to the output, in document order. When the
   * renderer changed its output in place (`liveDomRenderer()` from
   * `chartist/live`), these are its changes; otherwise every node of the
   * previous scene is removed and every node of the new one added.
   */
  readonly changes: readonly SceneChange[];
}

/** The name of a pipeline phase, such as `compose`: a key of {@link PhaseEvents}. */
export type PhaseName = keyof PhaseEvents;

/**
 * What a phase listener returns: a new payload to transform the phase, or
 * nothing to keep it. `compose` listeners may return `null` to drop the
 * node. `render` listeners return nothing (they observe). A function a
 * `mount` listener returns is its cleanup; other values are ignored, so
 * `() => chart.detach()` stays a valid listener.
 */
export type PhaseResult<K extends PhaseName> = K extends 'render'
  ? void
  : K extends 'mount'
    ? unknown
    : PhaseEvents[K] | (K extends 'compose' ? null : never) | undefined | void;

/**
 * A listener of one phase: gets the phase's payload and may return a new
 * one (see {@link PhaseResult}). Listeners of a phase run in the order they
 * were added, each with the previous one's result.
 */
export type PhaseListener<K extends PhaseName> = (
  payload: PhaseEvents[K]
) => PhaseResult<K>;

/**
 * A listener of every phase (`'*'`): gets the phase name and its final
 * payload, after the phase's own listeners. It only observes.
 */
export type AllPhasesListener = (name: PhaseName, payload: unknown) => void;

/**
 * Phase listeners by phase name, as the `on` option of `chart()` takes
 * them. They're registered before the first render.
 */
export type PhaseListeners = {
  readonly [K in PhaseName]?: PhaseListener<K>;
} & {
  /** Listens to every phase, with the phase name as first argument. */
  readonly '*'?: AllPhasesListener;
};
