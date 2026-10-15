import { seriesColors } from 'chartist';
import { contrast, parseHex } from './color.ts';

/**
 * The stylesheet for {@link renderToHtml} output, as CSS text: series
 * colors from Chartist's `--ct-series-a` to `--ct-series-o` custom
 * properties (falling back to the default colors), the grid and labels
 * from `--ct-grid-color` and `--ct-label-color`, and a monospace font in
 * which the braille dots line up. `@chartist-js/terminal/styles.css` is
 * this text.
 * @experimental
 */
export function terminalStyles(): string {
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
    '/* @chartist-js/terminal: styles for renderToHtml() output. */',
    '.ct-terminal {',
    "  font-family: 'DejaVu Sans Mono', Menlo, Consolas, 'Liberation Mono', monospace;",
    '  line-height: 1;',
    '  white-space: pre;',
    '  overflow-x: auto;',
    '}',
    // Chartist's styles size `.ct-label`; the cells must keep one size.
    '.ct-terminal span { font: inherit; }',
    '.ct-terminal .ct-grid { color: var(--ct-grid-color, rgba(0, 0, 0, 0.2)); }',
    '.ct-terminal .ct-label { color: var(--ct-label-color, rgba(0, 0, 0, 0.4)); }',
    '.ct-terminal .ct-area { opacity: 0.5; }',
    ...series,
    ''
  ].join('\n');
}
