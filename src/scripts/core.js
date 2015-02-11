/**
 * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
 *
 * @module Chartist.Core
 */
var Chartist = {
  version: '0.7.1'
};

(function (window, document, Chartist) {
  'use strict';

  /**
   * Helps to simplify functional style code
   *
   * @memberof Chartist.Core
   * @param {*} n This exact value will be returned by the noop function
   * @return {*} The same value that was provided to the n parameter
   */
  Chartist.noop = function (n) {
    return n;
  };

  /**
   * Generates a-z from a number 0 to 26
   *
   * @memberof Chartist.Core
   * @param {Number} n A number from 0 to 26 that will result in a letter a-z
   * @return {String} A character from a-z based on the input number n
   */
  Chartist.alphaNumerate = function (n) {
    // Limit to a-z
    return String.fromCharCode(97 + n % 26);
  };

  /**
   * Simple recursive object extend
   *
   * @memberof Chartist.Core
   * @param {Object} target Target object where the source will be merged into
   * @param {Object...} sources This object (objects) will be merged into target and then target is returned
   * @return {Object} An object that has the same reference as target but is extended and merged with the properties of source
   */
  Chartist.extend = function (target) {
    target = target || {};

    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function(source) {
      for (var prop in source) {
        if (typeof source[prop] === 'object' && !(source[prop] instanceof Array)) {
          target[prop] = Chartist.extend(target[prop], source[prop]);
        } else {
          target[prop] = source[prop];
        }
      }
    });

    return target;
  };

  /**
   * Replaces all occurrences of subStr in str with newSubStr and returns a new string.
   *
   * @memberof Chartist.Core
   * @param {String} str
   * @param {String} subStr
   * @param {String} newSubStr
   * @return {String}
   */
  Chartist.replaceAll = function(str, subStr, newSubStr) {
    return str.replace(new RegExp(subStr, 'g'), newSubStr);
  };

  /**
   * Converts a string to a number while removing the unit if present. If a number is passed then this will be returned unmodified.
   *
   * @memberof Chartist.Core
   * @param {String|Number} value
   * @return {Number} Returns the string as number or NaN if the passed length could not be converted to pixel
   */
  Chartist.stripUnit = function(value) {
    if(typeof value === 'string') {
      value = value.replace(/[^0-9\+-\.]/g, '');
    }

    return +value;
  };

  /**
   * Converts a number to a string with a unit. If a string is passed then this will be returned unmodified.
   *
   * @memberof Chartist.Core
   * @param {Number} value
   * @param {String} unit
   * @return {String} Returns the passed number value with unit.
   */
  Chartist.ensureUnit = function(value, unit) {
    if(typeof value === 'number') {
      value = value + unit;
    }

    return value;
  };

  /**
   * This is a wrapper around document.querySelector that will return the query if it's already of type Node
   *
   * @memberof Chartist.Core
   * @param {String|Node} query The query to use for selecting a Node or a DOM node that will be returned directly
   * @return {Node}
   */
  Chartist.querySelector = function(query) {
    return query instanceof Node ? query : document.querySelector(query);
  };

  /**
   * Functional style helper to produce array with given length initialized with undefined values
   *
   * @memberof Chartist.Core
   * @param length
   * @return {Array}
   */
  Chartist.times = function(length) {
    return Array.apply(null, new Array(length));
  };

  /**
   * Sum helper to be used in reduce functions
   *
   * @memberof Chartist.Core
   * @param previous
   * @param current
   * @return {*}
   */
  Chartist.sum = function(previous, current) {
    return previous + current;
  };

  /**
   * Map for multi dimensional arrays where their nested arrays will be mapped in serial. The output array will have the length of the largest nested array. The callback function is called with variable arguments where each argument is the nested array value (or undefined if there are no more values).
   *
   * @memberof Chartist.Core
   * @param arr
   * @param cb
   * @return {Array}
   */
  Chartist.serialMap = function(arr, cb) {
    var result = [],
        length = Math.max.apply(null, arr.map(function(e) {
          return e.length;
        }));

    Chartist.times(length).forEach(function(e, index) {
      var args = arr.map(function(e) {
        return e[index];
      });

      result[index] = cb.apply(null, args);
    });

    return result;
  };

  /**
   * A map with characters to escape for strings to be safely used as attribute values.
   *
   * @memberof Chartist.Core
   * @type {Object}
   */
  Chartist.escapingMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;'
  };

  /**
   * This function serializes arbitrary data to a string. In case of data that can't be easily converted to a string, this function will create a wrapper object and serialize the data using JSON.stringify. The outcoming string will always be escaped using Chartist.escapingMap.
   * If called with null or undefined the function will return immediately with null or undefined.
   *
   * @memberof Chartist.Core
   * @param {Number|String|Object} data
   * @return {String}
   */
  Chartist.serialize = function(data) {
    if(data === null || data === undefined) {
      return data;
    } else if(typeof data === 'number') {
      data = ''+data;
    } else if(typeof data === 'object') {
      data = JSON.stringify({data: data});
    }

    return Object.keys(Chartist.escapingMap).reduce(function(result, key) {
      return Chartist.replaceAll(result, key, Chartist.escapingMap[key]);
    }, data);
  };

  /**
   * This function de-serializes a string previously serialized with Chartist.serialize. The string will always be unescaped using Chartist.escapingMap before it's returned. Based on the input value the return type can be Number, String or Object. JSON.parse is used with try / catch to see if the unescaped string can be parsed into an Object and this Object will be returned on success.
   *
   * @memberof Chartist.Core
   * @param {String} data
   * @return {String|Number|Object}
   */
  Chartist.deserialize = function(data) {
    if(typeof data !== 'string') {
      return data;
    }

    data = Object.keys(Chartist.escapingMap).reduce(function(result, key) {
      return Chartist.replaceAll(result, Chartist.escapingMap[key], key);
    }, data);

    try {
      data = JSON.parse(data);
      data = data.data !== undefined ? data.data : data;
    } catch(e) {}

    return data;
  };

  /**
   * Create or reinitialize the SVG element for the chart
   *
   * @memberof Chartist.Core
   * @param {Node} container The containing DOM Node object that will be used to plant the SVG element
   * @param {String} width Set the width of the SVG element. Default is 100%
   * @param {String} height Set the height of the SVG element. Default is 100%
   * @param {String} className Specify a class to be added to the SVG element
   * @return {Object} The created/reinitialized SVG element
   */
  Chartist.createSvg = function (container, width, height, className) {
    var svg;

    width = width || '100%';
    height = height || '100%';

    // Check if there is a previous SVG element in the container that contains the Chartist XML namespace and remove it
    // Since the DOM API does not support namespaces we need to manually search the returned list http://www.w3.org/TR/selectors-api/
    Array.prototype.slice.call(container.querySelectorAll('svg')).filter(function filterChartistSvgObjects(svg) {
      return svg.getAttribute(Chartist.xmlNs.qualifiedName);
    }).forEach(function removePreviousElement(svg) {
      container.removeChild(svg);
    });

    // Create svg object with width and height or use 100% as default
    svg = new Chartist.Svg('svg').attr({
      width: width,
      height: height
    }).addClass(className).attr({
      style: 'width: ' + width + '; height: ' + height + ';'
    });

    // Add the DOM node to our container
    container.appendChild(svg._node);

    return svg;
  };


  /**
   * Reverses the series, labels and series data arrays.
   *
   * @memberof Chartist.Core
   * @param data
   */
  Chartist.reverseData = function(data) {
    data.labels.reverse();
    data.series.reverse();
    for (var i = 0; i < data.series.length; i++) {
      if(typeof(data.series[i]) === 'object' && data.series[i].data !== undefined) {
        data.series[i].data.reverse();
      } else {
        data.series[i].reverse();
      }
    }
  };

  /**
   * Convert data series into plain array
   *
   * @memberof Chartist.Core
   * @param {Object} data The series object that contains the data to be visualized in the chart
   * @param {Boolean} reverse If true the whole data is reversed by the getDataArray call. This will modify the data object passed as first parameter. The labels as well as the series order is reversed. The whole series data arrays are reversed too.
   * @return {Array} A plain array that contains the data to be visualized in the chart
   */
  Chartist.getDataArray = function (data, reverse) {
    var array = [],
      value,
      localData;

    // If the data should be reversed but isn't we need to reverse it
    // If it's reversed but it shouldn't we need to reverse it back
    // That's required to handle data updates correctly and to reflect the responsive configurations
    if(reverse && !data.reversed || !reverse && data.reversed) {
      Chartist.reverseData(data);
      data.reversed = !data.reversed;
    }

    for (var i = 0; i < data.series.length; i++) {
      // If the series array contains an object with a data property we will use the property
      // otherwise the value directly (array or number).
      // We create a copy of the original data array with Array.prototype.push.apply
      localData = typeof(data.series[i]) === 'object' && data.series[i].data !== undefined ? data.series[i].data : data.series[i];
      if(localData instanceof Array) {
        array[i] = [];
        Array.prototype.push.apply(array[i], localData);
      } else {
        array[i] = localData;
      }

      // Convert object values to numbers
      for (var j = 0; j < array[i].length; j++) {
        value = array[i][j];
        value = value.value === 0 ? 0 : (value.value || value);
        array[i][j] = +value;
      }
    }

    return array;
  };

  /**
   * Adds missing values at the end of the array. This array contains the data, that will be visualized in the chart
   *
   * @memberof Chartist.Core
   * @param {Array} dataArray The array that contains the data to be visualized in the chart. The array in this parameter will be modified by function.
   * @param {Number} length The length of the x-axis data array.
   * @return {Array} The array that got updated with missing values.
   */
  Chartist.normalizeDataArray = function (dataArray, length) {
    for (var i = 0; i < dataArray.length; i++) {
      if (dataArray[i].length === length) {
        continue;
      }

      for (var j = dataArray[i].length; j < length; j++) {
        dataArray[i][j] = 0;
      }
    }

    return dataArray;
  };

  Chartist.getMetaData = function(series, index) {
    var value = series.data ? series.data[index] : series[index];
    return value ? Chartist.serialize(value.meta) : undefined;
  };

  /**
   * Calculate the order of magnitude for the chart scale
   *
   * @memberof Chartist.Core
   * @param {Number} value The value Range of the chart
   * @return {Number} The order of magnitude
   */
  Chartist.orderOfMagnitude = function (value) {
    return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  };

  /**
   * Project a data length into screen coordinates (pixels)
   *
   * @memberof Chartist.Core
   * @param {Object} axisLength The svg element for the chart
   * @param {Number} length Single data value from a series array
   * @param {Object} bounds All the values to set the bounds of the chart
   * @return {Number} The projected data length in pixels
   */
  Chartist.projectLength = function (axisLength, length, bounds) {
    return length / bounds.range * axisLength;
  };

  /**
   * Get the height of the area in the chart for the data series
   *
   * @memberof Chartist.Core
   * @param {Object} svg The svg element for the chart
   * @param {Object} options The Object that contains all the optional values for the chart
   * @return {Number} The height of the area in the chart for the data series
   */
  Chartist.getAvailableHeight = function (svg, options) {
    return Math.max((Chartist.stripUnit(options.height) || svg.height()) - (options.chartPadding * 2) - options.axisX.offset, 0);
  };

  /**
   * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
   *
   * @memberof Chartist.Core
   * @param {Array} dataArray The array that contains the data to be visualized in the chart
   * @return {Object} An object that contains the highest and lowest value that will be visualized on the chart.
   */
  Chartist.getHighLow = function (dataArray) {
    var i,
      j,
      highLow = {
        high: -Number.MAX_VALUE,
        low: Number.MAX_VALUE
      };

    for (i = 0; i < dataArray.length; i++) {
      for (j = 0; j < dataArray[i].length; j++) {
        if (dataArray[i][j] > highLow.high) {
          highLow.high = dataArray[i][j];
        }

        if (dataArray[i][j] < highLow.low) {
          highLow.low = dataArray[i][j];
        }
      }
    }

    return highLow;
  };

  /**
   * Calculate and retrieve all the bounds for the chart and return them in one array
   *
   * @memberof Chartist.Core
   * @param {Number} axisLength The length of the Axis used for
   * @param {Object} highLow An object containing a high and low property indicating the value range of the chart.
   * @param {Number} scaleMinSpace The minimum projected length a step should result in
   * @param {Number} referenceValue The reference value for the chart.
   * @return {Object} All the values to set the bounds of the chart
   */
  Chartist.getBounds = function (axisLength, highLow, scaleMinSpace, referenceValue) {
    var i,
      newMin,
      newMax,
      bounds = {
        high: highLow.high,
        low: highLow.low
      };

    // If high and low are the same because of misconfiguration or flat data (only the same value) we need
    // to set the high or low to 0 depending on the polarity
    if(bounds.high === bounds.low) {
      // If both values are 0 we set high to 1
      if(bounds.low === 0) {
        bounds.high = 1;
      } else if(bounds.low < 0) {
        // If we have the same negative value for the bounds we set bounds.high to 0
        bounds.high = 0;
      } else {
        // If we have the same positive value for the bounds we set bounds.low to 0
        bounds.low = 0;
      }
    }

    // Overrides of high / low based on reference value, it will make sure that the invisible reference value is
    // used to generate the chart. This is useful when the chart always needs to contain the position of the
    // invisible reference value in the view i.e. for bipolar scales.
    if (referenceValue || referenceValue === 0) {
      bounds.high = Math.max(referenceValue, bounds.high);
      bounds.low = Math.min(referenceValue, bounds.low);
    }

    bounds.valueRange = bounds.high - bounds.low;
    bounds.oom = Chartist.orderOfMagnitude(bounds.valueRange);
    bounds.min = Math.floor(bounds.low / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
    bounds.max = Math.ceil(bounds.high / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
    bounds.range = bounds.max - bounds.min;
    bounds.step = Math.pow(10, bounds.oom);
    bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

    // Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
    // If we are already below the scaleMinSpace value we will scale up
    var length = Chartist.projectLength(axisLength, bounds.step, bounds),
      scaleUp = length < scaleMinSpace;

    while (true) {
      if (scaleUp && Chartist.projectLength(axisLength, bounds.step, bounds) <= scaleMinSpace) {
        bounds.step *= 2;
      } else if (!scaleUp && Chartist.projectLength(axisLength, bounds.step / 2, bounds) >= scaleMinSpace) {
        bounds.step /= 2;
      } else {
        break;
      }
    }

    // Narrow min and max based on new step
    newMin = bounds.min;
    newMax = bounds.max;
    for (i = bounds.min; i <= bounds.max; i += bounds.step) {
      if (i + bounds.step < bounds.low) {
        newMin += bounds.step;
      }

      if (i - bounds.step >= bounds.high) {
        newMax -= bounds.step;
      }
    }
    bounds.min = newMin;
    bounds.max = newMax;
    bounds.range = bounds.max - bounds.min;

    bounds.values = [];
    for (i = bounds.min; i <= bounds.max; i += bounds.step) {
      bounds.values.push(i);
    }

    return bounds;
  };

  /**
   * Calculate cartesian coordinates of polar coordinates
   *
   * @memberof Chartist.Core
   * @param {Number} centerX X-axis coordinates of center point of circle segment
   * @param {Number} centerY X-axis coordinates of center point of circle segment
   * @param {Number} radius Radius of circle segment
   * @param {Number} angleInDegrees Angle of circle segment in degrees
   * @return {Number} Coordinates of point on circumference
   */
  Chartist.polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  /**
   * Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
   *
   * @memberof Chartist.Core
   * @param {Object} svg The svg element for the chart
   * @param {Object} options The Object that contains all the optional values for the chart
   * @return {Object} The chart rectangles coordinates inside the svg element plus the rectangles measurements
   */
  Chartist.createChartRect = function (svg, options) {
    var yOffset = options.axisY ? options.axisY.offset || 0 : 0,
      xOffset = options.axisX ? options.axisX.offset || 0 : 0,
      w = Chartist.stripUnit(options.width) || svg.width(),
      h = Chartist.stripUnit(options.height) || svg.height();

    return {
      x1: options.chartPadding + yOffset,
      y1: Math.max(h - options.chartPadding - xOffset, options.chartPadding),
      x2: Math.max(w - options.chartPadding, options.chartPadding + yOffset),
      y2: options.chartPadding,
      width: function () {
        return this.x2 - this.x1;
      },
      height: function () {
        return this.y1 - this.y2;
      }
    };
  };

  /**
   * Creates a grid line based on a projected value.
   *
   * @memberof Chartist.Core
   * @param projectedValue
   * @param index
   * @param axis
   * @param offset
   * @param length
   * @param group
   * @param classes
   * @param eventEmitter
   */
  Chartist.createGrid = function(projectedValue, index, axis, offset, length, group, classes, eventEmitter) {
    var positionalData = {};
    positionalData[axis.units.pos + '1'] = projectedValue.pos;
    positionalData[axis.units.pos + '2'] = projectedValue.pos;
    positionalData[axis.counterUnits.pos + '1'] = offset;
    positionalData[axis.counterUnits.pos + '2'] = offset + length;

    var gridElement = group.elem('line', positionalData, classes.join(' '));

    // Event for grid draw
    eventEmitter.emit('draw',
      Chartist.extend({
        type: 'grid',
        axis: axis.units.pos,
        index: index,
        group: group,
        element: gridElement
      }, positionalData)
    );
  };

  /**
   * Creates a label based on a projected value and an axis.
   *
   * @memberof Chartist.Core
   * @param projectedValue
   * @param index
   * @param labels
   * @param axis
   * @param axisOffset
   * @param labelOffset
   * @param group
   * @param classes
   * @param useForeignObject
   * @param eventEmitter
   */
  Chartist.createLabel = function(projectedValue, index, labels, axis, axisOffset, labelOffset, group, classes, useForeignObject, eventEmitter) {
    var labelElement,
      positionalData = {};
    positionalData[axis.units.pos] = projectedValue.pos + labelOffset[axis.units.pos];
    positionalData[axis.counterUnits.pos] = labelOffset[axis.counterUnits.pos];
    positionalData[axis.units.len] = projectedValue.len;
    positionalData[axis.counterUnits.len] = axisOffset;

    if(useForeignObject) {
      var content = '<span class="' + classes.join(' ') + '">' + labels[index] + '</span>';
      labelElement = group.foreignObject(content, Chartist.extend({
        style: 'overflow: visible;'
      }, positionalData));
    } else {
      labelElement = group.elem('text', positionalData, classes.join(' ')).text(labels[index]);
    }

    eventEmitter.emit('draw', Chartist.extend({
      type: 'label',
      axis: axis,
      index: index,
      group: group,
      element: labelElement,
      text: labels[index]
    }, positionalData));
  };

  /**
   * This function creates a whole axis with its grid lines and labels based on an axis model and a chartRect.
   *
   * @memberof Chartist.Core
   * @param axis
   * @param data
   * @param chartRect
   * @param gridGroup
   * @param labelGroup
   * @param useForeignObject
   * @param options
   * @param eventEmitter
   */
  Chartist.createAxis = function(axis, data, chartRect, gridGroup, labelGroup, useForeignObject, options, eventEmitter) {
    var axisOptions = options['axis' + axis.units.pos.toUpperCase()],
      projectedValues = data.map(axis.projectValue.bind(axis)).map(axis.transform),
      labelValues = data.map(axisOptions.labelInterpolationFnc);

    projectedValues.forEach(function(projectedValue, index) {
      // Skip grid lines and labels where interpolated label values are falsey (execpt for 0)
      if(!labelValues[index] && labelValues[index] !== 0) {
        return;
      }

      if(axisOptions.showGrid) {
        Chartist.createGrid(projectedValue, index, axis, axis.gridOffset, chartRect[axis.counterUnits.len](), gridGroup, [
          options.classNames.grid,
          options.classNames[axis.units.dir]
        ], eventEmitter);
      }

      if(axisOptions.showLabel) {
        Chartist.createLabel(projectedValue, index, labelValues, axis, axisOptions.offset, axis.labelOffset, labelGroup, [
          options.classNames.label,
          options.classNames[axis.units.dir]
        ], useForeignObject, eventEmitter);
      }
    });
  };

  /**
   * Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
   *
   * @memberof Chartist.Core
   * @param {Object} options Options set by user
   * @param {Array} responsiveOptions Optional functions to add responsive behavior to chart
   * @param {Object} eventEmitter The event emitter that will be used to emit the options changed events
   * @return {Object} The consolidated options object from the defaults, base and matching responsive options
   */
  Chartist.optionsProvider = function (options, responsiveOptions, eventEmitter) {
    var baseOptions = Chartist.extend({}, options),
      currentOptions,
      mediaQueryListeners = [],
      i;

    function updateCurrentOptions() {
      var previousOptions = currentOptions;
      currentOptions = Chartist.extend({}, baseOptions);

      if (responsiveOptions) {
        for (i = 0; i < responsiveOptions.length; i++) {
          var mql = window.matchMedia(responsiveOptions[i][0]);
          if (mql.matches) {
            currentOptions = Chartist.extend(currentOptions, responsiveOptions[i][1]);
          }
        }
      }

      if(eventEmitter) {
        eventEmitter.emit('optionsChanged', {
          previousOptions: previousOptions,
          currentOptions: currentOptions
        });
      }
    }

    function removeMediaQueryListeners() {
      mediaQueryListeners.forEach(function(mql) {
        mql.removeListener(updateCurrentOptions);
      });
    }

    if (!window.matchMedia) {
      throw 'window.matchMedia not found! Make sure you\'re using a polyfill.';
    } else if (responsiveOptions) {

      for (i = 0; i < responsiveOptions.length; i++) {
        var mql = window.matchMedia(responsiveOptions[i][0]);
        mql.addListener(updateCurrentOptions);
        mediaQueryListeners.push(mql);
      }
    }
    // Execute initially so we get the correct options
    updateCurrentOptions();

    return {
      get currentOptions() {
        return Chartist.extend({}, currentOptions);
      },
      removeMediaQueryListeners: removeMediaQueryListeners
    };
  };

  //http://schepers.cc/getting-to-the-point
  Chartist.catmullRom2bezier = function (crp, z) {
    var d = [];
    for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
      var p = [
        {x: +crp[i - 2], y: +crp[i - 1]},
        {x: +crp[i], y: +crp[i + 1]},
        {x: +crp[i + 2], y: +crp[i + 3]},
        {x: +crp[i + 4], y: +crp[i + 5]}
      ];
      if (z) {
        if (!i) {
          p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
        } else if (iLen - 4 === i) {
          p[3] = {x: +crp[0], y: +crp[1]};
        } else if (iLen - 2 === i) {
          p[2] = {x: +crp[0], y: +crp[1]};
          p[3] = {x: +crp[2], y: +crp[3]};
        }
      } else {
        if (iLen - 4 === i) {
          p[3] = p[2];
        } else if (!i) {
          p[0] = {x: +crp[i], y: +crp[i + 1]};
        }
      }
      d.push(
        [
          (-p[0].x + 6 * p[1].x + p[2].x) / 6,
          (-p[0].y + 6 * p[1].y + p[2].y) / 6,
          (p[1].x + 6 * p[2].x - p[3].x) / 6,
          (p[1].y + 6 * p[2].y - p[3].y) / 6,
          p[2].x,
          p[2].y
        ]
      );
    }

    return d;
  };

}(window, document, Chartist));
