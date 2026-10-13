import type { ChartPadding, Label, NormalizedSeries } from '../core/types';
import type { MeasureText } from '../render/measure';
import type { CartesianAxes, ChartAxes } from '../scales/axis';
import type { SceneNode } from '../scene/node';

export type Coordinates = 'cartesian' | 'polar';

/** Chart data as passed to `chart()` or `toScene()`. */
export interface ChartData {
  readonly labels?: readonly (string | number | Date)[];
  readonly series: readonly unknown[];
}

/** One series after the `prepare` phase. */
export interface PreparedSeries {
  readonly name?: string;
  readonly className?: string;
  readonly meta?: unknown;
  readonly values: readonly unknown[];
}

export interface PreparedData {
  readonly labels: readonly (string | number | Date)[];
  readonly series: readonly PreparedSeries[];
}

/** Drawing area inside the padding; y1 is the bottom edge (as in 1.x). */
export interface Area {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly width: number;
  readonly height: number;
}

export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly padding: ChartPadding;
  readonly area: Area;
}

/** Data normalized for axes: multi values (`{ x, y }`), padded labels. */
export interface NormalizedChartData {
  readonly labels: readonly Label[];
  readonly series: readonly NormalizedSeries[];
}

export interface LayerContext {
  readonly data: PreparedData;
  readonly area: Area;
  readonly padding: ChartPadding;
  readonly layerIndex: number;
  readonly coordinates: Coordinates;
  readonly measureText: MeasureText;
  /** Axes created after `layout`, when the chart has axes. */
  readonly axes: ChartAxes;
  /** The data as the axes see it, when the chart has axes. */
  readonly normalized?: NormalizedChartData;
}

/**
 * A layer renders series into the chart area. Built-in and custom layers
 * use the same contract.
 * @experimental
 */
export interface Layer {
  /** Name used in error messages, e.g. `line`. */
  readonly type: string;
  /** Coordinate systems the layer can draw in. */
  readonly coordinates: readonly Coordinates[];
  compose(context: LayerContext): readonly SceneNode[];
}

/** Options after the `resolve` phase: defaults applied, listeners removed. */
export interface ResolvedConfig {
  readonly data: ChartData;
  readonly layers: readonly Layer[];
  readonly coordinates: Coordinates;
  readonly padding: ChartPadding;
  readonly axes?: CartesianAxes;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly viewBox?: { readonly width: number; readonly height: number };
  readonly className?: string;
}

/** Payloads of the phase events. */
export interface PhaseEvents {
  resolve: { readonly config: ResolvedConfig };
  prepare: { readonly data: PreparedData };
  layout: Layout;
  compose: SceneNode;
  scene: { readonly scene: SceneNode };
  render: { readonly scene: SceneNode; readonly output: unknown };
  mount: {
    readonly scene: SceneNode;
    readonly output: unknown;
    /** The rendered element of a scene node, if the renderer has one. */
    readonly elementOf: (node: SceneNode) => Element | undefined;
  };
}

export type PhaseName = keyof PhaseEvents;

/**
 * A phase listener returns a new payload to transform the phase, or nothing
 * to keep it. `compose` listeners may return `null` to drop the node.
 * Return values of `render` and `mount` listeners are ignored.
 */
export type PhaseListener<K extends PhaseName> = (
  payload: PhaseEvents[K]
) => PhaseEvents[K] | (K extends 'compose' ? null : never) | undefined | void;

export type AllPhasesListener = (name: PhaseName, payload: unknown) => void;

export type PhaseListeners = {
  readonly [K in PhaseName]?: PhaseListener<K>;
} & { readonly '*'?: AllPhasesListener };
