import type { SceneNode } from 'chartist';
import type { Cell } from './canvas.ts';
import { drawScene } from './draw.ts';

const escapes: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};
const escape = (text: string) => text.replace(/[&<>]/g, char => escapes[char]);

/**
 * Text for a run of cells: each character in an `i` element, which the
 * stylesheet makes one cell (0.6 × 1 em). The grid then holds whatever
 * fonts draw the characters: the stylesheet's own for braille, blocks and
 * grid lines, a monospace font for the rest.
 */
const cellText = (text: string) =>
  [...text].map(char => `<i>${escape(char)}</i>`).join('');

/** The series letter of a series index, as in `ct-series-a`. */
const letter = (series: number) => String.fromCharCode(97 + (series % 26));

/** The classes of a cell, e.g. `ct-bar ct-series-b ct-bg-series-a`. */
function classesOf(cell: Cell): string {
  const { kind, series, background } = cell.ink;
  return [
    `ct-${kind}`,
    series === undefined ? '' : `ct-series-${letter(series)}`,
    background === undefined ? '' : `ct-bg-series-${letter(background)}`
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Renders a scene as HTML text art: the terminal output in a `pre`
 * element (class `ct-terminal`), each run of cells in a span with classes
 * instead of colors: `ct-series-a` to `ct-series-z`, `ct-bg-series-a` for
 * the series behind a cell, and the kind (`ct-grid`, `ct-label`,
 * `ct-area`, `ct-bar`, `ct-line`, `ct-point`, `ct-slice`). Load
 * `@chartist-js/terminal/styles.css` to color it; it reads Chartist's
 * `--ct-series-a` and other custom properties, so themes apply, and
 * draws braille, blocks and grid lines with a font of its own that fills
 * each cell. Each character is an `i` element: one cell. Lay the scene
 * out with {@link terminalSize}.
 *
 * @example
 * ```ts
 * import { pieChartConfig, toScene } from 'chartist';
 * import { renderToHtml, terminalSize } from '@chartist-js/terminal';
 * import '@chartist-js/terminal/styles.css';
 *
 * const scene = toScene(
 *   pieChartConfig({ labels: ['A', 'B'], series: [3, 2] }),
 *   terminalSize(30, 12)
 * );
 * document.querySelector('#chart')!.innerHTML = renderToHtml(scene);
 * ```
 * @experimental
 */
export function renderToHtml(scene: SceneNode): string {
  const lines = drawScene(scene)
    .cells()
    .map(row => {
      let last = row.length - 1;
      while (last >= 0 && !row[last]) {
        last--;
      }
      let line = '';
      let open = '';
      let run = '';
      const flush = () => {
        line += open
          ? `<span class="${open}">${cellText(run)}</span>`
          : cellText(run);
        run = '';
      };
      for (const cell of row.slice(0, last + 1)) {
        const classes = cell ? classesOf(cell) : '';
        if (classes !== open) {
          flush();
          open = classes;
        }
        run += cell?.char ?? ' ';
      }
      flush();
      return line;
    });
  while (lines.length && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return `<pre class="ct-terminal">${lines.join('\n')}</pre>`;
}
