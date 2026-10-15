/** A value of a series: a number, or a hole. */
export type Value = number | null;

/** A series: its values, with a name when the input names it. */
export type Series =
  | Value[]
  | { readonly name: string; readonly data: Value[] };

/** Chart data as read from arguments, a file or stdin. */
export interface InputData {
  readonly labels?: string[];
  readonly series: Series[];
}

/** A problem with the input, explained to the user. */
export class InputError extends Error {}

const isNumber = (cell: string) =>
  cell.trim() !== '' && Number.isFinite(Number(cell));

/** Reads a cell: a number, a hole when empty, or an error. */
function valueOf(cell: string): Value {
  const text = cell.trim();
  if (text === '' || text === 'null') {
    return null;
  }
  if (!isNumber(text)) {
    throw new InputError(`"${text}" is not a number.`);
  }
  return Number(text);
}

/** A series argument: comma-separated numbers; empty values are holes. */
export function parseSeriesArg(arg: string): Value[] {
  return arg.split(',').map(valueOf);
}

/**
 * Reads chart data from text: JSON (`{ labels, series }`, or an array of
 * values or of series), or rows of values separated by commas, semicolons,
 * tabs or spaces, one series per row. A first row that isn't numeric is
 * the labels; a first column that isn't numeric, the series names.
 */
export function parseData(text: string): InputData {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new InputError('No data: the input is empty.');
  }
  return trimmed.startsWith('{') || trimmed.startsWith('[')
    ? parseJson(trimmed)
    : parseRows(trimmed);
}

function parseJson(text: string): InputData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new InputError(
      `The input isn't valid JSON: ${(error as Error).message}`
    );
  }
  if (Array.isArray(json)) {
    return {
      series: json.every(entry => Array.isArray(entry)) ? json : [json]
    };
  }
  const data = json as { labels?: unknown; series?: unknown };
  if (!Array.isArray(data.series)) {
    throw new InputError(
      'JSON input needs a "series" array, e.g. {"series": [[1, 2, 3]]}.'
    );
  }
  return {
    labels: Array.isArray(data.labels) ? data.labels.map(String) : undefined,
    series: data.series as Series[]
  };
}

function parseRows(text: string): InputData {
  const rows = text
    .split(/\r?\n/)
    .filter(row => row.trim())
    .map(row =>
      /[,;\t]/.test(row)
        ? row.split(/[,;\t]/).map(cell => cell.trim())
        : row.trim().split(/\s+/)
    );
  const named = (row: string[]) => row[0] !== '' && !isNumber(row[0]);
  // The names column: the first cell of every row below the first is a
  // name. Whether the first row is labels decides whether it counts too.
  let names = rows.length > 1 ? rows.slice(1).every(named) : named(rows[0]);
  const header =
    rows.length > 1 &&
    rows[0].slice(names ? 1 : 0).some(cell => cell !== '' && !isNumber(cell));
  if (!header && rows.length > 1) {
    names = names && named(rows[0]);
  }
  const body = header ? rows.slice(1) : rows;
  const series = body.map(row => {
    const data = (names ? row.slice(1) : row).map(valueOf);
    return names ? { name: row[0], data } : data;
  });
  return {
    labels: header ? rows[0].slice(names ? 1 : 0) : undefined,
    series
  };
}
