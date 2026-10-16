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
 */
export function renderToHtml(scene: SceneNode): string {
  const lines = rowsOf(scene).map(runs =>
    runs
      .map(({ classes, text }) =>
        classes
          ? `<span class="${classes}">${cellText(text)}</span>`
          : cellText(text)
      )
      .join('')
  );
  return `<pre class="ct-terminal">${lines.join('\n')}</pre>`;
}

/**
 * Options of {@link renderToElement}.
 */
export interface ElementOptions {
  /**
   * The document to create the element in; the global `document` by
   * default.
   */
  readonly document?: Document;
}

/**
 * Renders a scene as HTML text art like {@link renderToHtml}, but as a
 * `pre` element built with DOM methods instead of a string. The markup is
 * the same; a page appends the element and needs no `innerHTML`, so it
 * works with a Content Security Policy that requires Trusted Types. Throws
 * where there is no document, as in Node.js.
 *
 * @example
 * ```ts
 * import { pieChartConfig, toScene } from 'chartist';
 * import { renderToElement, terminalSize } from '@chartist-js/terminal';
 * import '@chartist-js/terminal/styles.css';
 *
 * const scene = toScene(
 *   pieChartConfig({ labels: ['A', 'B'], series: [3, 2] }),
 *   terminalSize(30, 12)
 * );
 * document.querySelector('#chart')!.replaceChildren(renderToElement(scene));
 * ```
 */
export function renderToElement(
  scene: SceneNode,
  options: ElementOptions = {}
): HTMLPreElement {
  const document = documentOf(options);
  const pre = document.createElement('pre');
  pre.className = 'ct-terminal';
  rowsOf(scene).forEach((runs, index) => {
    if (index) {
      pre.append('\n');
    }
    for (const { classes, text } of runs) {
      const parent = classes ? document.createElement('span') : pre;
      if (classes) {
        parent.className = classes;
        pre.append(parent);
      }
      for (const char of text) {
        const cell = document.createElement('i');
        cell.textContent = char;
        parent.append(cell);
      }
    }
  });
  return pre;
}

/** The given document, else the global one; throws without either. */
export function documentOf(options: ElementOptions): Document {
  const document = options.document ?? globalThis.document;
  if (!document) {
    throw new Error(
      "Chartist terminal: format 'element' needs a document. Pass one with the document option, or use format 'html'."
    );
  }
  return document;
}

/** Cells next to each other with the same classes (none for plain text). */
export interface Run {
  readonly classes: string;
  readonly text: string;
}

/**
 * The drawn scene as rows of runs, without trailing empty cells and rows:
 * what the HTML and the element output write, each in its own way.
 */
export function rowsOf(scene: SceneNode): Run[][] {
  const rows = drawScene(scene)
    .cells()
    .map(row => {
      let last = row.length - 1;
      while (last >= 0 && !row[last]) {
        last--;
      }
      const runs: Run[] = [];
      for (const cell of row.slice(0, last + 1)) {
        const classes = cell ? classesOf(cell) : '';
        const char = cell?.char ?? ' ';
        const previous = runs[runs.length - 1];
        if (previous?.classes === classes) {
          runs[runs.length - 1] = { classes, text: previous.text + char };
        } else {
          runs.push({ classes, text: char });
        }
      }
      return runs;
    });
  while (rows.length && !rows[rows.length - 1].length) {
    rows.pop();
  }
  return rows;
}
