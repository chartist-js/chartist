import type { PipelineOptions } from '../pipeline/phases';
import type {
  AllPhasesListener,
  PhaseListener,
  PhaseListeners,
  PhaseName
} from '../pipeline/types';
import type { Renderer } from '../render/types';

/**
 * A v2 plugin. `install` runs once before the first render and can
 * register phase listeners on the chart.
 * @experimental
 */
export interface ChartPlugin<TOptions = unknown> {
  readonly name: string;
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
}

/** @experimental */
export interface ChartHandle {
  /** Shallow-merges the config and renders again. */
  update(config: Partial<Omit<ChartConfig, 'plugins' | 'on'>>): ChartHandle;
  /** Removes the output and stops observing size and listeners. */
  destroy(): void;
  on<K extends PhaseName>(name: K, listener: PhaseListener<K>): ChartHandle;
  on(name: '*', listener: AllPhasesListener): ChartHandle;
  off<K extends PhaseName>(name: K, listener?: PhaseListener<K>): ChartHandle;
  off(name: '*', listener?: AllPhasesListener): ChartHandle;
}
