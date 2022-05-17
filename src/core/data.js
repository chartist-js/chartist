import { escapingMap } from './globals';
import { replaceAll, safeHasProperty, getNumberOrUndefined } from './lang';
import { times } from './functional';
import { extend } from './extend';
import {
  orderOfMagnitude,
  projectLength,
  roundWithPrecision,
  rho,
  EPSILON
} from './math';

/**
 * This function serializes arbitrary data to a string. In case of data that can't be easily converted to a string, this function will create a wrapper object and serialize the data using JSON.stringify. The outcoming string will always be escaped using Chartist.escapingMap.
 * If called with null or undefined the function will return immediately with null or undefined.
 *
 * @memberof Chartist.Core
 * @param {Number|String|Object} data
 * @return {String}
 */
export function serialize(data) {
  if (data === null || data === undefined) {
    return data;
  } else if (typeof data === 'number') {
    data = '' + data;
  } else if (typeof data === 'object') {
    data = JSON.stringify({ data: data });
  }

  return Object.keys(escapingMap).reduce(
    (result, key) => replaceAll(result, key, escapingMap[key]),
    data
  );
}

/**
 * This function de-serializes a string previously serialized with Chartist.serialize. The string will always be unescaped using Chartist.escapingMap before it's returned. Based on the input value the return type can be Number, String or Object. JSON.parse is used with try / catch to see if the unescaped string can be parsed into an Object and this Object will be returned on success.
 *
 * @memberof Chartist.Core
 * @param {String} data
 * @return {String|Number|Object}
 */
export function deserialize(data) {
  if (typeof data !== 'string') {
    return data;
  }

  if (data === 'NaN') {
    return NaN;
  }

  data = Object.keys(escapingMap).reduce(
    (result, key) => replaceAll(result, escapingMap[key], key),
    data
  );

  try {
    data = JSON.parse(data);
    data = data.data !== undefined ? data.data : data;
  } catch (e) {
    /* Ingore */
  }

  return data;
}

/**
 * Ensures that the data object passed as second argument to the charts is present and correctly initialized.
 *
 * @param  {Object} data The data object that is passed as second argument to the charts
 * @return {Object} The normalized data object
 */
export function normalizeData(data, reverse, multi) {
  let labelCount;
  const output = {
    raw: data,
    normalized: {}
  };

  // Check if we should generate some labels based on existing series data
  output.normalized.series = getDataArray(
    {
      series: data.series || []
    },
    reverse,
    multi
  );

  // If all elements of the normalized data array are arrays we're dealing with
  // multi series data and we need to find the largest series if they are un-even
  if (output.normalized.series.every(value => value instanceof Array)) {
    // Getting the series with the the most elements
    labelCount = Math.max(
      ...output.normalized.series.map(series => series.length)
    );
  } else {
    // We're dealing with Pie data so we just take the normalized array length
    labelCount = output.normalized.series.length;
  }

  output.normalized.labels = (data.labels || []).slice();
  // Padding the labels to labelCount with empty strings
  output.normalized.labels.push(
    ...times(Math.max(0, labelCount - output.normalized.labels.length)).map(
      () => ''
    )
  );

  if (reverse) {
    reverseData(output.normalized);
  }

  return output;
}

/**
 * Get meta data of a specific value in a series.
 *
 * @param series
 * @param index
 * @returns {*}
 */
export function getMetaData(series, index) {
  const value = series.data ? series.data[index] : series[index];
  return value ? value.meta : undefined;
}

/**
 * Checks if a value is considered a hole in the data series.
 *
 * @param {*} value
 * @returns {boolean} True if the value is considered a data hole
 */
export function isDataHoleValue(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'number' && isNaN(value))
  );
}

/**
 * Reverses the series, labels and series data arrays.
 *
 * @memberof Chartist.Core
 * @param data
 */
export function reverseData(data) {
  data.labels.reverse();
  data.series.reverse();
  for (let series of data.series) {
    if (typeof series === 'object' && series.data !== undefined) {
      series.data.reverse();
    } else if (series instanceof Array) {
      series.reverse();
    }
  }
}

/**
 * Convert data series into plain array
 *
 * @memberof Chartist.Core
 * @param {Object} data The series object that contains the data to be visualized in the chart
 * @param {Boolean} [reverse] If true the whole data is reversed by the getDataArray call. This will modify the data object passed as first parameter. The labels as well as the series order is reversed. The whole series data arrays are reversed too.
 * @param {Boolean} [multi] Create a multi dimensional array from a series data array where a value object with `x` and `y` values will be created.
 * @return {Array} A plain array that contains the data to be visualized in the chart
 */
