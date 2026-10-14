import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import {
  estimateText,
  type LabelMode,
  type MeasureText
} from '../render/measure';
import type { SceneNode } from '../scene/node';
import { eventMethods, installPlugins, registerListeners } from './plugins';
import type { ChartConfig, ChartHandle } from './types';

/**
 * The size and text measuring for {@link toScene}, which has no container
 * to read them from.
 */
export interface SceneSize {
  /** The chart's width in px. */
  readonly width: number;
  /** The chart's height in px. */
  readonly height: number;
  /** Text measurement for layout; an estimate by default. */
  readonly measureText?: MeasureText;
  /**
   * Label mode when the config sets none: `svg` by default, since string
   * output often goes to tools without HTML support.
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
 * @experimental
 */
export function toScene(config: ChartConfig, size: SceneSize): SceneNode {
  const emitter = createPhaseEmitter();
  const provided = new Set<string>();
  const handle: ChartHandle = {
    update: () => unavailable('update'),
    detach: () => unavailable('detach'),
    destroy: () => unavailable('destroy'),
    ...eventMethods(emitter, () => handle, provided)
  };
  installPlugins(handle, config.plugins, provided);
  registerListeners(handle, config.on);
  return runPipeline(emitter, config, {
    width: size.width,
    height: size.height,
    measureText: size.measureText ?? estimateText,
    labels: size.labels ?? 'svg'
  }).scene;
}
