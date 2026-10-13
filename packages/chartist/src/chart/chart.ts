import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline, type PipelineState } from '../pipeline/phases';
import { domRenderer } from '../render/dom';
import { estimateText } from '../render/measure';
import type { RenderOutput } from '../render/types';
import { eventMethods, installPlugins, registerListeners } from './plugins';
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
  const provided = new Set<string>();

  /**
   * Measures like 1.x: a probe svg with the chart's size attributes is
   * placed in the container and its size read, so percentages and CSS apply.
   */
  function measureSvg() {
    const width = String(current.width ?? '100%');
    const height = String(current.height ?? '100%');
    const probe = container.ownerDocument.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    probe.setAttribute('width', width);
    probe.setAttribute('height', height);
    probe.setAttribute('style', `width: ${width}; height: ${height};`);
    container.appendChild(probe);
    const measured = { width: probe.clientWidth, height: probe.clientHeight };
    probe.remove();
    return measured;
  }

  function size() {
    // The 1.x order: viewBox, the rendered svg, the fixed size option.
    const svg = measureSvg();
    return {
      width:
        current.viewBox?.width ||
        svg.width ||
        (fixedSize(current.width) ?? container.clientWidth),
      height:
        current.viewBox?.height ||
        svg.height ||
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
    container,
    update(changes) {
      current = { ...current, ...changes };
      render('resolve');
      return handle;
    },
    detach() {
      observer?.disconnect();
      observer = undefined;
      return handle;
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      handle.detach();
      output?.remove?.();
      emitter.clear();
    },
    ...eventMethods(emitter, () => handle, provided)
  };

  installPlugins(handle, config.plugins, provided);
  registerListeners(handle, config.on);
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
