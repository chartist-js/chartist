import { paletteOf, colorOf } from './ansi.ts';
import { colorCode, type ColorMode } from './color.ts';
import { documentOf } from './html.ts';

/** Options of {@link legend}. */
export interface LegendOptions {
  /** How text output is colored; HTML output uses classes instead. */
  readonly color?: ColorMode;
  /** Series colors as hex for text output, by series letter (`a` first). */
  readonly palette?: readonly string[];
  /** The width in columns; entries that don't fit go on the next line. */
  readonly columns?: number;
  /**
   * `text` for terminals, `html` for markup like {@link renderToHtml}'s, or
   * `element` for the same markup as a `pre` element, which a page adds
   * without `innerHTML`.
   */
  readonly format?: 'text' | 'html' | 'element';
  /**
   * The document `element` output is created in; the global `document` by
   * default.
   */
  readonly document?: Document;
}

/** Options that ask for the legend as a `pre` element. */
interface AsElement {
  readonly format: 'element';
}
/** Options that ask for the legend as a string, text or HTML. */
interface AsString {
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
 * a name are left out but keep their color. Returns an empty string, or an
 * empty `pre` element, when nothing has a name.
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
 */
export function legend(
  data: LegendData,
  options: LegendOptions & AsElement
): HTMLPreElement;
export function legend(
  data: LegendData,
  options?: LegendOptions & AsString
): string;
export function legend(
  data: LegendData,
  options?: LegendOptions
): string | HTMLPreElement;
export function legend(
  data: LegendData,
  options: LegendOptions = {}
): string | HTMLPreElement {
  const entries = (data.series ?? [])
    .map((series, index) => ({
      name: nameOf(series, data.labels?.[index]),
      index
    }))
    .filter((entry): entry is Entry => Boolean(entry.name));
  const lines = layout(entries, options.columns ?? 80);
  if (options.format === 'element') {
    return legendElement(lines, options);
  }
  if (!entries.length) {
    return '';
  }
  if (options.format === 'html') {
    const text = lines
      .map(line =>
        line
          .map(
            ({ name, index }) =>
              `<span class="ct-series-${letter(index)}">${MARKER}</span> ${escape(name)}`
          )
          .join(GAP)
      )
      .join('\n');
    return `<pre class="ct-terminal ct-legend">${text}</pre>`;
  }
  const mode = options.color ?? 'truecolor';
  const palette = paletteOf(options.palette);
  const marker = (index: number) => {
    const color = colorOf(palette, index);
    return mode === 'none' || !color
      ? MARKER
      : `\x1b[${colorCode(color, mode, 38)}m${MARKER}\x1b[0m`;
  };
  return lines
    .map(line =>
      line.map(({ name, index }) => `${marker(index)} ${name}`).join(GAP)
    )
    .join('\n');
}

/** The data {@link legend} reads: series, and labels for pie values. */
interface LegendData {
  readonly labels?: readonly unknown[];
  readonly series?: readonly unknown[];
}

/** A named series and its index, which picks its color. */
interface Entry {
  readonly name: string;
  readonly index: number;
}

/** The series letter of a series index, as in `ct-series-a`. */
const letter = (index: number) => String.fromCharCode(97 + (index % 26));

/** Puts the entries on lines of at most `width` columns. */
function layout(entries: readonly Entry[], width: number): Entry[][] {
  const lines: Entry[][] = [[]];
  let used = 0;
  for (const entry of entries) {
    const size = 2 + [...entry.name].length;
    const line = lines[lines.length - 1];
    if (line.length && used + GAP.length + size > width) {
      lines.push([]);
      used = 0;
    }
    if (lines[lines.length - 1].length) {
      used += GAP.length;
    }
    used += size;
    lines[lines.length - 1].push(entry);
  }
  return lines;
}

/** The HTML legend's markup as a `pre` element, built with DOM methods. */
function legendElement(
  lines: readonly (readonly Entry[])[],
  options: LegendOptions
): HTMLPreElement {
  const document = documentOf(options);
  const pre = document.createElement('pre');
  pre.className = 'ct-terminal ct-legend';
  if (!lines.some(line => line.length)) {
    return pre;
  }
  lines.forEach((line, lineIndex) => {
    if (lineIndex) {
      pre.append('\n');
    }
    line.forEach(({ name, index }, entryIndex) => {
      if (entryIndex) {
        pre.append(GAP);
      }
      const marker = document.createElement('span');
      marker.className = `ct-series-${letter(index)}`;
      marker.textContent = MARKER;
      pre.append(marker, ` ${name}`);
    });
  });
  return pre;
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
