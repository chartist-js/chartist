import type { SceneNode } from '../index';
import { readRules, styled } from './cascade';

/**
 * Options of {@link applyStyles}.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 */
export interface ApplyStylesOptions {
  /**
   * The color scheme to style for: which value of `light-dark()` and which
   * `@media (prefers-color-scheme)` rules apply.
   */
  readonly colorScheme?: 'light' | 'dark';
}

/**
 * Writes CSS into a scene as SVG presentation attributes, so its markup
 * draws the same in tools that read SVG on its own: rasterizers that make
 * PNGs, PDF libraries, email. Every SVG element gets the values the CSS
 * gives it, with custom properties and `light-dark()` resolved, as
 * attributes such as `stroke="#d70206"`. Its classes stay, so a page can
 * still style the markup.
 *
 * It matches rules as a browser does, per element of the scene: type,
 * class and attribute selectors, `:not()`, `:is()` and `:where()`, and the
 * descendant and child combinators, ranked by `!important`, the element's
 * own `style`, specificity and order. Rules in `@media
 * (prefers-color-scheme)` apply for their scheme, `@supports` and `@layer`
 * blocks are read in place, and other at-rules, nested rules and selectors
 * with other pseudo-classes (`:hover`) are left out. Elements inside a
 * `foreignObject` (HTML labels) are left as they are: use SVG labels for
 * images.
 *
 * Pass only stylesheets your application controls: CSS values, `url()`
 * included, end up in the markup.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 * @param scene A scene, usually from `toScene()`; it isn't changed
 * @param css A stylesheet's text, or several, applied in order as if the
 *   later ones came later in the page
 * @param options The color scheme; `light` by default
 * @returns A copy of the scene with the styles as attributes
 * @example
 * ```ts
 * import { readFileSync } from 'node:fs';
 * import { createRequire } from 'node:module';
 * import { lineChartConfig } from 'chartist';
 * import { applyStyles, renderToString, toScene } from 'chartist/server';
 *
 * const css = readFileSync(
 *   createRequire(import.meta.url).resolve('chartist/styles.css'),
 *   'utf8'
 * );
 * const scene = toScene(
 *   lineChartConfig({ labels: ['Mon', 'Tue', 'Wed'], series: [[5, 2, 4]] }),
 *   { width: 600, height: 300 }
 * );
 *
 * // SVG for a rasterizer: the colors and widths as attributes.
 * export const svg = renderToString(applyStyles(scene, css));
 * ```
 */
export function applyStyles(
  scene: SceneNode,
  css: string | readonly string[],
  options: ApplyStylesOptions = {}
): SceneNode {
  const scheme = options.colorScheme ?? 'light';
  const sheets = typeof css === 'string' ? [css] : css;
  return styled(scene, [], new Map(), readRules(sheets, scheme), scheme);
}
