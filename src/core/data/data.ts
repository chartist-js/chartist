import type {
  Multi,
  AxisName,
  FlatSeriesValue,
  Series,
  SeriesObject
} from '../types';
import { safeHasProperty, getNumberOrUndefined } from '../../utils';

/**
 * Get meta data of a specific value in a series.
 */
export function getMetaData(
  seriesData: FlatSeriesValue | Series | SeriesObject,
  index: number
) {
  const value = Array.isArray(seriesData)
    ? seriesData[index]
    : safeHasProperty(seriesData, 'data')
    ? seriesData.data[index]
    : null;
  return safeHasProperty(value, 'meta') ? value.meta : undefined;
}

/**
 * Checks if a value is considered a hole in the data series.
 * @returns True if the value is considered a data hole
 */
export function isDataHoleValue(value: unknown): value is null | undefined;
export function isDataHoleValue(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'number' && isNaN(value))
  );
}

/**
 * Checks if value is array of series objects.
 */
export function isArrayOfSeries(
  value: unknown
): value is (Series | SeriesObject)[] {
  return (
    Array.isArray(value) &&
    value.every(_ => Array.isArray(_) || safeHasProperty(_, 'data'))
  );
}

/**
 * Checks if provided value object is multi value (contains x or y properties)
 */
export function isMultiValue(value: unknown): value is Multi {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Reflect.has(value, 'x') || Reflect.has(value, 'y'))
  );
}

/**
 * Gets a value from a dimension `value.x` or `value.y` while returning value directly if it's a valid numeric value. If the value is not numeric and it's falsey this function will return `defaultValue`.
 */
export function getMultiValue(
  value: Multi | number | unknown,
  dimension: AxisName = 'y'
) {
  if (isMultiValue(value) && safeHasProperty(value, dimension)) {
    return getNumberOrUndefined(value[dimension]);
  } else {
    return getNumberOrUndefined(value);
  }
}
