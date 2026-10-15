#!/usr/bin/env node
/**
 * ct-cli: draws Chartist line, bar and pie charts in the terminal.
 *
 *   ct-cli line 12,9,7,8,5 2,1,3.5,7,3 --labels Mon,Tue,Wed,Thu,Fri
 *   echo '{"series":[5,3,4]}' | ct-cli pie --donut
 *   ct-cli demo
 */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import pkg from '../../package.json' with { type: 'json' };
import {
  barChart,
  lineChart,
  pieChart,
  type TerminalChartOptions
} from '../charts.ts';
import { detectColorMode, parseHex, type ColorMode } from '../color.ts';
import { legend } from '../legend.ts';
import { terminalStyles } from '../styles.ts';
import {
  InputError,
  parseData,
  parseSeriesArg,
  type InputData
} from './data.ts';

const USAGE = `Usage: ct-cli <line|bar|pie|demo> [series…] [options]

Draws a Chartist chart in the terminal. Each series is a comma-separated
list of numbers, e.g. 1,2,3 (an empty value is a hole). Without series,
the data comes from --data or stdin: JSON ({"labels": [...], "series":
[...]}, or an array) or one series per row, separated by commas, tabs,
semicolons or spaces, with optional labels in the first row and names in
the first column.

Data:
  -d, --data <file>       Read the data from a file
  -l, --labels <a,b,c>    Labels of the values (or of the slices)
  -n, --names <a,b>       Series names, shown in a legend

Size and range:
  -w, --width <columns>   Width in columns (default: the terminal's)
  -h, --height <rows>     Height in rows (default: 20)
      --low <n>           Lowest value on the value axis
      --high <n>          Highest value on the value axis

Chart:
      --smooth            Line: smooth the lines
      --area              Line: fill the area below the lines
      --no-points         Line: hide the points
      --stack             Bar: stack the series
      --horizontal        Bar: horizontal bars
      --donut             Pie: draw a donut
      --no-labels         Pie: hide the slice labels

Output:
      --palette <#hex,…>  Series colors, first series first
      --no-legend         Leave out the legend of named series
      --color <mode>      auto, truecolor, 256, 16 or none (default: auto)
      --html              Print HTML instead of text
      --standalone        With --html: a complete page with styles
      --help              Show this help
      --version           Show the version
`;

type ChartType = 'line' | 'bar' | 'pie';

/** A usage problem: explained, then the usage, exit code 1. */
class UsageError extends Error {}

// Piped into `head`, say: stop quietly once the reader is gone.
process.stdout.on('error', error => {
  if ((error as NodeJS.ErrnoException).code === 'EPIPE') {
    process.exit(0);
  }
  throw error;
});

function run(argv: string[]) {
  const { values: flags, positionals } = parse(argv);
  if (flags.help) {
    process.stdout.write(USAGE);
    return;
  }
  if (flags.version) {
    process.stdout.write(`${pkg.version}\n`);
    return;
  }
  const [type, ...seriesArgs] = positionals;
  if (!type) {
    throw new UsageError(
      'Which chart? Give a chart type: line, bar, pie or demo.'
    );
  }
  const output: Output = {
    columns:
      positiveInteger(flags.width, '--width') ?? process.stdout.columns ?? 80,
    rows: positiveInteger(flags.height, '--height') ?? 20,
    color: colorMode(flags.color),
    palette: flags.palette?.split(',').map(color => color.trim()),
    html: Boolean(flags.html || flags.standalone),
    legend: flags.legend
  };
  output.palette?.forEach(color => {
    try {
      parseHex(color);
    } catch {
      throw new UsageError(
        `--palette: "${color}" is not a hex color like #d70206.`
      );
    }
  });

  let body: string;
  if (type === 'demo') {
    body = demo(output);
  } else if (type === 'line' || type === 'bar' || type === 'pie') {
    if (seriesArgs.length && flags.data) {
      throw new UsageError(
        'Give the series as arguments or with --data, not both.'
      );
    }
    const data = withFlags(
      input(seriesArgs, flags.data),
      flags.labels,
      flags.names
    );
    body = chart(type, data, chartOptions(type, flags), output);
  } else {
    throw new UsageError(
      `Unknown chart type "${type}". Use line, bar, pie or demo.`
    );
  }
  process.stdout.write(
    flags.standalone ? page(body) : body.endsWith('\n') ? body : `${body}\n`
  );
}

function parse(argv: string[]) {
  try {
    return parseArgs({
      // `--no-labels` hides slice labels; `--labels` sets labels.
      args: argv.map(arg => (arg === '--no-labels' ? '--hide-labels' : arg)),
      allowPositionals: true,
      allowNegative: true,
      strict: true,
      options: {
        data: { type: 'string', short: 'd' },
        labels: { type: 'string', short: 'l' },
        names: { type: 'string', short: 'n' },
        width: { type: 'string', short: 'w' },
        height: { type: 'string', short: 'h' },
        low: { type: 'string' },
        high: { type: 'string' },
        smooth: { type: 'boolean' },
        area: { type: 'boolean' },
        points: { type: 'boolean', default: true },
        stack: { type: 'boolean' },
        horizontal: { type: 'boolean' },
        donut: { type: 'boolean' },
        'hide-labels': { type: 'boolean' },
        palette: { type: 'string' },
        legend: { type: 'boolean', default: true },
        color: { type: 'string', default: 'auto' },
        html: { type: 'boolean' },
        standalone: { type: 'boolean' },
        help: { type: 'boolean' },
        version: { type: 'boolean' }
      }
    });
  } catch (error) {
    throw new UsageError((error as Error).message);
  }
}

