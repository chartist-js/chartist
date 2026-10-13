export interface TextMetrics {
  readonly width: number;
  readonly height: number;
}

export interface MeasureTextOptions {
  /** Class names of the text, for renderers that apply CSS. */
  readonly classes?: readonly string[];
  /** Font size in px. Defaults to 12, the size of 1.x `.ct-label`. */
  readonly fontSize?: number;
}

export type MeasureText = (
  text: string,
  options?: MeasureTextOptions
) => TextMetrics;

export const DEFAULT_FONT_SIZE = 12;

/**
 * Estimates text size without a DOM: an average glyph is 0.6 em wide, and a
 * line is 1.2 em high.
 */
export const estimateText: MeasureText = (text, options = {}) => {
  const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  return { width: text.length * fontSize * 0.6, height: fontSize * 1.2 };
};
