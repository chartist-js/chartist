import {
  barChartConfig,
  extend,
  lineChartConfig,
  pieChartConfig,
  toScene,
  type BarChartData,
  type BarChartPresetOptions,
  type ChartConfig,
  type LineChartData,
  type LineChartPresetOptions,
  type PieChartData,
  type PieChartPresetOptions
} from 'chartist';
import { renderToTerminal } from './ansi.ts';
import type { ColorMode } from './color.ts';
import { CELL_HEIGHT, CELL_WIDTH, terminalSize } from './draw.ts';
import { renderToHtml } from './html.ts';

/** The terminal options of the chart functions, next to the 1.x options. */
export interface TerminalChartOptions {
  /** The width in terminal columns. */
  readonly columns?: number;
  /** The height in terminal rows. */
  readonly rows?: number;
  /** How text output is colored; HTML output uses classes instead. */
  readonly color?: ColorMode;
  /** Series colors as hex for text output, by series letter (`a` first). */
  readonly palette?: readonly string[];
  /** `text` for terminals, or `html` for {@link renderToHtml} markup. */
  readonly format?: 'text' | 'html';
}

/**
 * Options of the terminal {@link lineChart}: the options of Chartist's
 * `lineChart` and the terminal options.
 * @experimental
 */
export type TerminalLineChartOptions = Omit<
  LineChartPresetOptions,
  'width' | 'height'
> &
  TerminalChartOptions;

/**
 * Options of the terminal {@link barChart}: the options of Chartist's
 * `barChart` and the terminal options.
 * @experimental
 */
export type TerminalBarChartOptions = Omit<
  BarChartPresetOptions,
  'width' | 'height'
> &
  TerminalChartOptions;

/**
 * Options of the terminal {@link pieChart}: the options of Chartist's
 * `pieChart` and the terminal options.
 * @experimental
 */
export type TerminalPieChartOptions = Omit<
  PieChartPresetOptions,
  'width' | 'height'
> &
  TerminalChartOptions;

const DEFAULT_COLUMNS = 80;
const DEFAULT_ROWS = 20;

/**
 * Defaults that fit charts to the character grid. Half a cell of label
 * offset puts the X labels in the row below the axis and centers each Y
 * label on its grid line.
 */
const cartesianDefaults = {
  chartPadding: { top: CELL_HEIGHT, right: 2 * CELL_WIDTH, bottom: 0, left: 0 },
  axisX: {
    offset: 1.5 * CELL_HEIGHT,
    labelOffset: { x: 0, y: CELL_HEIGHT / 2 }
  },
  axisY: {
    labelOffset: { x: 0, y: CELL_HEIGHT / 2 },
    // Ticks two rows apart at least.
    scaleMinSpace: 2 * CELL_HEIGHT
  }
};

/**
 * Renders a line chart for the terminal, from the data and options of
 * Chartist's `lineChart`, at `columns` × `rows` cells: lines and areas in
 * braille dots, colored by series.
 *
 * @example
 * ```ts
 * import { lineChart } from '@chartist-js/terminal';
 *
 * console.log(
 *   lineChart(
 *     { labels: ['Mon', 'Tue', 'Wed', 'Thu'], series: [[12, 9, 7, 8], [2, 1, 3.5, 7]] },
 *     { columns: 60, rows: 15, showArea: true, color: '256' }
 *   )
 * );
 * ```
 * @experimental
 */
export function lineChart(
  data: LineChartData,
  options: TerminalLineChartOptions = {}
): string {
  const defaults = extend({}, cartesianDefaults, {
    axisY: { offset: valueLabelWidth(data.series) }
  });
  return render(
    lineChartConfig(data, extend({}, defaults, chartOptions(options))),
    options
  );
}

/**
 * Renders a bar chart for the terminal, from the data and options of
 * Chartist's `barChart` (stacked, horizontal and the others), at
 * `columns` × `rows` cells: bars in block characters, colored by series.
 *
 * @example
 * ```ts
 * import { barChart } from '@chartist-js/terminal';
 *
 * console.log(
 *   barChart(
 *     { labels: ['Q1', 'Q2', 'Q3'], series: [[5, 4, 3], [3, 2, 9]] },
 *     { stackBars: true, columns: 50, rows: 12 }
 *   )
 * );
 * ```
 * @experimental
 */
export function barChart(
  data: BarChartData,
  options: TerminalBarChartOptions = {}
): string {
  // Bars of a group one cell apart: one column, or one row when horizontal.
  const spacing = {
    seriesBarDistance: options.horizontalBars ? CELL_HEIGHT : CELL_WIDTH * 2
  };
  const defaults = options.horizontalBars
    ? extend({}, cartesianDefaults, {
        // Values run across: their ticks at least eight columns apart.
        axisX: { scaleMinSpace: 8 * CELL_WIDTH },
        axisY: {
          offset: (longest(data.labels) + 2) * CELL_WIDTH,
          labelOffset: { x: 0, y: 0 }
        }
      })
    : extend({}, cartesianDefaults, {
        axisY: { offset: valueLabelWidth(data.series) }
      });
  return render(
    barChartConfig(
      data,
      extend({}, extend({}, defaults, spacing), chartOptions(options))
    ),
    options
  );
}

/**
 * Renders a pie or donut chart for the terminal, from the data and
 * options of Chartist's `pieChart`, at `columns` × `rows` cells: slices
 * filled with braille dots, each label on its slice.
 *
 * @example
 * ```ts
 * import { pieChart } from '@chartist-js/terminal';
 *
 * console.log(
 *   pieChart(
 *     { labels: ['Bananas', 'Apples', 'Kiwis'], series: [20, 10, 30] },
 *     { donut: true, columns: 40, rows: 16 }
 *   )
 * );
 * ```
 * @experimental
 */
export function pieChart(
  data: PieChartData,
  options: TerminalPieChartOptions = {}
): string {
  // CSS sizes the ring in a browser; here the option must.
  const defaults = {
    chartPadding: 0,
    donutWidth: options.donut ? '45%' : undefined
  };
  return render(
    pieChartConfig(data, extend({}, defaults, chartOptions(options))),
    options
  );
}

const TERMINAL_OPTIONS: ReadonlySet<string> = new Set([
  'columns',
  'rows',
  'color',
  'palette',
  'format'
]);

/** The options without the terminal ones, for the Chartist presets. */
function chartOptions(options: TerminalChartOptions): object {
  return Object.fromEntries(
    Object.entries(options).filter(([name]) => !TERMINAL_OPTIONS.has(name))
  );
}

function render(config: ChartConfig, options: TerminalChartOptions): string {
  const scene = toScene(
    config,
    terminalSize(
      options.columns ?? DEFAULT_COLUMNS,
      options.rows ?? DEFAULT_ROWS
    )
  );
  return options.format === 'html'
    ? renderToHtml(scene)
    : renderToTerminal(scene, {
        color: options.color,
        palette: options.palette
      });
}

/** The longest label, in characters. */
function longest(labels: readonly unknown[] | undefined): number {
  return Math.max(
    0,
    ...(labels ?? []).map(label => [...String(label ?? '')].length)
  );
}

/**
 * Room for the value labels: the longest value plus two cells, at least
 * six cells (e.g. `12.5` and a gap).
 */
function valueLabelWidth(series: readonly unknown[] | undefined): number {
  const values: unknown[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (value && typeof value === 'object') {
      const entry = value as { data?: unknown; value?: unknown; y?: unknown };
      collect(entry.data ?? entry.value ?? entry.y);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      values.push(value);
    }
  };
  collect(series);
  return Math.max(6, longest(values) + 2) * CELL_WIDTH;
}
