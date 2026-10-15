import type {
  Options,
  AxisName,
  NormalizedSeries,
  NormalizedSeriesValue
} from '../types';
import { safeHasProperty } from '../../utils';
import { isDataHoleValue } from './data';
import { nonEmptyRange } from './range';

/**
 * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
 * @param data The array that contains the data to be visualized in the chart
 * @param options The Object that contains the chart options
 * @param dimension Axis dimension 'x' or 'y' used to access the correct value and high / low configuration
 * @param extent A range to include beyond the data, such as the sums of stacked bars
 * @return An object that contains the highest and lowest value that will be visualized on the chart.
 */
export function getHighLow(
  data: NormalizedSeries[],
  options: Options,
  dimension?: AxisName,
  extent?: { readonly low: number; readonly high: number }
) {
  // TODO: Remove workaround for deprecated global high / low config. Axis high / low configuration is preferred
  options = {
    ...options,
    ...(dimension ? (dimension === 'x' ? options.axisX : options.axisY) : {})
  };

  const highLow = {
    high: options.high === undefined ? -Number.MAX_VALUE : +options.high,
    low: options.low === undefined ? Number.MAX_VALUE : +options.low
  };
  const findHigh = options.high === undefined;
  const findLow = options.low === undefined;

  // Function to recursively walk through arrays and find highest and lowest number
  function recursiveHighLow(
    sourceData: NormalizedSeriesValue | NormalizedSeries | NormalizedSeries[]
  ) {
    if (isDataHoleValue(sourceData)) {
      return;
    } else if (Array.isArray(sourceData)) {
      for (let i = 0; i < sourceData.length; i++) {
        recursiveHighLow(sourceData[i]);
      }
    } else {
      const value = Number(
        dimension && safeHasProperty(sourceData, dimension)
          ? sourceData[dimension]
          : sourceData
      );

      if (findHigh && value > highLow.high) {
        highLow.high = value;
      }

      if (findLow && value < highLow.low) {
        highLow.low = value;
      }
    }
  }

  // Start to find highest and lowest number recursively
  if (findHigh || findLow) {
    recursiveHighLow(data);
  }

  // A range the chart needs beyond the values, e.g. the sums of stacked
  // bars, widens what isn't set explicitly.
  if (extent) {
    if (findHigh) {
      highLow.high = Math.max(extent.high, highLow.high);
    }
    if (findLow) {
      highLow.low = Math.min(extent.low, highLow.low);
    }
  }

  // The reference value (e.g. 0 for bars) widens the range to include it,
  // for bipolar scales. An explicit high or low wins over it (#1476).
  if (options.referenceValue || options.referenceValue === 0) {
    if (findHigh) {
      highLow.high = Math.max(options.referenceValue, highLow.high);
    }
    if (findLow) {
      highLow.low = Math.min(options.referenceValue, highLow.low);
    }
  }

  // Flat data (only the same value) or a misconfigured high or low leave
  // the range empty.
  return nonEmptyRange(highLow);
}
