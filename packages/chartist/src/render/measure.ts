/** The size of a measured text, as a {@link MeasureText} function returns it. */
export interface TextMetrics {
  /** The text's width in px. */
  readonly width: number;
  /** The text's height in px: one line. */
  readonly height: number;
  /** The font size in px the text was measured with, when known. */
  readonly fontSize?: number;
}

/**
 * How labels are drawn: HTML in a `foreignObject` (1.x) or SVG `text`.
 * @experimental
 */
export type LabelMode = 'html' | 'svg';

/** What a {@link MeasureText} function gets with the text to measure. */
export interface MeasureTextOptions {
  /** Class names of the text, for renderers that apply CSS. */
  readonly classes?: readonly string[];
  /**
   * Font size in px. Without it, the browser measures with the CSS font
   * size and the estimate uses 12, the size of 1.x `.ct-label`.
   */
  readonly fontSize?: number;
  /** Classes of the chart's root svg, so chart-type CSS applies. */
  readonly rootClass?: string;
  /** Where to measure (the chart container), so its CSS applies. */
  readonly container?: Element;
}

/**
 * Measures how much space a text takes, in px, so labels can be wrapped
 * and aligned. In the browser, Chartist measures with the page's fonts;
 * `toScene()` estimates (0.6 em per character, 1.2 em per line) unless you
 * pass your own in its size.
 *
 * @example
 * ```ts
 * import type { MeasureText } from 'chartist';
 *
 * // Wider glyphs than the estimate, for a wide font.
 * export const measureText: MeasureText = (text, options = {}) => {
 *   const fontSize = options.fontSize ?? 12;
 *   return { width: text.length * fontSize * 0.7, height: fontSize * 1.25 };
 * };
 * ```
 */
export type MeasureText = (
  text: string,
  options?: MeasureTextOptions
) => TextMetrics;

/** What a {@link MeasureStyle} function gets with the property to read. */
export interface MeasureStyleOptions {
  /** Class names of the element whose style is read. */
  readonly classes?: readonly string[];
  /** Classes of the chart's root svg, so chart-type CSS applies. */
  readonly rootClass?: string;
  /** Where to measure (the chart container), so its CSS applies. */
  readonly container?: Element;
}

/**
 * Reads a computed CSS property of an SVG `path` with the given classes,
 * for values that the stylesheet decides and layout needs: the pie layer
 * reads the `stroke-width` of a donut slice to fit the ring. Returns
 * `undefined` when it can't tell. In the browser, Chartist reads it in
 * the chart's container; `toScene()` has no stylesheet, so layout uses
 * its defaults there.
 *
 * @example
 * ```ts
 * import { domRenderer, type Renderer } from 'chartist';
 *
 * // The DOM renderer, but donuts are laid out for 30px rings, whatever
 * // the stylesheet says. Pass it as `renderer` to `chart()`.
 * export const renderer: Renderer = {
 *   ...domRenderer(),
 *   measureStyle: property => (property === 'stroke-width' ? '30px' : undefined)
 * };
 * ```
 */
export type MeasureStyle = (
  property: string,
  options?: MeasureStyleOptions
) => string | undefined;

export const DEFAULT_FONT_SIZE = 12;

/**
 * Estimates text size without a DOM: an average glyph is 0.6 em wide, and a
 * line is 1.2 em high, at `fontSize` or else 12 px. `toScene()` measures
 * with it unless you pass your own, which can build on it.
 *
 * @example
 * ```ts
 * import { estimateText, type MeasureText } from 'chartist';
 *
 * // Bold labels: a tenth wider than the estimate.
 * export const measureText: MeasureText = (text, options) => {
 *   const size = estimateText(text, options);
 *   return { ...size, width: size.width * 1.1 };
 * };
 * ```
 * @experimental
 */
export const estimateText: MeasureText = (text, options = {}) => {
  const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  return {
    width: text.length * fontSize * 0.6,
    height: fontSize * 1.2,
    fontSize
  };
};
