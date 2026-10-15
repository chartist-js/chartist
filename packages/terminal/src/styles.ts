import { seriesColors } from 'chartist';
import { contrast, parseHex } from './color.ts';

/** The monospace fonts text in the cells uses, labels included. */
const MONOSPACE =
  "'JetBrains Mono', 'Cascadia Mono', 'DejaVu Sans Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/**
 * The rules of the stylesheet for {@link renderToHtml} output, as CSS
 * text; `dist/styles.css` adds the "Chartist Terminal" font they use.
 *
 * Every character sits in a cell 0.6 em wide and 1 em high, so the grid
 * doesn't depend on any font's widths. The graphic characters (braille,
 * blocks, the grid) come from "Chartist Terminal", whose glyphs fill a
 * cell edge to edge; letters and digits from a monospace font. Series
 * colors come from Chartist's `--ct-series-a` to `--ct-series-o` custom
 * properties (the default colors otherwise), the grid and labels from
 * `--ct-grid-color` and `--ct-label-color`.
 */
export function stylesheetRules(): string {
  const series = seriesColors.flatMap((color, index) => {
    const name = String.fromCharCode(97 + index);
    const [r, g, b] = contrast(parseHex(color));
    const on = `rgb(${r}, ${g}, ${b})`;
    return [
      `.ct-terminal .ct-series-${name} { color: var(--ct-series-${name}, ${color}); }`,
      `.ct-terminal .ct-bg-series-${name} { background-color: var(--ct-series-${name}, ${color}); }`,
      `.ct-terminal .ct-label.ct-bg-series-${name} { color: var(--ct-terminal-on-series-${name}, ${on}); }`
    ];
  });
  return [
    '.ct-terminal {',
    `  font-family: ${MONOSPACE};`,
    '  line-height: 1;',
    '  font-variant-ligatures: none;',
    '  white-space: pre;',
    '  overflow-x: auto;',
    '}',
    // Chartist's styles size `.ct-label`; the cells must keep one size.
    '.ct-terminal span { font: inherit; }',
    // One cell per character. "Chartist Terminal" comes first, so its
    // metrics (0.8 em above the baseline, 0.2 em below) set the cell's
    // line: the glyphs fill it exactly.
    '.ct-terminal i {',
    '  display: inline-block;',
    '  width: 0.6em;',
    '  height: 1em;',
    '  overflow: visible;',
    '  vertical-align: top;',
    '  text-align: center;',
    '  font: inherit;',
    `  font-family: 'Chartist Terminal', ${MONOSPACE};`,
    '  font-style: normal;',
    '}',
    '.ct-terminal .ct-grid { color: var(--ct-grid-color, rgba(0, 0, 0, 0.2)); }',
    '.ct-terminal .ct-label { color: var(--ct-label-color, rgba(0, 0, 0, 0.4)); }',
    '.ct-terminal .ct-area { opacity: 0.5; }',
    ...series,
    ''
  ].join('\n');
}
