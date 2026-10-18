import type { AttrValue, SceneNode } from '../index';
import { computeValues, readRules } from './cascade';
import { readDeclarations, type SkipReason } from './css';
import { isPresentation } from './presentation';

/**
 * The styles of a scene's elements: for a scene node, the values of the CSS
 * properties it gets (property to value, e.g. `{ stroke: '#d70206' }`), or
 * nothing. {@link computeStyles} makes one with Chartist's own CSS engine;
 * another engine can make one too, for {@link applyStyles}.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 */
export type ComputedStyles = (
  node: SceneNode
) => Readonly<Record<string, string>> | undefined;

/**
 * A part of a stylesheet that {@link computeStyles} left out, as `onSkip`
 * gets it: its text and why. `at-rule` for an at-rule other than
 * `@media (prefers-color-scheme)`, `@supports` and `@layer`; `selector` for
 * a selector it can't match; `nested` for a nested rule; `shorthand` for
 * `font`; `value` for a declaration whose value doesn't resolve on an
 * element (a `var()` without a value or fallback there).
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 */
export interface SkippedStyle {
  /** The part as written: an at-rule's prelude, a selector, a declaration. */
  readonly text: string;
  /** Why it was left out. */
  readonly reason: SkipReason;
}

/**
 * Options of {@link computeStyles}.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 */
export interface ComputeStylesOptions {
  /**
   * The color scheme to style for: which value of `light-dark()` and which
   * `@media (prefers-color-scheme)` rules apply.
   */
  readonly colorScheme?: 'light' | 'dark';
  /**
   * Called once for each part of the stylesheets that was left out, so a
   * rule that doesn't apply says why. Rules for the other color scheme
   * and pseudo-elements (`::before`), which style nothing in SVG, aren't
   * reported.
   */
  readonly onSkip?: (skipped: SkippedStyle) => void;
}

/**
 * Options of {@link applyStyles} when it gets CSS: those of
 * {@link computeStyles}.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 */
export type ApplyStylesOptions = ComputeStylesOptions;

/**
 * Computes the styles a scene's SVG elements get from CSS, with Chartist's
 * own CSS engine: a small one, made for chart styles. Pass the result to
 * {@link applyStyles}.
 *
 * It matches rules as a browser does, per element, with the scene below a
 * page's `html` and `body` (so `:root`, `html` and `body` rules apply, and
 * their custom properties reach the chart): type, class and attribute
 * selectors, `:root`, `:not()`, `:is()` and `:where()`, and the descendant
 * and child combinators, ranked by `!important`, the element's own `style`,
 * specificity and order. Custom properties are resolved per element, and
 * `light-dark()` by `colorScheme`. Rules in `@media (prefers-color-scheme)`
 * apply for their scheme, and `@supports` and `@layer` blocks are read in
 * place.
 *
 * What it doesn't support it leaves out, and reports to `onSkip`: other
 * at-rules, sibling and structural selectors (`+`, `~`, `:nth-child()`),
 * ids and other pseudo-classes, nested rules and the `font` shorthand.
 * `calc()` and relative units such as `rem` are passed on as written. For
 * full CSS, compute the styles with a browser and pass those to
 * `applyStyles()`. Only the values of properties SVG has presentation
 * attributes for are computed; elements inside a `foreignObject` (HTML
 * labels) get none.
 *
 * Pass only stylesheets your application controls: CSS values, `url()`
 * included, end up in the markup.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 * @param scene A scene, usually from `toScene()`
 * @param css A stylesheet's text, or several, applied in order as if the
 *   later ones came later in the page
 * @param options The color scheme (`light` by default), and `onSkip`
 * @returns The values each node gets
 * @example
 * ```ts
 * import { lineChartConfig } from 'chartist';
 * import { applyStyles, computeStyles, toScene } from 'chartist/server';
 *
 * const css = '.ct-line { stroke: teal; } .ct-series:nth-child(2) { stroke: red; }';
 * const scene = toScene(lineChartConfig({ series: [[5, 2, 4]] }), {
 *   width: 600,
 *   height: 300
 * });
 *
 * const styles = computeStyles(scene, css, {
 *   // `.ct-series:nth-child(2)`: selector
 *   onSkip: ({ text, reason }) => console.warn(`${text}: ${reason}`)
 * });
 * export const styled = applyStyles(scene, styles);
 * ```
 */
export function computeStyles(
  scene: SceneNode,
  css: string | readonly string[],
  options: ComputeStylesOptions = {}
): ComputedStyles {
  const scheme = options.colorScheme ?? 'light';
  const { onSkip } = options;
  const report =
    onSkip &&
    ((reason: SkipReason, text: string) => {
      onSkip({ text, reason });
    });
  const sheets = typeof css === 'string' ? [css] : css;
  const values = computeValues(
    scene,
    readRules(sheets, scheme, report),
    scheme,
    report
  );
  return current => values.get(current);
}

/** The node with its styles as attributes, and its children the same. */
function written(current: SceneNode, styles: ComputedStyles): SceneNode {
  const style =
    current.attrs.style === undefined
      ? []
      : readDeclarations(String(current.attrs.style));
  const attrs: Record<string, AttrValue | undefined> = {};
  // Declarations of the `style` attribute with another value than `styles`.
  const replaced = new Set<string>();
  for (const [property, value] of Object.entries(styles(current) ?? {})) {
    if (!isPresentation(property)) {
      continue;
    }
    const inline = style.findLast(
      declaration => declaration.property === property
    );
    if (inline?.value === value) {
      continue;
    }
    attrs[property] = value;
    if (inline) {
      replaced.add(property);
    }
  }
  if (replaced.size) {
    const kept = style.filter(
      declaration => !replaced.has(declaration.property)
    );
    attrs.style = kept.length
      ? kept
          .map(
            ({ property, value, important }) =>
              `${property}: ${value}${important ? ' !important' : ''};`
          )
          .join(' ')
      : undefined;
  }
  let next = Object.keys(attrs).length ? current.attr(attrs) : current;

  if (current.name !== 'foreignObject' && current.children.length) {
    const children = current.children.map(child => written(child, styles));
    if (children.some((child, index) => child !== current.children[index])) {
      next = children.reduce(
        (parent, child) => parent.append(child),
        next.empty()
      );
      if (current.content !== undefined) {
        next = next.text(current.content);
      }
    }
  }
  return next;
}

/**
 * Writes styles into a scene as SVG presentation attributes, so its markup
 * draws the same in tools that read SVG on its own: rasterizers that make
 * PNGs, PDF libraries, email. Every SVG element gets its values as
 * attributes such as `stroke="#d70206"`; values of properties SVG has no
 * attribute for are left out. Its classes stay, so a page can still style
 * the markup, and elements inside a `foreignObject` (HTML labels) are left
 * as they are: use SVG labels for images.
 *
 * Give it CSS, which {@link computeStyles} computes with Chartist's own,
 * small CSS engine, or the styles another engine computed, such as a
 * headless browser's `getComputedStyle()` for each element.
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 * @param scene A scene, usually from `toScene()`; it isn't changed
 * @param styles The values per node from {@link computeStyles} or another
 *   engine, or the CSS for `computeStyles()`: a stylesheet's text or
 *   several, applied in order
 * @param options With CSS: the options of `computeStyles()`
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
  styles: ComputedStyles | string | readonly string[],
  options: ApplyStylesOptions = {}
): SceneNode {
  return written(
    scene,
    typeof styles === 'function'
      ? styles
      : computeStyles(scene, styles, options)
  );
}
