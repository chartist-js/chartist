import type { ChartPadding } from '../core/types';
import type { LabelMode, MeasureStyle, MeasureText } from '../render/measure';
import type {
  AxisSide,
  CartesianAxes,
  ChartAxes,
  LayerBinding
} from '../scales/axis';
import { node, withFields, type SceneNode } from '../scene/node';
import { assignKeys, mapNodes } from '../scene/tree';
import type { PhaseEmitter } from './emitter';
import type {
  Area,
  ChartData,
  Coordinates,
  InsetContext,
  Layer,
  LayerContext,
  Layout,
  NormalizedChartData,
  PreparedData,
  PreparedSeries,
  ResolvedConfig
} from './types';

/** The 1.x default `chartPadding`. */
export const DEFAULT_PADDING: ChartPadding = {
  top: 15,
  right: 15,
  bottom: 5,
  left: 10
};

/** Options accepted by the pipeline (a chart config without listeners). */
export interface PipelineOptions {
  /** The labels and series to draw. */
  readonly data: ChartData;
  /** What to draw, in this order (later layers on top), e.g. `[axisGrid(), line()]`. */
  readonly layers: readonly Layer[];
  /**
   * The coordinate system the layers draw in: `cartesian` (the default)
   * for axes, `polar` for `pie()`.
   */
  readonly coordinates?: Coordinates;
  /**
   * Space in px between the chart's edge and the drawing area: one number
   * for all sides, or some sides (the others keep the 1.x defaults).
   */
  readonly padding?: number | Partial<ChartPadding>;
  /** Axes (see `cartesianAxes`); their offsets are reserved around the area. */
  readonly axes?: CartesianAxes;
  /**
   * The chart's width: px as a number, or a CSS length such as `100%` or
   * `20rem`. Without it, `chart()` fills the container's width.
   */
  readonly width?: number | string;
  /**
   * The chart's height: px as a number, or a CSS length such as `300px`.
   * Without it, `chart()` fills the container's height.
   */
  readonly height?: number | string;
  /** Fixed drawing coordinates; sets the layout size and the root `viewBox`. */
  readonly viewBox?: { readonly width: number; readonly height: number };
  /** Class names for the root svg, e.g. `ct-chart-line` for the 1.x line chart CSS. */
  readonly className?: string;
  /**
   * Draws labels as HTML in `foreignObject` (1.x) or as SVG `text`. The
   * default depends on the renderer: `html` for the DOM, `svg` in
   * `toScene()`.
   */
  readonly labels?: LabelMode;
  /** The preset that created the chart, if any (read by plugins). */
  readonly preset?: ResolvedConfig['preset'];
}

export interface PipelineEnvironment {
  /** Layout size in px. */
  readonly width: number;
  readonly height: number;
  readonly measureText: MeasureText;
  /** Reads computed styles for layout; absent without a DOM. */
  readonly measureStyle?: MeasureStyle;
  /** The renderer's default label mode; `html` if omitted. */
  readonly labels?: LabelMode;
  /** Size attributes of the root svg; defaults to the layout size. */
  readonly rootSize?: { width: number | string; height: number | string };
}

/** Results of the phases, cached so a resize can re-run from `layout`. */
export interface PipelineState {
  readonly config: ResolvedConfig;
  readonly data: PreparedData;
  readonly layout: Layout;
  readonly axes: ChartAxes;
  readonly normalized?: NormalizedChartData;
  readonly scene: SceneNode;
  /**
   * What each layer drew, by layer index: its top-level nodes after the
   * `compose` listeners, and the context its `compose` got.
   */
  readonly drawn: readonly LayerDrawing[];
}

/** What one layer drew in a run of the pipeline. */
export interface LayerDrawing {
  readonly nodes: SceneNode[];
  readonly context: LayerContext;
}

function normalizePadding(
  padding: number | Partial<ChartPadding> | undefined
): ChartPadding {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return { ...DEFAULT_PADDING, ...padding };
}

