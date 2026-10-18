import { estimateText } from '../render/measure';
import { renderToString } from '../server/string';
import { withFields, type AttrValue, type SceneNode } from '../scene/node';
import {
  chartRootSize,
  HYDRATION_ATTRIBUTE,
  markedRoot,
  type HydrationMarker
} from './hydration';
import { buildScene, type SceneSize } from './toScene';
import type { ChartConfig } from './types';

// The CSS properties SVG has presentation attributes for, without the
// geometry properties (`x`, `r`, `d`), which only some elements take. A
// string, not a Set, so bundles without renderForHydration() drop it.
const presentation =
  ' alignment-baseline baseline-shift clip-path clip-rule color' +
  ' color-interpolation color-interpolation-filters cursor direction' +
  ' display dominant-baseline fill fill-opacity fill-rule filter' +
  ' flood-color flood-opacity font-family font-size font-size-adjust' +
  ' font-stretch font-style font-variant font-weight image-rendering' +
  ' letter-spacing lighting-color marker-end marker-mid marker-start mask' +
  ' opacity overflow paint-order pointer-events shape-rendering stop-color' +
  ' stop-opacity stroke stroke-dasharray stroke-dashoffset stroke-linecap' +
  ' stroke-linejoin stroke-miterlimit stroke-opacity stroke-width' +
  ' text-anchor text-decoration text-rendering unicode-bidi vector-effect' +
  ' visibility word-spacing writing-mode ';

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
    if (
      separator > 0 &&
      presentation.includes(` ${name} `) &&
      !/!important/i.test(value)
    ) {
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
  const { style, ...attrs } = current.attrs;
  const inner = html || current.name === 'foreignObject';
  const children = current.children.map(child => withoutStyles(child, inner));
  if (
    style === undefined &&
    children.every((child, index) => child === current.children[index])
  ) {
    return current;
  }
  return withFields(current, {
    attrs:
      style === undefined || html
        ? attrs
        : { ...attrs, ...presentationAttributes(String(style)) },
    children
  });
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
 * @param config The chart, as the browser creates it: data, axes, layers,
 *   plugins and listeners
 * @param size The size to lay out at, in px, and how to measure text; use
 *   the estimate (no `measureText`), which the browser replays
 * @returns The SVG markup, its root marked with `data-ct-hydrate`
 * @example
 * ```ts
 * import { lineChartConfig, renderForHydration } from 'chartist';
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
  const scene = buildScene(config, {
    width: size.width,
    height: size.height,
    measureText: size.measureText ?? estimateText,
    labels,
    rootSize: chartRootSize(config)
  });
  return renderToString(
    withoutStyles(scene, false).attr({
      ...markedRoot(marker),
      [HYDRATION_ATTRIBUTE]: JSON.stringify(marker)
    })
  );
}