export function getDataArray(data, reverse, multi) {
  // Recursively walks through nested arrays and convert string values to numbers and objects with value properties
  // to values. Check the tests in data core -> data normalization for a detailed specification of expected values
  function recursiveConvert(value) {
    if (safeHasProperty(value, 'value')) {
      // We are dealing with value object notation so we need to recurse on value property
      return recursiveConvert(value.value);
    } else if (safeHasProperty(value, 'data')) {
      // We are dealing with series object notation so we need to recurse on data property
      return recursiveConvert(value.data);
    } else if (value instanceof Array) {
      // Data is of type array so we need to recurse on the series
      return value.map(recursiveConvert);
    } else if (isDataHoleValue(value)) {
      // We're dealing with a hole in the data and therefore need to return undefined
      // We're also returning undefined for multi value output
      return undefined;
    } else {
      // We need to prepare multi value output (x and y data)
      if (multi) {
        const multiValue = {};

        // Single series value arrays are assumed to specify the Y-Axis value
        // For example: [1, 2] => [{x: undefined, y: 1}, {x: undefined, y: 2}]
        // If multi is a string then it's assumed that it specified which dimension should be filled as default
        if (typeof multi === 'string') {
          multiValue[multi] = getNumberOrUndefined(value);
        } else {
          multiValue.y = getNumberOrUndefined(value);
        }

        multiValue.x = safeHasProperty(value, 'x')
          ? getNumberOrUndefined(value.x)
          : multiValue.x;
        multiValue.y = safeHasProperty(value, 'y')
          ? getNumberOrUndefined(value.y)
          : multiValue.y;

        return multiValue;
      } else {
        // We can return simple data
        return getNumberOrUndefined(value);
      }
    }
  }

  return data.series.map(recursiveConvert);
}

/**
 * Checks if provided value object is multi value (contains x or y properties)
 *
 * @memberof Chartist.Core
 * @param value
 */
export function isMultiValue(value) {
  return (
    typeof value === 'object' &&
    (Reflect.has(value, 'x') || Reflect.has(value, 'y'))
  );
}

/**
 * Gets a value from a dimension `value.x` or `value.y` while returning value directly if it's a valid numeric value. If the value is not numeric and it's falsey this function will return `defaultValue`.
 *
 * @memberof Chartist.Core
 * @param value
 * @param dimension
 * @returns {*}
 */
export function getMultiValue(value, dimension = 'y') {
  if (isMultiValue(value)) {
    return getNumberOrUndefined(value[dimension]);
  } else {
    return getNumberOrUndefined(value);
  }
}

/**
 * Helper to read series specific options from options object. It automatically falls back to the global option if
 * there is no option in the series options.
 *
 * @param {Object} series Series object
 * @param {Object} options Chartist options object
 * @param {string} key The options key that should be used to obtain the options
 * @returns {*}
 */
export function getSeriesOption(series, options, key) {
  if (series.name && options.series && options.series[series.name]) {
    const seriesOptions = options.series[series.name];
    return Reflect.has(seriesOptions, key) ? seriesOptions[key] : options[key];
  } else {
    return options[key];
  }
}

/**
 * Splits a list of coordinates and associated values into segments. Each returned segment contains a pathCoordinates
 * valueData property describing the segment.
 *
 * With the default options, segments consist of contiguous sets of points that do not have an undefined value. Any
 * points with undefined values are discarded.
 *
 * **Options**
 * The following options are used to determine how segments are formed
 * ```javascript
 * var options = {
 *   // If fillHoles is true, undefined values are simply discarded without creating a new segment. Assuming other options are default, this returns single segment.
 *   fillHoles: false,
 *   // If increasingX is true, the coordinates in all segments have strictly increasing x-values.
 *   increasingX: false
 * };
 * ```
 *
 * @memberof Chartist.Core
 * @param {Array} pathCoordinates List of point coordinates to be split in the form [x1, y1, x2, y2 ... xn, yn]
 * @param {Array} valueData List of associated point values in the form [v1, v2 .. vn]
 * @param {Object} [options] Options set by user
 * @return {Array} List of segments, each containing a pathCoordinates and valueData property.
 */
export function splitIntoSegments(pathCoordinates, valueData, options) {
  const defaultOptions = {
    increasingX: false,
    fillHoles: false
  };

  options = extend({}, defaultOptions, options);

  const segments = [];
  let hole = true;

  for (let i = 0; i < pathCoordinates.length; i += 2) {
    // If this value is a "hole" we set the hole flag
    if (getMultiValue(valueData[i / 2].value) === undefined) {
      // if(valueData[i / 2].value === undefined) {
      if (!options.fillHoles) {
        hole = true;
      }
    } else {
      if (
        options.increasingX &&
        i >= 2 &&
        pathCoordinates[i] <= pathCoordinates[i - 2]
      ) {
        // X is not increasing, so we need to make sure we start a new segment
        hole = true;
      }

      // If it's a valid value we need to check if we're coming out of a hole and create a new empty segment
      if (hole) {
        segments.push({
          pathCoordinates: [],
          valueData: []
        });
        // As we have a valid value now, we are not in a "hole" anymore
        hole = false;
      }

      // Add to the segment pathCoordinates and valueData
      segments[segments.length - 1].pathCoordinates.push(
        pathCoordinates[i],
        pathCoordinates[i + 1]
      );
      segments[segments.length - 1].valueData.push(valueData[i / 2]);
    }
  }

  return segments;
}

