import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline, type PipelineEnvironment } from '../pipeline/phases';
import {
  estimateText,
  type LabelMode,
  type MeasureText
} from '../render/measure';
import type { SceneNode } from '../scene/node';
import { withChartTypeClass } from './className';
import {
  eventMethods,
  installPlugins,
  listenerScope,
  registerListeners
} from './plugins';
import type { ChartConfig, ChartHandle } from './types';

/**
 * The size {@link toScene} and `renderForHydration()` lay a chart out at,
 * since there's no container to measure, and how to measure text there.
 */
export interface SceneSize {
  /**
   * The width to lay out at, in px. In `toScene()`, the root svg gets it
   * as its `width`, unless the config sets one.
   */
  readonly width: number;
  /**
   * The height to lay out at, in px. In `toScene()`, the root svg gets it
   * as its `height`, unless the config sets one.
   */
  readonly height: number;
  /** Text measurement for layout; an estimate by default. */
  readonly measureText?: MeasureText;
  /**
   * Label mode when the config sets none. `svg` by default in `toScene()`,
   * since string output often goes to tools without HTML support; `html`
   * in `renderForHydration()`, as `chart()` draws them.
   */
  readonly labels?: LabelMode;
}

function unavailable(method: string): never {
  throw new Error(`Chartist: ${method}() is not available in toScene()`);
}

/**
 * Builds a chart's scene without rendering it: no DOM, timers or globals.
 * Runs the phases `resolve` to `scene` with the config's plugins and
 * listeners.
 *
 * It takes the same config as `chart()`, and the SVG gets the same chart
 * type class without `className`. Listeners of `render` and `mount`
 * never run, responsive overrides and the `renderer` are ignored, and
 * calling `update()`, `detach()` or `destroy()` on the handle a plugin gets
 * throws. Turn the scene into markup with `renderToString()` from
 * `chartist/server`, which re-exports this function.
 *
 * @param config The chart: data, axes, layers, plugins and listeners
 * @param size The size to lay out at, in px, and how to measure text
 * @returns The scene, its root the `svg`
 * @example
 * ```ts
 * import { lineChartConfig, node, toScene } from 'chartist';
 * import { renderToString } from 'chartist/server';
 *
 * const config = lineChartConfig(
 *   { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], series: [[12, 9, 7, 8, 5]] },
 *   {
 *     viewBox: { width: 600, height: 300 },
 *     on: {
 *       // Styles inside the SVG, for tools that read it on its own.
 *       scene: ({ scene }) => ({
 *         scene: scene.append(
 *           node('style').text('.ct-line { fill: none; stroke: #d70206; }'),
 *           true
 *         )
 *       })
 *     }
 *   }
 * );
 * const scene = toScene(config, { width: 600, height: 300 });
 *
 * export const markup = renderToString(scene);
 * ```
 */
export function toScene(config: ChartConfig, size: SceneSize): SceneNode {
  return buildScene(config, {
    width: size.width,
    height: size.height,
    measureText: size.measureText ?? estimateText,
    labels: size.labels ?? 'svg'
  });
}

/**
 * Runs the phases `resolve` to `scene` without a DOM, with the config's
 * plugins and listeners on a handle that can't update or remove the chart.
 */
export function buildScene(
  config: ChartConfig,
  environment: PipelineEnvironment
): SceneNode {
  const emitter = createPhaseEmitter();
  const provided = new Set<string>();
  const scope = listenerScope();
  const handle: ChartHandle = {
    update: () => unavailable('update'),
    detach: () => unavailable('detach'),
    destroy: () => unavailable('destroy'),
    ...eventMethods(emitter, () => handle, provided, scope)
  };
  installPlugins(handle, config.plugins, provided, scope);
  registerListeners(handle, config.on);
  return runPipeline(emitter, withChartTypeClass(config), environment).scene;
}
