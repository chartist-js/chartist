import type {
  Data,
  NormalizedData,
  Multi,
  AxisName,
  NormalizedMulti,
  Series,
  FlatSeries,
  NormalizedSeries,
  NormalizedFlatSeries,
  SeriesObject,
  SeriesPrimitiveValue
} from '../types';
import {
  isArrayOfArrays,
  times,
  safeHasProperty,
  getNumberOrUndefined
} from '../../utils';
import { isDataHoleValue, isArrayOfSeries } from './data';

/**
 * Ensures that the data object passed as second argument to the charts is present and correctly initialized.
 * @param data The data object that is passed as second argument to the charts
 * @return The normalized data object
 */
export function normalizeData(
  data: Data<FlatSeries>,
  reverse?: boolean,
  multi?: false
): NormalizedData<NormalizedFlatSeries>;
export function normalizeData(
  data: Data<(Series | SeriesObject)[]>,
  reverse: boolean | undefined,
  multi: true | AxisName
): NormalizedData<NormalizedSeries[]>;
export function normalizeData(
  data: Data<FlatSeries | (Series | SeriesObject)[]>,
  reverse: boolean | undefined,
  multi: boolean | AxisName,
  distributed: true
): NormalizedData<NormalizedSeries[]>;
export function normalizeData(
  data: Data<FlatSeries | (Series | SeriesObject)[]>,
  reverse?: boolean,
  multi?: boolean | AxisName
): NormalizedData<NormalizedFlatSeries | NormalizedSeries[]>;
export function normalizeData(
  data: Data,
  reverse = false,
  multi?: boolean | AxisName,
  distributed?: boolean
) {
  let labelCount: number;
  const normalized: NormalizedData = {
    labels: [],
    series: normalizeSeries(data.series, multi, distributed)
  };

  // If all elements of the normalized data array are arrays we're dealing with
  // multi series data and we need to find the largest series if they are un-even
  if (isArrayOfArrays(normalized.series)) {
    // Getting the series with the the most elements
    labelCount = Math.max(...normalized.series.map(series => series.length));
  } else {
    // We're dealing with Pie data so we just take the normalized array length
    labelCount = normalized.series.length;
  }

  normalized.labels = (data.labels || []).slice();
  // Padding the labels to labelCount with empty strings
  normalized.labels.push(
    ...times(Math.max(0, labelCount - normalized.labels.length)).map(() => '')
  );

  if (reverse) {
    reverseData(normalized);
  }

  return normalized;
}

/**
 * Reverses the series, labels and series data arrays.
 */
function reverseData(data: Data) {
  data.labels?.reverse();
  data.series.reverse();
  for (const series of data.series) {
    if (safeHasProperty(series, 'data')) {
      series.data.reverse();
    } else if (Array.isArray(series)) {
      series.reverse();
    }
  }
}

function normalizeMulti(
  value: number | string | boolean | Date | Multi,
  multi?: boolean | AxisName
) {
  // We need to prepare multi value output (x and y data)
  let x: number | undefined;
  let y: number | undefined;

  // Single series value arrays are assumed to specify the Y-Axis value
  // For example: [1, 2] => [{x: undefined, y: 1}, {x: undefined, y: 2}]
  // If multi is a string then it's assumed that it specified which dimension should be filled as default
  if (typeof value !== 'object') {
    const num = getNumberOrUndefined(value);

    if (multi === 'x') {
      x = num;
    } else {
      y = num;
    }
  } else {
    if (safeHasProperty(value, 'x')) {
      x = getNumberOrUndefined(value.x);
    }

    if (safeHasProperty(value, 'y')) {
      y = getNumberOrUndefined(value.y);
    }
  }

  if (x === undefined && y === undefined) {
    return undefined;
  }

  return { x, y } as NormalizedMulti;
}

function normalizePrimitive(
  value: SeriesPrimitiveValue,
  multi?: boolean | AxisName
) {
  if (isDataHoleValue(value)) {
    // We're dealing with a hole in the data and therefore need to return undefined
    // We're also returning undefined for multi value output
    return undefined;
  }

  if (multi) {
    return normalizeMulti(value, multi);
  }

  return getNumberOrUndefined(value);
}

function normalizeSingleSeries(
  series: Series | SeriesObject,
  multi?: boolean | AxisName
): NormalizedSeries {
  if (!Array.isArray(series)) {
    // We are dealing with series object notation so we need to recurse on data property
    return normalizeSingleSeries(series.data, multi);
  }

  return series.map(value => {
    if (safeHasProperty(value, 'value')) {
      // We are dealing with value object notation so we need to recurse on value property
      return normalizePrimitive(value.value, multi);
    }

    return normalizePrimitive(value, multi);
  });
}

/**
 * Convert data series into plain array
 * @param series The series object that contains the data to be visualized in the chart
 * @param multi Create a multi dimensional array from a series data array where a value object with `x` and `y` values will be created.
 * @return A plain array that contains the data to be visualized in the chart
 */
function normalizeSeries(
  series: FlatSeries,
  multi?: false,
  distributed?: false
): NormalizedFlatSeries;
function normalizeSeries(
  series: (Series | SeriesObject)[],
  multi: true | AxisName,
  distributed?: false
): NormalizedSeries[];
function normalizeSeries(
  series: FlatSeries | (Series | SeriesObject)[],
  multi: boolean | undefined | AxisName,
  distributed: true
): NormalizedSeries[];
function normalizeSeries(
  series: FlatSeries | (Series | SeriesObject)[],
  multi?: boolean | undefined | AxisName,
  distributed?: boolean
): NormalizedFlatSeries | NormalizedSeries[];
function normalizeSeries(
  series: FlatSeries | (Series | SeriesObject)[],
  multi?: boolean | undefined | AxisName,
  distributed?: boolean
) {
  if (isArrayOfSeries(series)) {
    return series.map(_ => normalizeSingleSeries(_, multi));
  }

  const normalizedSeries = normalizeSingleSeries(series, multi);

  if (distributed) {
    return normalizedSeries.map(value => [value]);
  }

  return normalizedSeries;
}
