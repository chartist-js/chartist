import type { ChartPadding } from '../core/types';
import type { MeasureText } from '../render/measure';
import { node, withFields, type SceneNode } from '../scene/node';
import { assignKeys, mapNodes } from '../scene/tree';
import type { PhaseEmitter } from './emitter';
import type {
  Area,
  ChartData,
  Coordinates,
  Layer,
  Layout,
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
  readonly data: ChartData;
  readonly layers: readonly Layer[];
  readonly coordinates?: Coordinates;
  readonly padding?: number | Partial<ChartPadding>;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly className?: string;
}

export interface PipelineEnvironment {
  /** Layout size in px. */
  readonly width: number;
  readonly height: number;
  readonly measureText: MeasureText;
  /** Size attributes of the root svg; defaults to the layout size. */
  readonly rootSize?: { width: number | string; height: number | string };
}

/** Results of the phases, cached so a resize can re-run from `layout`. */
export interface PipelineState {
  readonly config: ResolvedConfig;
  readonly data: PreparedData;
  readonly layout: Layout;
  readonly scene: SceneNode;
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
    width: options.width,
    height: options.height,
    className: options.className
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
  const data: PreparedData = {
    labels,
    series:
      flat && series.length ? [{ values: series }] : series.map(prepareSeries)
  };
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

export function layout(
  emitter: PhaseEmitter,
  config: ResolvedConfig,
  width: number,
  height: number
): Layout {
  const { padding } = config;
  const x1 = padding.left;
  const y2 = padding.top;
  const x2 = Math.max(x1, width - padding.right);
  const y1 = Math.max(y2, height - padding.bottom);
  const area: Area = { x1, y1, x2, y2, width: x2 - x1, height: y1 - y2 };
  const result = check(
    emitter.transform('layout', { width, height, padding, area }),
    'layout'
  );
  validate(result);
  return result;
}

/** Composes each layer, emitting `compose` per node with a role (post-order). */
export function compose(
  emitter: PhaseEmitter,
  config: ResolvedConfig,
  data: PreparedData,
  area: Area,
  measureText: MeasureText
): SceneNode[] {
  const composed: SceneNode[] = [];
  config.layers.forEach((layer, layerIndex) => {
    const nodes = layer.compose({
      data,
      area,
      layerIndex,
      coordinates: config.coordinates,
      measureText
    });
    for (const top of nodes) {
      const result = mapNodes(assignKeys(top, layerIndex), current =>
        current.role === undefined
          ? undefined
          : emitter.transform('compose', current)
      );
      if (result) {
        composed.push(result);
      }
    }
  });
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
    { width: size.width, height: size.height },
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
  const laidOut = layout(
    emitter,
    config,
    environment.width,
    environment.height
  );
  const children = compose(
    emitter,
    config,
    data,
    laidOut.area,
    environment.measureText
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
  return { config, data, layout: laidOut, scene: built };
}
