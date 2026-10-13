import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline, type PipelineState } from '../pipeline/phases';
import { domRenderer } from '../render/dom';
import { estimateText, type MeasureText } from '../render/measure';
import type { RenderOutput } from '../render/types';
import type { ResponsiveWatcher } from '../responsive/responsive';
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
  const rendererMeasure = renderer.measureText;
  // Whether the last render measured text (SVG text labels do).
  let measuredText = false;
  // Text is measured in the container, so the chart's CSS applies.
  const measureText: MeasureText = (text, options) => {
    measuredText = true;
    return rendererMeasure
      ? rendererMeasure(text, { container, ...options })
      : estimateText(text, options);
  };
  // The config as given, and with the matching responsive overrides.
  let current = config;
  let effective = config;
  let watcher: ResponsiveWatcher | undefined;
  let state: PipelineState | undefined;
  let output: RenderOutput | undefined;
  let observer: ResizeObserver | undefined;
  let destroyed = false;
  const provided = new Set<string>();
  const fonts = container.ownerDocument.fonts as FontFaceSet | undefined;
  // Layout that measured text depends on font metrics, so it runs again
  // when web fonts finish loading. HTML labels reflow by themselves.
  const onFontsLoaded = () => {
    if (!destroyed && state && measuredText) {
      render('layout');
    }
  };

  /**
   * Measures like 1.x: a probe svg with the chart's size attributes is
   * placed in the container and its size read, so percentages and CSS apply.
   */
  function measureSvg() {
    const width = String(effective.width ?? '100%');
    const height = String(effective.height ?? '100%');
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
        effective.viewBox?.width ||
        svg.width ||
        (fixedSize(effective.width) ?? container.clientWidth),
      height:
        effective.viewBox?.height ||
        svg.height ||
        (fixedSize(effective.height) ?? container.clientHeight)
    };
  }

  function render(from: 'resolve' | 'layout') {
    const { width, height } = size();
    measuredText = false;
    state = runPipeline(
      emitter,
      effective,
      {
        width,
        height,
        measureText,
        labels: renderer.labels ?? 'html',
        rootSize: {
          width: effective.width ?? '100%',
          height: effective.height ?? '100%'
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

  function resolveResponsive() {
    const entries = current.responsive?.entries;
    effective = watcher
      ? watcher.matching.reduce(
          (result, index) => ({ ...result, ...entries![index][1] }),
          current
        )
      : current;
  }

  function onResponsiveChange() {
    const previousConfig = effective;
    resolveResponsive();
    handle.emit('responsive', { previousConfig, currentConfig: effective });
    render('resolve');
  }

  /** (Re)creates the watcher of the responsive entries. */
  function watch() {
    watcher?.stop();
    watcher = current.responsive?.watch(container, () => {
      if (!destroyed) {
        onResponsiveChange();
      }
    });
    resolveResponsive();
  }

  const handle: ChartHandle = {
    container,
    update(changes) {
      current = { ...current, ...changes };
      if ('responsive' in changes) {
        watch();
      } else {
        resolveResponsive();
      }
      render('resolve');
      return handle;
    },
    detach() {
      observer?.disconnect();
      observer = undefined;
      fonts?.removeEventListener('loadingdone', onFontsLoaded);
      watcher?.stop();
      watcher = undefined;
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
  watch();
  render('resolve');

  fonts?.addEventListener('loadingdone', onFontsLoaded);

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => {
      if (destroyed || !state) {
        return;
      }
      // A crossed container breakpoint renders the new size too.
      if (watcher?.check()) {
        onResponsiveChange();
        return;
      }
      const { width, height } = size();
      if (width !== state.layout.width || height !== state.layout.height) {
        render('layout');
      }
    });
    observer.observe(container);
  }

  return handle;
}