type Flags = ReturnType<typeof parse>['values'];

interface Output extends TerminalChartOptions {
  readonly columns: number;
  readonly rows: number;
  readonly html: boolean;
  readonly legend: boolean;
}

function input(seriesArgs: string[], file: string | undefined): InputData {
  if (seriesArgs.length) {
    return { series: seriesArgs.map(parseSeriesArg) };
  }
  if (file) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch (error) {
      throw new InputError(`Can't read ${file}: ${(error as Error).message}`);
    }
    return parseData(text);
  }
  if (process.stdin.isTTY) {
    throw new InputError(
      'No data: give series as arguments, a file with --data, or pipe it in.'
    );
  }
  return parseData(readFileSync(0, 'utf8'));
}

/** Applies --labels and --names to the data. */
function withFlags(
  data: InputData,
  labels?: string,
  names?: string
): InputData {
  const nameList = list(names);
  return {
    labels: list(labels) ?? data.labels,
    series: nameList
      ? data.series.map((series, index) =>
          nameList[index]
            ? {
                name: nameList[index],
                data: Array.isArray(series) ? series : series.data
              }
            : series
        )
      : data.series
  };
}

const list = (value?: string) => value?.split(',').map(item => item.trim());

function number(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isFinite(Number(value)) || value.trim() === '') {
    throw new UsageError(`${flag}: "${value}" is not a number.`);
  }
  return Number(value);
}

function positiveInteger(
  value: string | undefined,
  flag: string
): number | undefined {
  const result = number(value, flag);
  if (result !== undefined && !(Number.isInteger(result) && result > 0)) {
    throw new UsageError(`${flag}: "${value}" is not a positive whole number.`);
  }
  return result;
}

function colorMode(value: string | undefined): ColorMode {
  if (value === undefined || value === 'auto') {
    return detectColorMode(process.stdout, process.env);
  }
  if (
    value === 'truecolor' ||
    value === '256' ||
    value === '16' ||
    value === 'none'
  ) {
    return value;
  }
  throw new UsageError(
    `--color: "${value}" isn't a color mode. Use auto, truecolor, 256, 16 or none.`
  );
}

function chartOptions(type: ChartType, flags: Flags): object {
  const range = {
    low: number(flags.low, '--low'),
    high: number(flags.high, '--high')
  };
  if (type === 'line') {
    return {
      ...range,
      lineSmooth: Boolean(flags.smooth),
      showArea: Boolean(flags.area),
      showPoint: flags.points
    };
  }
  if (type === 'bar') {
    return {
      ...range,
      stackBars: Boolean(flags.stack),
      horizontalBars: Boolean(flags.horizontal)
    };
  }
  return { donut: Boolean(flags.donut), showLabel: !flags['hide-labels'] };
}

/** A pie takes one value per slice: one series of several values is that. */
function asPie(data: InputData): InputData {
  if (data.series.length !== 1) {
    return data;
  }
  const [only] = data.series;
  return {
    ...data,
    series: (Array.isArray(only) ? only : only.data) as unknown as Series[]
  };
}

type Series = InputData['series'][number];

function chart(
  type: ChartType,
  data: InputData,
  options: object,
  output: Output
): string {
  const format = output.html ? 'html' : 'text';
  const terminal = { ...output, format } as const;
  const chartData = type === 'pie' ? asPie(data) : data;
  const drawn =
    type === 'line'
      ? lineChart(chartData as never, { ...options, ...terminal })
      : type === 'bar'
        ? barChart(chartData as never, { ...options, ...terminal })
        : pieChart(chartData as never, { ...options, ...terminal });
  // Pie slices carry their labels; line and bar series get a legend.
  const key =
    output.legend && type !== 'pie'
      ? legend(chartData, { ...terminal, columns: output.columns })
      : '';
  return key ? `${drawn}\n\n${key}` : drawn;
}

function demo(output: Output): string {
  const title = (text: string) =>
    output.html ? `<h2>${text}</h2>` : `  ${text}\n`;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return [
    title('Line chart, smoothed, with areas'),
    chart(
      'line',
      {
        labels: days,
        series: [
          { name: 'Visitors', data: [12, 9, 7, 8, 5, 4, 6] },
          { name: 'Sign-ups', data: [2, 1, 3.5, 7, 3, 6, 9] }
        ]
      },
      { lineSmooth: true, showArea: true },
      output
    ),
    title('Bar chart'),
    chart(
      'bar',
      {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
          { name: '2025', data: [5, 4, 3, 7] },
          { name: '2026', data: [3, 2, 9, 5] },
          { name: '2027', data: [1, 5, 8, 4] }
        ]
      },
      {},
      output
    ),
    title('Donut chart'),
    chart(
      'pie',
      { labels: ['Bananas', 'Apples', 'Kiwis'], series: [20, 10, 30] as never },
      { donut: true },
      output
    )
  ].join('\n');
}

/** A complete HTML page around the chart, with the stylesheet. */
function page(body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chartist chart</title>
<style>
body { margin: 2rem 1rem; background: #fff; color: #222; font-family: system-ui, sans-serif; }
@media (prefers-color-scheme: dark) {
  body { background: #16161a; color: #e8e8ea; --ct-grid-color: rgba(255, 255, 255, 0.25); --ct-label-color: rgba(255, 255, 255, 0.6); }
}
${terminalStyles()}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

// Last, so every helper above is initialized.
try {
  run(process.argv.slice(2));
} catch (error) {
  if (error instanceof UsageError || error instanceof InputError) {
    process.stderr.write(`ct-cli: ${error.message}\n\n${USAGE}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
