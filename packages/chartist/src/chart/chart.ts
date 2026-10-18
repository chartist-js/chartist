import { createPhaseEmitter } from '../pipeline/emitter';
import {
  runPipeline,
  type PipelineEnvironment,
  type PipelineState
} from '../pipeline/phases';
import { domRenderer } from '../render/dom';
import {
  estimateText,
  type MeasureStyle,
  type MeasureText
} from '../render/measure';
import { setStyle } from '../render/style';
import type {
  Keyframes,
  RenderCause,
  RenderOutput,
  RenderUpdate
} from '../render/types';
import type { SceneNode } from '../scene/node';
import type { ResponsiveWatcher } from '../responsive/responsive';
import { replacementChanges, replacesOutput } from './changes';
import { withChartTypeClass } from './className';
import { chartRootSize, HYDRATION_ATTRIBUTE } from './hydration';
import {
  eventMethods,
  installPlugins,
  listenerScope,
  registerListeners,
  runAll,
  type InstalledPlugins
} from './plugins';
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
 * Creates a chart from data, axes and layers in a container, and renders
 * it right away. The presets (`lineChart`, `barChart`, `pieChart`) are
 * built on it; use it for what they don't cover, like bars and a line on
 * two Y axes.
 *
 * The chart fills its container unless the config sets a size, and renders
 * again when the container resizes, web fonts finish loading or the
 * matching `responsive` entries change. Listeners in `config.on` and
 * plugins receive the events of the first render too. While the page is
 * printed, the SVG gets a `viewBox` of its layout size (unless the config
 * sets one), so the drawing scales into the box it gets in the print.
 *
 * Without `className`, the SVG gets the chart type class of its layers,
 * so the stylesheet's chart type rules apply: `ct-chart-bar` if a layer
 * draws bars, else `ct-chart-pie` or `ct-chart-donut` for a pie layer,
 * else `ct-chart-line`. A `className` replaces it.
 *
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   bar,
 *   cartesianAxes,
 *   chart,
 *   line,
 *   stepAxis
 * } from 'chartist';
 *
 * const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
 *
 * chart('#chart', {
 *   data: {
 *     labels: months,
 *     series: [
 *       { name: 'rain', data: [64, 58, 70, 82, 104, 120] },
 *       { name: 'temperature', data: [1, 3, 8, 12, 16, 20] }
 *     ]
 *   },
 *   axes: cartesianAxes([
 *     { id: 'month', side: 'bottom', type: stepAxis(), ticks: months },
 *     { id: 'mm', side: 'left', type: autoScaleAxis(), low: 0 },
 *     { id: 'celsius', side: 'right', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [
 *     axisGrid({ axes: ['month', 'mm'] }),
 *     bar({ series: ['rain'], x: 'month', y: 'mm' }),
 *     line({ series: ['temperature'], y: 'celsius', align: 'center' }),
 *     axisLabels()
 *   ]
 * });
 * ```
 * @param target The container element, or a CSS selector for it.
 * @param config The data, axes, layers and the rest of the chart.
 * @returns A handle to update the chart, listen to it or remove it.
 */
export function chart(
  target: string | Element,
  config: ChartConfig
): ChartHandle {
  const container = resolveTarget(target);
  const emitter = createPhaseEmitter();
  const scope = listenerScope();
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
  // Styles for layout (a donut's ring width), read in the container too.
  const rendererStyle = renderer.measureStyle;
  const measureStyle: MeasureStyle | undefined =
    rendererStyle &&
    ((property, options) => rendererStyle(property, { container, ...options }));
  // The config as given, and with the matching responsive overrides.
  let current = config;
  let effective = config;
  let watcher: ResponsiveWatcher | undefined;
  let state: PipelineState | undefined;
  let output: RenderOutput | undefined;
  // The functions the last render's `mount` listeners returned.
  let cleanups: (() => void)[] = [];
  let installed: InstalledPlugins = { plugins: [], cleanups: [] };
  // Which layer drew each node of the current scene, once asked for.
  let layerOf: WeakMap<SceneNode, number> | undefined;
  let observer: ResizeObserver | undefined;
  let destroyed = false;
  // Cleared by detach(), also when it's called during the first render.
  let attached = true;
  const provided = new Set<string>();
  // The container's window, which may be an iframe's or jsdom's.
  const view = container.ownerDocument.defaultView;
  const fonts = container.ownerDocument.fonts as FontFaceSet | undefined;
  // Layout that measured text depends on font metrics, so it runs again
  // when web fonts finish loading. HTML labels reflow by themselves.
  const onFontsLoaded = () => {
    if (!destroyed && state && measuredText) {
      render('layout', 'fonts');
    }
  };

  // While printing, the svg gets a viewBox of its layout size, so the
  // drawing scales into the box print CSS gives it. Browsers don't reliably
  // take a new layout at the print size into the print, but they do take
  // changes made in `beforeprint`.
  let printed: Element | undefined;
  let printing = false;
  function applyPrintViewBox() {
    printed?.removeAttribute('viewBox');
    printed = undefined;
    if (!printing || effective.viewBox || !state || !output?.elementOf) {
      return;
    }
    printed = output.elementOf(state.scene);
    printed?.setAttribute(
      'viewBox',
      `0 0 ${state.layout.width} ${state.layout.height}`
    );
  }
  const onBeforePrint = () => {
    printing = true;
    applyPrintViewBox();
  };
  const onAfterPrint = () => {
    printing = false;
    applyPrintViewBox();
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
    // CSS lengths need a unit, unlike the attributes (see #1482).
    const px = (value: unknown) => (typeof value === 'number' ? 'px' : '');
    setStyle(
      probe,
      `width: ${width}${px(effective.width)}; height: ${height}${px(effective.height)};`
    );
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

  /**
   * Asks the plugins with `keyframes`, in order, then the layer that drew
   * the node, for the keyframes of a node's update animation.
   */
  function keyframes(
    previous: SceneNode,
    next: SceneNode,
    progress: readonly number[]
  ): Keyframes | undefined {
    for (const plugin of installed.plugins) {
      const frames = plugin.keyframes?.(previous, next, progress);
      if (frames) {
        return frames;
      }
    }
    if (!state) {
      return undefined;
    }
    if (!layerOf) {
      // Built once per render, on the first question: which layer drew
      // each node. Nodes a `scene` listener replaced belong to none.
      const map = new WeakMap<SceneNode, number>();
      const mark = (drawnNode: SceneNode, index: number) => {
        map.set(drawnNode, index);
        drawnNode.children.forEach(child => mark(child, index));
      };
      state.drawn.forEach(({ nodes }, index) =>
        nodes.forEach(top => mark(top, index))
      );
      layerOf = map;
    }
    const index = layerOf.get(next);
    return index === undefined
      ? undefined
      : state.config.layers[index].keyframes?.(
          previous,
          next,
          state.drawn[index].context,
          progress
        );
  }

  /**
   * Renders the chart. A `hydrate` render lets the renderer take server
   * markup over instead (see `Renderer.adopt`), and returns false when it
   * doesn't. The render after it is a `correction`, at the container's real
   * size: when the renderer patched nothing, the elements are what the
   * `hydrate` render mounted, so it emits nothing and keeps that render's
   * cleanups.
   */
  function render(
    from: 'resolve' | 'layout',
    cause: RenderCause,
    correction = false
  ): boolean {
    measuredText = false;
    const previous = state;
    const previousOutput = output;
    const previousSvg = previous && previousOutput?.elementOf?.(previous.scene);
    if (previousSvg && !container.contains(previousSvg)) {
      // eslint-disable-next-line no-console
      console.warn(
        "Chartist: other code removed the chart's svg, so it draws a new one. Render server markup into a container only once."
      );
    }
    const layOut = (
      layoutConfig: ChartConfig,
      environment: Omit<PipelineEnvironment, 'rootSize'>
    ) => {
      state = runPipeline(
        emitter,
        withChartTypeClass(layoutConfig),
        { ...environment, rootSize: chartRootSize(layoutConfig) },
        previous,
        from
      );
      layerOf = undefined;
      return state.scene;
    };
    const pending = cleanups;
    let update: RenderUpdate | undefined;
    let rendered: (RenderOutput & { readonly repaired?: number }) | undefined;
    if (cause === 'hydrate') {
      // The server's layout: no responsive overrides, estimated text.
      rendered = renderer.adopt?.(container, layout =>
        layOut(current, { ...layout, measureText: estimateText })
      );
      if (!rendered) {
        state = previous;
        return false;
      }
    } else {
      const scene = layOut(effective, {
        ...size(),
        measureText,
        measureStyle,
        labels: renderer.labels ?? 'html'
      });
      if (!correction) {
        cleanups = [];
        runAll(pending);
      }
      update =
        previous && previousOutput && !replacesOutput(handle)
          ? {
              previous: previousOutput,
              previousScene: previous.scene,
              cause,
              labels: state!.data.labels,
              previousLabels: previous.data.labels,
              keyframes
            }
          : undefined;
      rendered = renderer.render(scene, container, update);
    }
    const { scene } = state!;
    output = rendered;
    if (correction) {
      if (rendered.patched && !rendered.changes?.length) {
        return true;
      }
      // Run after the patch, which only then says whether it changed
      // anything.
      cleanups = [];
      runAll(pending);
    }
    if (printing) {
      applyPrintViewBox();
    }
    const changes =
      update && rendered.patched && rendered.changes
        ? rendered.changes
        : replacementChanges(previous?.scene, scene);
    const event = {
      scene,
      output: rendered,
      cause,
      changes,
      previous: previous?.scene,
      ...(cause === 'hydrate' && {
        hydration: { repaired: rendered.repaired! }
      })
    };
    emitter.notify('render', event);
    // Nodes of `remove` changes are in the previous output.
    const elementOf = (node: SceneNode) =>
      rendered.elementOf?.(node) ?? previousOutput?.elementOf?.(node);
    cleanups = emitter
      .notify('mount', { ...event, elementOf, animation: rendered.animation })
      .filter((result): result is () => void => typeof result === 'function');
    if (cause === 'hydrate' && !destroyed) {
      // The server's scaling viewBox (the scene has none of its own) and
      // marker served the markup until now; from here on, the chart lays
      // itself out at the real size.
      const svg = rendered.elementOf?.(scene);
      if (!scene.attrs.viewBox) {
        svg?.removeAttribute('viewBox');
      }
      svg?.removeAttribute(HYDRATION_ATTRIBUTE);
      render('resolve', 'resize', true);
    }
    return true;
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
    render('resolve', 'responsive');
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
      render('resolve', 'update');
      return handle;
    },
    detach() {
      attached = false;
      view?.removeEventListener('beforeprint', onBeforePrint);
      view?.removeEventListener('afterprint', onAfterPrint);
      onAfterPrint();
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
      const pending = cleanups;
      cleanups = [];
      try {
        runAll(pending);
      } finally {
        output?.remove?.();
        emitter.clear();
        runAll([...installed.cleanups].reverse());
      }
    },
    ...eventMethods(emitter, () => handle, provided, scope)
  };

  // Subscribed before the plugins install and the first render, so a
  // detach() from one of their listeners unsubscribes them.
  fonts?.addEventListener('loadingdone', onFontsLoaded);
  view?.addEventListener('beforeprint', onBeforePrint);
  view?.addEventListener('afterprint', onAfterPrint);

  const Observer = view?.ResizeObserver ?? globalThis.ResizeObserver;
  if (typeof Observer !== 'undefined') {
    observer = new Observer(() => {
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
        render('layout', 'resize');
      }
    });
    observer.observe(container);
  }

  installed = installPlugins(handle, config.plugins, provided, scope);
  registerListeners(handle, config.on);
  if (attached) {
    watch();
  } else {
    resolveResponsive();
  }
  // Charts that always draw a new svg can't keep server markup.
  if (replacesOutput(handle) || !render('resolve', 'hydrate')) {
    render('resolve', 'create');
  }

  return handle;
}
