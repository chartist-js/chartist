import { paletteOf, colorOf } from './ansi.ts';
import { colorCode, type ColorMode } from './color.ts';

/** Options of {@link legend}. */
export interface LegendOptions {
  /** How text output is colored; HTML output uses classes instead. */
  readonly color?: ColorMode;
  /** Series colors as hex for text output, by series letter (`a` first). */
  readonly palette?: readonly string[];
  /** The width in columns; entries that don't fit go on the next line. */
  readonly columns?: number;
  /** `text` for terminals, or `html` for markup like {@link renderToHtml}'s. */
  readonly format?: 'text' | 'html';
}

const MARKER = '■';
const GAP = '  ';
const escapes: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};
const escape = (text: string) => text.replace(/[&<>]/g, char => escapes[char]);

/**
 * Makes a legend for a chart's data: a colored marker and the name of each
 * named series (series objects with a `name`), in series colors. For pie
 * data, whose series are values, the names are the labels. Series without
 * a name are left out but keep their color. Returns an empty string when
 * nothing has a name.
 *
 * @example
 * ```ts
 * import { legend, lineChart } from '@chartist-js/terminal';
 *
 * const data = {
 *   labels: ['Mon', 'Tue', 'Wed'],
 *   series: [
 *     { name: 'Visitors', data: [12, 9, 7] },
 *     { name: 'Sign-ups', data: [2, 1, 3] }
 *   ]
 * };
 * console.log(lineChart(data, { columns: 60, rows: 12 }));
 * console.log(legend(data, { columns: 60 }));
 * ```
 * @experimental
 */
export function legend(
  data: {
    readonly labels?: readonly unknown[];
    readonly series?: readonly unknown[];
  },
  options: LegendOptions = {}
): string {
  const entries = (data.series ?? [])
    .map((series, index) => ({
      name: nameOf(series, data.labels?.[index]),
      index
    }))
    .filter((entry): entry is { name: string; index: number } =>
      Boolean(entry.name)
    );
  if (!entries.length) {
    return '';
  }
  const html = options.format === 'html';
  const mode = options.color ?? 'truecolor';
  const palette = paletteOf(options.palette);
  const width = options.columns ?? 80;
  const marker = (index: number) => {
    if (html) {
      return `<span class="ct-series-${String.fromCharCode(97 + (index % 26))}">${MARKER}</span>`;
    }
    const color = colorOf(palette, index);
    return mode === 'none' || !color
      ? MARKER
      : `\x1b[${colorCode(color, mode, 38)}m${MARKER}\x1b[0m`;
  };

  const lines: string[][] = [[]];
  let used = 0;
  for (const { name, index } of entries) {
    const size = 2 + [...name].length;
    const line = lines[lines.length - 1];
    if (line.length && used + GAP.length + size > width) {
      lines.push([]);
      used = 0;
    }
    if (lines[lines.length - 1].length) {
      used += GAP.length;
    }
    used += size;
    lines[lines.length - 1].push(
      `${marker(index)} ${html ? escape(name) : name}`
    );
  }
  const text = lines.map(line => line.join(GAP)).join('\n');
  return html ? `<pre class="ct-terminal ct-legend">${text}</pre>` : text;
}

/** A series' name, or for a pie value, its label. */
function nameOf(series: unknown, label: unknown): string | undefined {
  if (Array.isArray(series)) {
    return undefined;
  }
  if (series && typeof series === 'object') {
    const named = series as { name?: unknown; data?: unknown };
    if (named.name !== undefined && named.name !== null && named.name !== '') {
      return String(named.name);
    }
    if (named.data !== undefined) {
      return undefined;
    }
  }
  // A pie value: its label names it.
  return label === undefined || label === null || label === ''
    ? undefined
    : String(label);
}