/**
 * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
 *
 * @memberof Chartist.Core
 * @param {Array} data The array that contains the data to be visualized in the chart
 * @param {Object} options The Object that contains the chart options
 * @param {String} dimension Axis dimension 'x' or 'y' used to access the correct value and high / low configuration
 * @return {Object} An object that contains the highest and lowest value that will be visualized on the chart.
 */
export function getHighLow(data, options, dimension) {
  // TODO: Remove workaround for deprecated global high / low config. Axis high / low configuration is preferred
  options = extend(
    {},
    options,
    dimension ? options['axis' + dimension.toUpperCase()] : {}
  );

  const highLow = {
    high: options.high === undefined ? -Number.MAX_VALUE : +options.high,
    low: options.low === undefined ? Number.MAX_VALUE : +options.low
  };
  const findHigh = options.high === undefined;
  const findLow = options.low === undefined;

  // Function to recursively walk through arrays and find highest and lowest number
  function recursiveHighLow(sourceData) {
    if (sourceData === undefined) {
      return undefined;
    } else if (sourceData instanceof Array) {
      for (let i = 0; i < sourceData.length; i++) {
        recursiveHighLow(sourceData[i]);
      }
    } else {
      const value = dimension ? +sourceData[dimension] : +sourceData;

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

/**
 * Calculate and retrieve all the bounds for the chart and return them in one array
 *
 * @memberof Chartist.Core
 * @param {Number} axisLength The length of the Axis used for
 * @param {Object} highLow An object containing a high and low property indicating the value range of the chart.
 * @param {Number} scaleMinSpace The minimum projected length a step should result in
 * @param {Boolean} onlyInteger
 * @return {Object} All the values to set the bounds of the chart
 */
export function getBounds(axisLength, highLow, scaleMinSpace, onlyInteger) {
  const bounds = {
    high: highLow.high,
    low: highLow.low
  };

  bounds.valueRange = bounds.high - bounds.low;
  bounds.oom = orderOfMagnitude(bounds.valueRange);
  bounds.step = Math.pow(10, bounds.oom);
  bounds.min = Math.floor(bounds.low / bounds.step) * bounds.step;
  bounds.max = Math.ceil(bounds.high / bounds.step) * bounds.step;
  bounds.range = bounds.max - bounds.min;
  bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

  // Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
  // If we are already below the scaleMinSpace value we will scale up
  const length = projectLength(axisLength, bounds.step, bounds);
  const scaleUp = length < scaleMinSpace;
  const smallestFactor = onlyInteger ? rho(bounds.range) : 0;

  // First check if we should only use integer steps and if step 1 is still larger than scaleMinSpace so we can use 1
  if (onlyInteger && projectLength(axisLength, 1, bounds) >= scaleMinSpace) {
    bounds.step = 1;
  } else if (
    onlyInteger &&
    smallestFactor < bounds.step &&
    projectLength(axisLength, smallestFactor, bounds) >= scaleMinSpace
  ) {
    // If step 1 was too small, we can try the smallest factor of range
    // If the smallest factor is smaller than the current bounds.step and the projected length of smallest factor
    // is larger than the scaleMinSpace we should go for it.
    bounds.step = smallestFactor;
  } else {
    // Trying to divide or multiply by 2 and find the best step value
    let optimizationCounter = 0;
    for (;;) {
      if (
        scaleUp &&
        projectLength(axisLength, bounds.step, bounds) <= scaleMinSpace
      ) {
        bounds.step *= 2;
      } else if (
        !scaleUp &&
        projectLength(axisLength, bounds.step / 2, bounds) >= scaleMinSpace
      ) {
        bounds.step /= 2;
        if (onlyInteger && bounds.step % 1 !== 0) {
          bounds.step *= 2;
          break;
        }
      } else {
        break;
      }

      if (optimizationCounter++ > 1000) {
        throw new Error(
          'Exceeded maximum number of iterations while optimizing scale step!'
        );
      }
    }
  }

  bounds.step = Math.max(bounds.step, EPSILON);
  function safeIncrement(value, increment) {
    // If increment is too small use *= (1+EPSILON) as a simple nextafter
    if (value === (value += increment)) {
      value *= 1 + (increment > 0 ? EPSILON : -EPSILON);
    }
    return value;
  }

  // Narrow min and max based on new step
  let newMin = bounds.min;
  let newMax = bounds.max;
  while (newMin + bounds.step <= bounds.low) {
    newMin = safeIncrement(newMin, bounds.step);
  }
  while (newMax - bounds.step >= bounds.high) {
    newMax = safeIncrement(newMax, -bounds.step);
  }
  bounds.min = newMin;
  bounds.max = newMax;
  bounds.range = bounds.max - bounds.min;

  const values = [];
  for (let i = bounds.min; i <= bounds.max; i = safeIncrement(i, bounds.step)) {
    const value = roundWithPrecision(i);
    if (value !== values[values.length - 1]) {
      values.push(value);
    }
  }
  bounds.values = values;

  return bounds;
}
