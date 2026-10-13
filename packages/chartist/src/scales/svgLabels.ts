/**
 * SVG text labels: the label text wrapped into `tspan` lines and aligned
 * inside the label box the way the 1.x CSS aligns HTML labels (flexbox
 * rules per chart type), since CSS can't align SVG text in a box.
 */
import type { MeasureText } from '../render/measure';
import { node, withFields, type SceneNode } from '../scene/node';
import type { AxisDimension } from './axis';

/** @experimental */
export interface LabelAlign {
  readonly horizontal: 'start' | 'middle' | 'end';
  readonly vertical: 'top' | 'middle' | 'bottom';
}

/** Which row of the 1.x label CSS applies. */
export type LabelChartKind = 'line' | 'bar' | 'horizontalBar';

export interface LabelBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Builds the SVG node of one label, or nothing for empty text. */
export type SvgLabelBuilder = (
  text: string,
  box: LabelBox,
  classes: string,
  dimension: AxisDimension,
  atStart: boolean
) => SceneNode | undefined;

/**
 * The alignment the default CSS gives HTML labels (`ct-align-justify`):
 * line and composed charts, bar charts and horizontal bar charts.
 */
export function labelAlign(
  kind: LabelChartKind,
  dimension: AxisDimension,
  atStart: boolean
): LabelAlign {
  const vertical = atStart ? 'bottom' : 'top';
  if (dimension === 'x') {
    return {
      vertical,
      horizontal: kind === 'bar' ? 'middle' : 'start'
    };
  }
  return {
    vertical: kind === 'horizontalBar' ? 'middle' : 'bottom',
    horizontal: atStart ? 'end' : 'start'
  };
}

/**
 * Greedy word wrap: words are added to a line while it fits `width`. A
 * word wider than `width` stays on a line of its own.
 */
export function wrapText(
  text: string,
  width: number,
  widthOf: (line: string) => number
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && widthOf(candidate) > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

/** First baseline below the top of a line, in em (typical font ascent). */
const ASCENT = 0.85;

/**
 * Creates the SVG label builder for a chart: text measured with the
 * label's classes, lines one font size apart (the 1.x label CSS sets
 * `line-height: 1`), absolute `x`/`y` on every line.
 */
export function svgLabels(
  measureText: MeasureText,
  kind: LabelChartKind,
  override: Partial<LabelAlign> = {}
): SvgLabelBuilder {
  return (text, box, classes, dimension, atStart) => {
    const classList = classes.split(' ');
    const measure = (value: string) =>
      measureText(value, { classes: classList });
    // HTML labels get the width rounded to px (1.x span style); same here.
    const lines = wrapText(
      text,
      Math.round(box.width),
      line => measure(line).width
    );
    if (!lines.length) {
      return undefined;
    }
    const metrics = measure(lines[0]);
    const fontSize = metrics.fontSize ?? metrics.height / 1.2;
    const align = { ...labelAlign(kind, dimension, atStart), ...override };
    const blockHeight = lines.length * fontSize;
    const top =
      align.vertical === 'top'
        ? box.y
        : align.vertical === 'middle'
          ? box.y + (box.height - blockHeight) / 2
          : box.y + box.height - blockHeight;
    const x =
      align.horizontal === 'start'
        ? box.x
        : align.horizontal === 'middle'
          ? box.x + box.width / 2
          : box.x + box.width;
    const round = (value: number) => Math.round(value * 100) / 100;
    return withFields(
      node(
        'text',
        {
          x: round(x),
          y: round(top + ASCENT * fontSize),
          'text-anchor': align.horizontal
        },
        classes
      ),
      {
        children: lines.map((line, index) =>
          node('tspan', {
            x: round(x),
            y: round(top + (index + ASCENT) * fontSize)
          }).text(line)
        )
      }
    );
  };
}
