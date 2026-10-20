import { node, textAscent, type Layer } from 'chartist';

declare module 'chartist' {
  interface NodeRoles {
    source: {
      ctx: { readonly text: string };
      attrs: { readonly x: number; readonly y: number };
    };
  }
}

/** A note on where the data comes from, below the chart, right-aligned. */
export function source(text: string, gap = 8): Layer {
  const classes = ['ct-source'];
  return {
    type: 'source',
    coordinates: ['cartesian'],
    // Draws no series, so it doesn't shape any axis.
    series: [],
    // Room for one line below the X axis labels, measured with the page's font.
    inset: ({ measureText }) => ({
      bottom: measureText(text, { classes }).height + gap
    }),
    compose({ insetArea, measureText }) {
      const box = insetArea?.bottom;
      if (!box) {
        return [];
      }
      const { fontSize = 12 } = measureText(text, { classes });
      // The line starts `gap` px below the labels; the baseline sits
      // `textAscent` of a line lower.
      const x = box.x2;
      const y = box.y2 + gap + textAscent * fontSize;
      return [
        node('text', { x, y, 'text-anchor': 'end' }, 'ct-source', {
          role: 'source',
          ctx: { text }
        }).text(text)
      ];
    }
  };
}
