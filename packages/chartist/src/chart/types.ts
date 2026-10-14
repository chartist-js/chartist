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
 * Custom events and their payloads. Empty here: a plugin that emits events
 * declares them, so listeners and `emit` are typed:
 *
 * ```ts
 * declare module 'chartist' {
 *   interface ChartEvents {
 *     'legend:click': { readonly seriesIndex: number };
 *   }
 * }
 * ```
 *
 * `chartist/compat` declares the 1.x events (`draw`, `created`, …).
 * @experimental
 */
export interface ChartEvents {
  /**
   * Responsive entries changed which overrides apply: the config before
   * and after (`chart()`), or the options before and after (presets).
   */
  responsive:
    | {
        readonly previousConfig: ChartConfig;
        readonly currentConfig: ChartConfig;
      }
    | { readonly previousOptions: unknown; readonly currentOptions: unknown };
}

/** A custom event name: a key of `ChartEvents`. */
export type CustomEventName = keyof ChartEvents & string;

/**
 * A v2 plugin. `install` runs once before the first render and can
 * register phase listeners on the chart.
 * @experimental
 */
export interface ChartPlugin<TOptions = unknown> {
  readonly name: string;
  /** Custom events this plugin emits through `chart.emit`. */
  readonly provides?: readonly CustomEventName[];
  install(chart: ChartHandle, options?: TOptions): void;
}

/** A plugin with its options, from `withOptions()`. */
export type PluginWithOptions<TOptions = unknown> = readonly [
  ChartPlugin<TOptions>,
  TOptions
];

/**
 * A plugin in a chart's `plugins`: a plugin, or a plugin with its options.
 * Prefer `withOptions(plugin, options)` (checked) or a factory function
 * that returns a plugin, over a bare `[plugin, options]` pair.
 */
export type PluginEntry =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ChartPlugin<any> | PluginWithOptions<any>;

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
  /** Emits a custom event (declared in `ChartEvents`), e.g. from a plugin. */
  emit<K extends CustomEventName>(name: K, payload: ChartEvents[K]): void;
  on<K extends PhaseName>(name: K, listener: PhaseListener<K>): ChartHandle;
  on(name: '*', listener: AllPhasesListener): ChartHandle;
  /** Custom events, declared in `ChartEvents`. */
  on<K extends CustomEventName>(
    name: K,
    listener: (payload: ChartEvents[K]) => void
  ): ChartHandle;
  off<K extends PhaseName>(name: K, listener?: PhaseListener<K>): ChartHandle;
  off(name: '*', listener?: AllPhasesListener): ChartHandle;
  off<K extends CustomEventName>(
    name: K,
    listener?: (payload: ChartEvents[K]) => void
  ): ChartHandle;
}

/**
 * A plugin with its options, checked against the plugin's options type.
 * @experimental
 */
export function withOptions<TOptions>(
  plugin: ChartPlugin<TOptions>,
  options: TOptions
): PluginWithOptions<TOptions> {
  return [plugin, options];
}

/**
 * The handle without event typing, for code that routes event names it
 * doesn't know (the 1.x chart classes, compat). Internal.
 */
export interface UntypedEvents {
  on(name: string, listener: (payload: unknown) => void): unknown;
  off(name: string, listener?: (payload: unknown) => void): unknown;
  emit(name: string, payload?: unknown): void;
}

/** The same handle, seen without event typing. Internal. */
export const untyped = (handle: ChartHandle): UntypedEvents =>
  handle as unknown as UntypedEvents;
