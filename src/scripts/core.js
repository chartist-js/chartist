/**
 * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
 *
 * @module Chartist.Core
 */
var Chartist = {
  version: '0.5.0'
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
   * @param {String} str
   * @param {String} subStr
   * @param {String} newSubStr
   * @returns {String}
   */
  Chartist.replaceAll = function(str, subStr, newSubStr) {
    return str.replace(new RegExp(subStr, 'g'), newSubStr);
  };

  /**
   * Converts a string to a number while removing the unit if present. If a number is passed then this will be returned unmodified.
   *
   * @memberof Chartist.Core
   * @param {String|Number} value
   * @returns {Number} Returns the string as number or NaN if the passed length could not be converted to pixel
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
   * @returns {String} Returns the passed number value with unit.
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
   * @returns {Array}
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
   * @returns {*}
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
   * @returns {Array}
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
   * @param {Number|String|Object} data
   * @returns {String}
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
   * @param {String} data
   * @returns {String|Number|Object}
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
   * Convert data series into plain array
   *
   * @memberof Chartist.Core
   * @param {Object} data The series object that contains the data to be visualized in the chart
   * @return {Array} A plain array that contains the data to be visualized in the chart
   */
  Chartist.getDataArray = function (data) {
    var array = [],
      value,
      localData;

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
        value = value.value || value;
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
   * @param {Object} svg The svg element for the chart
   * @param {Number} length Single data value from a series array
   * @param {Object} bounds All the values to set the bounds of the chart
   * @param {Object} options The Object that contains all the optional values for the chart
   * @return {Number} The projected data length in pixels
   */
  Chartist.projectLength = function (svg, length, bounds, options) {
    var availableHeight = Chartist.getAvailableHeight(svg, options);
    return (length / bounds.range * availableHeight);
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
   * @param {Object} svg The svg element for the chart
   * @param {Object} highLow An object containing a high and low property indicating the value range of the chart.
   * @param {Object} options The Object that contains all the optional values for the chart
   * @param {Number} referenceValue The reference value for the chart.
   * @return {Object} All the values to set the bounds of the chart
   */
  Chartist.getBounds = function (svg, highLow, options, referenceValue) {
    var i,
      newMin,
      newMax,
      bounds = {
        high: highLow.high,
        low: highLow.low
      };

    // Overrides of high / low from settings
    bounds.high = +options.high || (options.high === 0 ? 0 : bounds.high);
    bounds.low = +options.low || (options.low === 0 ? 0 : bounds.low);

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
    var length = Chartist.projectLength(svg, bounds.step, bounds, options),
      scaleUp = length < options.axisY.scaleMinSpace;

    while (true) {
      if (scaleUp && Chartist.projectLength(svg, bounds.step, bounds, options) <= options.axisY.scaleMinSpace) {
        bounds.step *= 2;
      } else if (!scaleUp && Chartist.projectLength(svg, bounds.step / 2, bounds, options) >= options.axisY.scaleMinSpace) {
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
    var yOffset = options.axisY ? options.axisY.offset : 0,
      xOffset = options.axisX ? options.axisX.offset : 0;

    return {
      x1: options.chartPadding + yOffset,
      y1: Math.max((Chartist.stripUnit(options.height) || svg.height()) - options.chartPadding - xOffset, options.chartPadding),
      x2: Math.max((Chartist.stripUnit(options.width) || svg.width()) - options.chartPadding, options.chartPadding + yOffset),
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
   * Creates a label with text and based on support of SVG1.1 extensibility will use a foreignObject with a SPAN element or a fallback to a regular SVG text element.
   *
   * @param {Object} parent The SVG element where the label should be created as a child
   * @param {String} text The label text
   * @param {Object} attributes An object with all attributes that should be set on the label element
   * @param {String} className The class names that should be set for this element
   * @param {Boolean} supportsForeignObject If this is true then a foreignObject will be used instead of a text element
   * @returns {Object} The newly created SVG element
   */
  Chartist.createLabel = function(parent, text, attributes, className, supportsForeignObject) {
    if(supportsForeignObject) {
      var content = '<span class="' + className + '">' + text + '</span>';
      return parent.foreignObject(content, attributes);
    } else {
      return parent.elem('text', attributes, className).text(text);
    }
  };

  /**
   * Generate grid lines and labels for the x-axis into grid and labels group SVG elements
   *
   * @memberof Chartist.Core
   * @param {Object} chartRect The rectangle that sets the bounds for the chart in the svg element
   * @param {Object} data The Object that contains the data to be visualized in the chart
   * @param {Object} grid Chartist.Svg wrapper object to be filled with the grid lines of the chart
   * @param {Object} labels Chartist.Svg wrapper object to be filled with the lables of the chart
   * @param {Object} options The Object that contains all the optional values for the chart
   * @param {Object} eventEmitter The passed event emitter will be used to emit draw events for labels and gridlines
   * @param {Boolean} supportsForeignObject If this is true then a foreignObject will be used instead of a text element
   */
  Chartist.createXAxis = function (chartRect, data, grid, labels, options, eventEmitter, supportsForeignObject) {
    // Create X-Axis
    data.labels.forEach(function (value, index) {
      var interpolatedValue = options.axisX.labelInterpolationFnc(value, index),
        width = chartRect.width() / (data.labels.length - (options.fullWidth ? 1 : 0)),
        height = options.axisX.offset,
        pos = chartRect.x1 + width * index;

      // If interpolated value returns falsey (except 0) we don't draw the grid line
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisX.showGrid) {
        var gridElement = grid.elem('line', {
          x1: pos,
          y1: chartRect.y1,
          x2: pos,
          y2: chartRect.y2
        }, [options.classNames.grid, options.classNames.horizontal].join(' '));

        // Event for grid draw
        eventEmitter.emit('draw', {
          type: 'grid',
          axis: 'x',
          index: index,
          group: grid,
          element: gridElement,
          x1: pos,
          y1: chartRect.y1,
          x2: pos,
          y2: chartRect.y2
        });
      }

      if (options.axisX.showLabel) {
        var labelPosition = {
          x: pos + options.axisX.labelOffset.x,
          y: chartRect.y1 + options.axisX.labelOffset.y + (supportsForeignObject ? 5 : 20)
        };

        var labelElement = Chartist.createLabel(labels, '' + interpolatedValue, {
          x: labelPosition.x,
          y: labelPosition.y,
          width: width,
          height: height,
          style: 'overflow: visible;'
        }, [options.classNames.label, options.classNames.horizontal].join(' '), supportsForeignObject);

        eventEmitter.emit('draw', {
          type: 'label',
          axis: 'x',
          index: index,
          group: labels,
          element: labelElement,
          text: '' + interpolatedValue,
          x: labelPosition.x,
          y: labelPosition.y,
          width: width,
          height: height,
          // TODO: Remove in next major release
          get space() {
            window.console.warn('EventEmitter: space is deprecated, use width or height instead.');
            return this.width;
          }
        });
      }
    });
  };

  /**
   * Generate grid lines and labels for the y-axis into grid and labels group SVG elements
   *
   * @memberof Chartist.Core
   * @param {Object} chartRect The rectangle that sets the bounds for the chart in the svg element
   * @param {Object} bounds All the values to set the bounds of the chart
   * @param {Object} grid Chartist.Svg wrapper object to be filled with the grid lines of the chart
   * @param {Object} labels Chartist.Svg wrapper object to be filled with the lables of the chart
   * @param {Object} options The Object that contains all the optional values for the chart
   * @param {Object} eventEmitter The passed event emitter will be used to emit draw events for labels and gridlines
   * @param {Boolean} supportsForeignObject If this is true then a foreignObject will be used instead of a text element
   */
  Chartist.createYAxis = function (chartRect, bounds, grid, labels, options, eventEmitter, supportsForeignObject) {
    // Create Y-Axis
    bounds.values.forEach(function (value, index) {
      var interpolatedValue = options.axisY.labelInterpolationFnc(value, index),
        width = options.axisY.offset,
        height = chartRect.height() / bounds.values.length,
        pos = chartRect.y1 - height * index;

      // If interpolated value returns falsey (except 0) we don't draw the grid line
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisY.showGrid) {
        var gridElement = grid.elem('line', {
          x1: chartRect.x1,
          y1: pos,
          x2: chartRect.x2,
          y2: pos
        }, [options.classNames.grid, options.classNames.vertical].join(' '));

        // Event for grid draw
        eventEmitter.emit('draw', {
          type: 'grid',
          axis: 'y',
          index: index,
          group: grid,
          element: gridElement,
          x1: chartRect.x1,
          y1: pos,
          x2: chartRect.x2,
          y2: pos
        });
      }

      if (options.axisY.showLabel) {
        var labelPosition = {
          x: options.chartPadding + options.axisY.labelOffset.x + (supportsForeignObject ? -10 : 0),
          y: pos + options.axisY.labelOffset.y + (supportsForeignObject ? -15 : 0)
        };

        var labelElement = Chartist.createLabel(labels, '' + interpolatedValue, {
          x: labelPosition.x,
          y: labelPosition.y,
          width: width,
          height: height,
          style: 'overflow: visible;'
        }, [options.classNames.label, options.classNames.vertical].join(' '), supportsForeignObject);

        eventEmitter.emit('draw', {
          type: 'label',
          axis: 'y',
          index: index,
          group: labels,
          element: labelElement,
          text: '' + interpolatedValue,
          x: labelPosition.x,
          y: labelPosition.y,
          width: width,
          height: height,
          // TODO: Remove in next major release
          get space() {
            window.console.warn('EventEmitter: space is deprecated, use width or height instead.');
            return this.height;
          }
        });
      }
    });
  };

  /**
   * Determine the current point on the svg element to draw the data series
   *
   * @memberof Chartist.Core
   * @param {Object} chartRect The rectangle that sets the bounds for the chart in the svg element
   * @param {Object} bounds All the values to set the bounds of the chart
   * @param {Array} data The array that contains the data to be visualized in the chart
   * @param {Number} index The index of the current project point
   * @param {Object} options The chart options that are used to influence the calculations
   * @return {Object} The coordinates object of the current project point containing an x and y number property
   */
  Chartist.projectPoint = function (chartRect, bounds, data, index, options) {
    return {
      x: chartRect.x1 + chartRect.width() / (data.length - (data.length > 1 && options.fullWidth ? 1 : 0)) * index,
      y: chartRect.y1 - chartRect.height() * (data[index] - bounds.min) / (bounds.range + bounds.step)
    };
  };

  // TODO: With multiple media queries the handleMediaChange function is triggered too many times, only need one
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
