import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline, type PipelineState } from '../pipeline/phases';
import { domRenderer } from '../render/dom';
import { estimateText } from '../render/measure';
import type { RenderOutput } from '../render/types';
import { installPlugins, listenerMethods, registerListeners } from './plugins';
import type { ChartConfig, ChartHandle } from './types';

/** A fixed size in px: a number or a px string. Other units are measured. */
function fixedSize(value: number | string | undefined): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  const match = value?.match(/^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/);
  return match ? Number(match[1]) : undefined;
}

function resolveTarget(target: string | Element): Element {
  const container =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) {
    throw new Error(
      `Target element ${typeof target === 'string' ? `"${target}"` : ''} is not found`
    );
  }
  return container;
}

/**
 * Creates a chart in a container and renders it synchronously. Listeners in
 * `config.on` and plugins receive the events of this first render.
 * @experimental
 */
export function chart(
  target: string | Element,
  config: ChartConfig
): ChartHandle {
  const container = resolveTarget(target);
  const emitter = createPhaseEmitter();
  const renderer = config.renderer ?? domRenderer();
  const measureText = renderer.measureText ?? estimateText;
  let current = config;
  let state: PipelineState | undefined;
  let output: RenderOutput | undefined;
  let observer: ResizeObserver | undefined;
  let destroyed = false;

  function size() {
    // As 1.x: a viewBox defines the drawing size.
    return {
      width:
        current.viewBox?.width ||
        (fixedSize(current.width) ?? container.clientWidth),
      height:
        current.viewBox?.height ||
        (fixedSize(current.height) ?? container.clientHeight)
    };
  }

  function render(from: 'resolve' | 'layout') {
    const { width, height } = size();
    state = runPipeline(
      emitter,
      current,
      {
        width,
        height,
        measureText,
        rootSize: {
          width: current.width ?? '100%',
          height: current.height ?? '100%'
        }
      },
      state,
      from
    );
    const { scene } = state;
    output = renderer.render(scene, container);
    emitter.notify('render', { scene, output });
    const elementOf = output.elementOf ?? (() => undefined);
    emitter.notify('mount', { scene, output, elementOf });
  }

  const handle: ChartHandle = {
    update(changes) {
      current = { ...current, ...changes };
      render('resolve');
      return handle;
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      observer?.disconnect();
      output?.remove?.();
      emitter.clear();
    },
    ...listenerMethods(emitter, () => handle)
  };

  installPlugins(handle, config.plugins);
  registerListeners(emitter, config.on);
  render('resolve');

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => {
      const { width, height } = size();
      if (
        !destroyed &&
        state &&
        (width !== state.layout.width || height !== state.layout.height)
      ) {
        render('layout');
      }
    });
    observer.observe(container);
  }

  return handle;
}
