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