function check<T>(value: T | null, phase: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Chartist: a "${phase}" listener returned null`);
  }
  return value;
}

export function resolve(
  emitter: PhaseEmitter,
  options: PipelineOptions
): ResolvedConfig {
  const config: ResolvedConfig = {
    data: options.data,
    layers: options.layers,
    coordinates: options.coordinates ?? 'cartesian',
    padding: normalizePadding(options.padding),
    axes: options.axes,
    width: options.width,
    height: options.height,
    viewBox: options.viewBox,
    className: options.className,
    labels: options.labels,
    preset: options.preset
  };
  const resolved = check(
    emitter.transform('resolve', { config }),
    'resolve'
  ).config;
  for (const layer of resolved.layers) {
    if (!layer.coordinates.includes(resolved.coordinates)) {
      throw new Error(
        `Layer "${layer.type}" does not support ${resolved.coordinates} coordinates`
      );
    }
  }
  return resolved;
}

function prepareSeries(series: unknown): PreparedSeries {
  if (Array.isArray(series)) {
    return { values: series };
  }
  if (series && typeof series === 'object' && 'data' in series) {
    const { data, name, className, meta } = series as {
      data: readonly unknown[];
      name?: string;
      className?: string;
      meta?: unknown;
    };
    return { name, className, meta, values: data };
  }
  return { values: [series] };
}

/**
 * Normalizes series into `{ values }` objects. A flat series (no arrays or
 * series objects, e.g. pie data) becomes one series with all values.
 */
export function prepare(
  emitter: PhaseEmitter,
  config: ResolvedConfig
): PreparedData {
  const { labels = [], series } = config.data;
  const flat = series.every(
    entry =>
      !Array.isArray(entry) &&
      !(entry && typeof entry === 'object' && 'data' in entry)
  );
  const data: PreparedData =
    flat && series.length
      ? { labels, series: [{ values: series }], flat: true }
      : { labels, series: series.map(prepareSeries) };
  return check(emitter.transform('prepare', { data }), 'prepare').data;
}

function validate(result: Layout) {
  const { area } = result;
  const values = [
    result.width,
    result.height,
    area.x1,
    area.x2,
    area.y1,
    area.y2,
    area.width,
    area.height
  ];
  if (!values.every(Number.isFinite) || area.width < 0 || area.height < 0) {
    throw new Error(
      `Chartist: invalid layout after the "layout" phase (area ${JSON.stringify(area)})`
    );
  }
}

/** The room each layer reserved with `inset`, by layer index. */
export type LayerInsets = readonly (ChartPadding | undefined)[];

/** The boxes each layer reserved, by layer index. */
export type LayerInsetAreas = readonly (
  | Partial<Record<AxisSide, Area>>
  | undefined
)[];

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const bySide = (value: (side: AxisSide) => number) =>
  Object.fromEntries(SIDES.map(side => [side, value(side)])) as Record<
    AxisSide,
    number
  >;

/** The layer's data: only its series when it selects some. */
function layerDataOf(data: PreparedData, binding: LayerBinding | undefined) {
  const selection = data.flat ? undefined : binding?.series;
  return {
    selection,
    data: selection
      ? { ...data, series: selection.map(i => data.series[i]) }
      : data
  };
}

/**
 * Asks each layer with `inset` for the room it needs outside the drawing
 * area. A layer that reserves nothing gets `undefined`.
 */
function reserveRoom(
  config: ResolvedConfig,
  data: PreparedData,
  bindings: readonly LayerBinding[],
  context: Omit<InsetContext, 'data' | 'layerIndex' | 'axes' | 'padding'>
): LayerInsets {
  return config.layers.map((layer, layerIndex) => {
    const room =
      layer.inset?.({
        ...context,
        data: layerDataOf(data, bindings[layerIndex]).data,
        layerIndex,
        axes: config.axes?.definitions ?? [],
        padding: config.padding
      }) ?? {};
    let reserved = 0;
    const sides = bySide(side => {
      const value = room[side] ?? 0;
      // Also rejects NaN.
      if (!(value >= 0 && value < Infinity)) {
        throw new Error(
          `Chartist: layer "${layer.type}" reserved invalid room`
        );
      }
      reserved += value;
      return value;
    });
    return reserved ? sides : undefined;
  });
}

/**
 * The boxes of the reserved room: per side, just outside the axis bands,
 * stacked outward in the order of the layers, as long as the area.
 */
function insetAreasOf(
  insets: LayerInsets,
  area: Area,
  config: ResolvedConfig
): LayerInsetAreas {
  // How far from the area each side's next box starts: the axis bands first.
  const used = bySide(() => 0);
  for (const definition of config.axes?.definitions ?? []) {
    used[definition.side] += definition.offset || 0;
  }
  return insets.map(
    room =>
      room &&
      Object.fromEntries(
        SIDES.filter(side => room[side]).map(side => {
          const size = room[side];
          const start =
            side === 'top'
              ? area.y2 - used[side] - size
              : side === 'bottom'
                ? area.y1 + used[side]
                : side === 'left'
                  ? area.x1 - used[side] - size
                  : area.x2 + used[side];
          used[side] += size;
          return [
            side,
            side === 'top' || side === 'bottom'
              ? { ...area, y2: start, y1: start + size, height: size }
              : { ...area, x1: start, x2: start + size, width: size }
          ];
        })
      )
  );
}

/**
 * Lays the chart out: the drawing area inside the padding, the room the
 * layers reserved and the axes. Returns the layout after the `layout`
 * listeners, and the layers' boxes, computed before them.
 */
export function layout(
  emitter: PhaseEmitter,
  config: ResolvedConfig,
  width: number,
  height: number,
  insets: LayerInsets = []
): { layout: Layout; insetAreas: LayerInsetAreas } {
  const inset = insets.some(Boolean)
    ? bySide(side => insets.reduce((sum, room) => sum + (room?.[side] ?? 0), 0))
    : undefined;
  const padding = inset
    ? bySide(side => config.padding[side] + inset[side])
    : config.padding;
  let initial: Layout;
  if (config.axes) {
    initial = { ...config.axes.area(width, height, padding), padding };
  } else {
    // The 1.x `createChartRect` minimums: at least the padding, 1 px area.
    const w = Math.max(width, padding.left + padding.right);
    const h = Math.max(height, padding.top + padding.bottom);
    const x1 = padding.left;
    const y2 = padding.top;
    const x2 = Math.max(w - padding.right, x1 + 1);
    const y1 = Math.max(h - padding.bottom, y2 + 1);
    const area: Area = { x1, y1, x2, y2, width: x2 - x1, height: y1 - y2 };
    initial = { width: w, height: h, padding, area };
  }
  if (inset) {
    initial = { ...initial, inset };
  }
  const insetAreas = inset ? insetAreasOf(insets, initial.area, config) : [];
  const result = check(emitter.transform('layout', initial), 'layout');
  validate(result);
  return { layout: result, insetAreas };
}

export function compose(
  emitter: PhaseEmitter,
  config: ResolvedConfig,
  data: PreparedData,
  area: Area,
  measureText: MeasureText,
  axes: ChartAxes = {},
  normalized?: NormalizedChartData,
  padding: ChartPadding = config.padding,
  bindings: readonly LayerBinding[] = [],
  labels: LabelMode = 'html',
  measureStyle?: MeasureStyle,
  drawn: LayerDrawing[] = [],
  insetAreas: LayerInsetAreas = []
): SceneNode[] {
  const byId = new Map((axes.all ?? []).map(axis => [axis.id, axis]));
  // Every layer composes before any node is refined or emitted, so a
  // layer's refine sees the nodes of the layers listed after it too.
  const layers = config.layers.map((layer, layerIndex) => {
    const binding = bindings[layerIndex] ?? {};
    const { selection, data: layerData } = layerDataOf(data, binding);
    const layerNormalized =
      selection && normalized
        ? {
            ...normalized,
            series: selection.map(i => normalized.series[i])
          }
        : normalized;
    const context: LayerContext = {
      data: layerData,
      area,
      padding,
      layerIndex,
      coordinates: config.coordinates,
      measureText,
      axes: {
        x: (binding.x && byId.get(binding.x)) || axes.x,
        y: (binding.y && byId.get(binding.y)) || axes.y,
        all: axes.all
      },
      normalized: layerNormalized,
      seriesIndexes: selection,
      labels,
      measureStyle,
      ...(insetAreas[layerIndex] ? { insetArea: insetAreas[layerIndex] } : {})
    };
    const nodes = layer
      .compose(context)
      .map(top => assignKeys(top, layerIndex));
    drawn.push({ nodes: [], context });
    return { layer, context, nodes, layerIndex };
  });
  const refiners = layers.flatMap(({ layer, context }) =>
    layer.refine ? [{ refine: layer.refine.bind(layer), context }] : []
  );
  const refine = (current: SceneNode) =>
    refiners.reduce((refined, { refine: refineNode, context }) => {
      const result = refineNode(refined, context);
      // A refiner changes the node, never its key or the tree around it.
      return result
        ? withFields(result, {
            key: refined.key,
            children: refined.children
          })
        : refined;
    }, current);
  const composed: SceneNode[] = [];
  for (const { nodes, layerIndex } of layers) {
    for (const top of nodes) {
      const result = mapNodes(top, current =>
        current.role === undefined
          ? undefined
          : emitter.transform(
              'compose',
              refiners.length > 0 ? refine(current) : current
            )
      );
      if (result) {
        drawn[layerIndex].nodes.push(result);
        composed.push(result);
      }
    }
  }
  return composed;
}

export function scene(
  emitter: PhaseEmitter,
  config: ResolvedConfig,
  children: readonly SceneNode[],
  size: { width: number | string; height: number | string }
): SceneNode {
  const root = node(
    'svg',
    {
      width: size.width,
      height: size.height,
      viewBox: config.viewBox
        ? `0 0 ${config.viewBox.width} ${config.viewBox.height}`
        : undefined
    },
    config.className
  );
  const built = children.length ? withFields(root, { children }) : root;
  return check(emitter.transform('scene', { scene: built }), 'scene').scene;
}

/**
 * Runs the phases `resolve` to `scene`. With a previous state and
 * `from: 'layout'`, `resolve` and `prepare` are reused.
 */
export function runPipeline(
  emitter: PhaseEmitter,
  options: PipelineOptions,
  environment: PipelineEnvironment,
  previous?: PipelineState,
  from: 'resolve' | 'layout' = 'resolve'
): PipelineState {
  const reuse = from === 'layout' && previous;
  const config = reuse ? previous.config : resolve(emitter, options);
  const data = reuse ? previous.data : prepare(emitter, config);
  // Axis ids and series selections; only cartesian axes bind layers.
  const bindings = config.axes?.bind?.(config.layers, data) ?? [];
  // Measure with the root classes, so chart-type CSS applies.
  const { className } = config;
  const withRootClass = <T extends MeasureText | MeasureStyle | undefined>(
    measure: T
  ): T =>
    (className && measure
      ? (value: string, measureOptions?: object) =>
          measure(value, { rootClass: className, ...measureOptions })
      : measure) as T;
  const measureText = withRootClass(environment.measureText);
  const measureStyle = withRootClass(environment.measureStyle);
  const labels = config.labels ?? environment.labels ?? 'html';
  const insets = config.layers.some(layer => layer.inset)
    ? reserveRoom(config, data, bindings, {
        width: environment.width,
        height: environment.height,
        coordinates: config.coordinates,
        labels,
        measureText,
        measureStyle
      })
    : [];
  const { layout: laidOut, insetAreas } = layout(
    emitter,
    config,
    environment.width,
    environment.height,
    insets
  );
  // The layers go along for the extents they report (stacked bars).
  const { axes = {}, normalized = undefined } =
    config.axes?.create(data, laidOut.area, bindings, config.layers) ?? {};
  const drawn: LayerDrawing[] = [];
  const children = compose(
    emitter,
    config,
    data,
    laidOut.area,
    measureText,
    axes,
    normalized,
    laidOut.padding,
    bindings,
    labels,
    measureStyle,
    drawn,
    insetAreas
  );
  const built = scene(
    emitter,
    config,
    children,
    environment.rootSize ?? {
      width: config.width ?? laidOut.width,
      height: config.height ?? laidOut.height
    }
  );
  return {
    config,
    data,
    layout: laidOut,
    axes,
    normalized,
    scene: built,
    drawn
  };
}
