import type {
  Options,
  AxisName,
  NormalizedSeries,
  NormalizedSeriesValue
} from '../types';
import { safeHasProperty } from '../../utils';
import { isDataHoleValue } from './data';

/**
 * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
 * @param data The array that contains the data to be visualized in the chart
 * @param options The Object that contains the chart options
 * @param dimension Axis dimension 'x' or 'y' used to access the correct value and high / low configuration
 * @return An object that contains the highest and lowest value that will be visualized on the chart.
 */
export function getHighLow(
  data: NormalizedSeries[],
  options: Options,
  dimension?: AxisName
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

  // Overrides of high / low based on reference value, it will make sure that the invisible reference value is
  // used to generate the chart. This is useful when the chart always needs to contain the position of the
  // invisible reference value in the view i.e. for bipolar scales.
  if (options.referenceValue || options.referenceValue === 0) {
    highLow.high = Math.max(options.referenceValue, highLow.high);
    highLow.low = Math.min(options.referenceValue, highLow.low);
  }

  // If high and low are the same because of misconfiguration or flat data (only the same value) we need
  // to set the high or low to 0 depending on the polarity
  if (highLow.high <= highLow.low) {
    // If both values are 0 we set high to 1
    if (highLow.low === 0) {
      highLow.high = 1;
    } else if (highLow.low < 0) {
      // If we have the same negative value for the bounds we set bounds.high to 0
      highLow.high = 0;
    } else if (highLow.high > 0) {
      // If we have the same positive value for the bounds we set bounds.low to 0
      highLow.low = 0;
    } else {
      // If data array was empty, values are Number.MAX_VALUE and -Number.MAX_VALUE. Set bounds to prevent errors
      highLow.high = 1;
      highLow.low = 0;
    }
  }

  return highLow;
}
