import type { PipelineOptions } from '../pipeline/phases';
import type {
  AllPhasesListener,
  PhaseListener,
  PhaseListeners,
  PhaseName
} from '../pipeline/types';
import type { Renderer } from '../render/types';
import type { ResponsiveSet } from '../responsive/responsive';

/**
 * A v2 plugin. `install` runs once before the first render and can
 * register phase listeners on the chart.
 * @experimental
 */
export interface ChartPlugin<TOptions = unknown> {
  readonly name: string;
  /** Names of custom events this plugin emits through `chart.emit`. */
  readonly provides?: readonly string[];
  install(chart: ChartHandle, options?: TOptions): void;
}

export type PluginEntry =
  | ChartPlugin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | readonly [ChartPlugin<any>, unknown];

/** @experimental */
export interface ChartConfig extends PipelineOptions {
  readonly plugins?: readonly PluginEntry[];
  /** Phase listeners, registered before the first render. */
  readonly on?: PhaseListeners;
  /** Renders the scene; the DOM renderer by default. */
  readonly renderer?: Renderer;
  /**
   * Responsive overrides, created with `responsive([...])`: entries with a
   * media query string or a `container()` condition and a partial config.
   */
  readonly responsive?: ResponsiveSet<ChartOverrides>;
}

/**
 * The part of a chart config that responsive entries can override.
 * @experimental
 */
export type ChartOverrides = Partial<
  Omit<ChartConfig, 'responsive' | 'plugins' | 'on' | 'renderer'>
>;

/** @experimental */
export interface ChartHandle {
  /** The element the chart renders into (undefined in `toScene`). */
  readonly container?: Element;
  /** Shallow-merges the config and renders again. */
  update(config: Partial<Omit<ChartConfig, 'plugins' | 'on'>>): ChartHandle;
  /**
   * Stops reacting to container size changes (and media queries in
   * presets). The output and the listeners stay.
   */
  detach(): ChartHandle;
  /** Detaches, removes the output and clears all listeners. */
  destroy(): void;
  /** Emits a custom (non-phase) event, e.g. from a plugin. */
  emit(name: string, payload?: unknown): void;
  on<K extends PhaseName>(name: K, listener: PhaseListener<K>): ChartHandle;
  on(name: '*', listener: AllPhasesListener): ChartHandle;
  /** Custom events, see `ChartPlugin.provides`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(name: string, listener: (payload: any) => void): ChartHandle;
  off<K extends PhaseName>(name: K, listener?: PhaseListener<K>): ChartHandle;
  off(name: '*', listener?: AllPhasesListener): ChartHandle;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(name: string, listener?: (payload: any) => void): ChartHandle;
}
