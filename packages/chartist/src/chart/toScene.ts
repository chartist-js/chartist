import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import { estimateText, type MeasureText } from '../render/measure';
import type { SceneNode } from '../scene/node';
import { installPlugins, listenerMethods, registerListeners } from './plugins';
import type { ChartConfig, ChartHandle } from './types';

export interface SceneSize {
  readonly width: number;
  readonly height: number;
  /** Text measurement for layout; an estimate by default. */
  readonly measureText?: MeasureText;
}

function unavailable(method: string): never {
  throw new Error(`Chartist: ${method}() is not available in toScene()`);
}

/**
 * Builds a chart's scene without rendering it: no DOM, timers or globals.
 * Runs the phases `resolve` to `scene` with the config's plugins and
 * listeners.
 * @experimental
 */
export function toScene(config: ChartConfig, size: SceneSize): SceneNode {
  const emitter = createPhaseEmitter();
  const handle: ChartHandle = {
    update: () => unavailable('update'),
    destroy: () => unavailable('destroy'),
    ...listenerMethods(emitter, () => handle)
  };
  installPlugins(handle, config.plugins);
  registerListeners(emitter, config.on);
  return runPipeline(emitter, config, {
    width: size.width,
    height: size.height,
    measureText: size.measureText ?? estimateText
  }).scene;
}
