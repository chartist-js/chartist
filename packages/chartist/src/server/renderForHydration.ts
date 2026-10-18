import {
  toScene,
  type AttrValue,
  type ChartConfig,
  type LabelMode,
  type SceneNode,
  type SceneSize
} from '../index';
import { isPresentation } from './presentation';
import { renderToString } from './string';

/**
 * The root attribute the browser reads the layout from. `chart()` (which
 * removes it) and `liveDomRenderer()` (which reads it) name it in the core;
 * the hydration tests fail if the names drift apart.
 */
const MARKER = 'data-ct-hydrate';

/** What the root records for the browser to build the same scene again. */
interface HydrationMarker {
  /** The marker's version; others aren't taken over. */
  readonly v: 1;
  /** The layout size in px. */
  readonly width: number;
  readonly height: number;
  /** The label mode the scene was laid out with. */
  readonly labels: LabelMode;
  /** `estimate` for the built-in estimate, `custom` for a `measureText`. */
  readonly text: 'estimate' | 'custom';
  /** Whether the root got a `viewBox` that only scales until hydration. */
  readonly scale: boolean;
}

/**
 * The declarations of a style that an SVG element can carry as presentation
 * attributes; px lengths become user units.
 */
function presentationAttributes(style: string): Record<string, AttrValue> {
  const attrs: Record<string, AttrValue> = {};
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':');
    const name = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (separator > 0 && isPresentation(name) && !/!important/i.test(value)) {
      attrs[name] = value.replace(/^(-?(?:\d+\.?\d*|\.\d+))px$/, '$1');
    }
  }
  return attrs;
}

/**
 * The scene without `style` attributes: on SVG elements, declarations SVG
 * has presentation attributes for become those; the rest, and the styles of
 * HTML elements, come from the stylesheet and the root's size attributes,
 * or are applied when the browser takes the markup over.
 */
function withoutStyles(current: SceneNode, html: boolean): SceneNode {
  const style = current.attrs.style;
  const inner = html || current.name === 'foreignObject';
  const children = current.children.map(child => withoutStyles(child, inner));
  const changed = children.some(
    (child, index) => child !== current.children[index]
  );
  let next =
    style === undefined
      ? current
      : current.attr({
          style: undefined,
          ...(html ? {} : presentationAttributes(String(style)))
        });
  if (changed) {
    next = children.reduce(
      (parent, child) => parent.append(child),
      next.empty()
    );
    if (current.content !== undefined) {
      next = next.text(current.content);
    }
  }
  return next;
}

/**
 * Renders a chart to markup that `chart()` and the presets take over in the
 * browser (hydration), instead of drawing a new chart. Needs no DOM, so it
 * works in Node.js and in server bundles; put the markup into the chart's
 * container once, and create the chart there with `liveDomRenderer()` from
 * `chartist/live` as its renderer, which keeps the server's elements.
 *
 * It lays the chart out as {@link toScene} does, at the given size. The root
 * gets the size `chart()` gives it (`100%` unless the config sets one) and,
 * unless the config sets a `viewBox`, a `viewBox` of the layout size, so
 * the drawing scales into its container until the browser lays it out at
 * the real size. Its `data-ct-hydrate` attribute records what the browser
 * needs to build the same scene again: the size, the label mode, whether
 * text was estimated and whether the `viewBox` only scales. Labels are HTML
 * unless `size.labels` or the config says otherwise, as `chart()` draws them.
 *
 * The markup has no `style` attributes, so it passes a Content Security
 * Policy of `style-src 'self'`, and it needs Chartist's stylesheet in the
 * page. Styles that SVG has attributes for (a label's `overflow`, a donut's
 * `stroke-width`) are written as those; the others, such as styles a `scene`
 * listener adds, are applied when the browser takes the markup over. For a
 * self-contained SVG image, with its styles inline (files, email, a static
 * chart), use `toScene()` and {@link renderToString} instead.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 * @param config The chart, as the browser creates it: data, axes, layers,
 *   plugins and listeners
 * @param size The size to lay out at, in px, and how to measure text; use
 *   the estimate (no `measureText`), which the browser replays
 * @returns The SVG markup, its root marked with `data-ct-hydrate`
 * @example
 * ```ts
 * import { lineChartConfig } from 'chartist';
 * import { renderForHydration } from 'chartist/server';
 *
 * const data = {
 *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
 *   series: [[12, 9, 7, 8, 5]]
 * };
 *
 * // On the server, in the chart's container:
 * export const markup = renderForHydration(lineChartConfig(data), {
 *   width: 600,
 *   height: 300
 * });
 *
 * // In the browser, the chart keeps the server's elements:
 * // lineChart('#chart', data, { renderer: liveDomRenderer() });
 * ```
 */
export function renderForHydration(
  config: ChartConfig,
  size: SceneSize
): string {
  const labels = size.labels ?? 'html';
  const marker: HydrationMarker = {
    v: 1,
    width: size.width,
    height: size.height,
    labels,
    text: size.measureText ? 'custom' : 'estimate',
    scale: !config.viewBox
  };
  const scene = toScene(config, { ...size, labels });
  return renderToString(
    withoutStyles(scene, false).attr({
      // The root size chart() draws, so both sides draw the same root.
      width: config.width ?? '100%',
      height: config.height ?? '100%',
      ...(marker.scale
        ? { viewBox: `0 0 ${marker.width} ${marker.height}` }
        : {}),
      [MARKER]: JSON.stringify(marker)
    })
  );
}
