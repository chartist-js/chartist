(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Chartist'] = factory();
  }
}(this, function () {

  /* Chartist.js 0.6.1
   * Copyright © 2015 Gion Kunz
   * Free to use under the WTFPL license.
   * http://www.wtfpl.net/
   */
  /**
   * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
   *
   * @module Chartist.Core
   */
  var Chartist = {
    version: '0.6.1'
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
     * @memberof Chartist.Core
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
  ;/**
   * A very basic event module that helps to generate and catch events.
   *
   * @module Chartist.Event
   */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    Chartist.EventEmitter = function () {
      var handlers = [];

      /**
       * Add an event handler for a specific event
       *
       * @memberof Chartist.Event
       * @param {String} event The event name
       * @param {Function} handler A event handler function
       */
      function addEventHandler(event, handler) {
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);
      }

      /**
       * Remove an event handler of a specific event name or remove all event handlers for a specific event.
       *
       * @memberof Chartist.Event
       * @param {String} event The event name where a specific or all handlers should be removed
       * @param {Function} [handler] An optional event handler function. If specified only this specific handler will be removed and otherwise all handlers are removed.
       */
      function removeEventHandler(event, handler) {
        // Only do something if there are event handlers with this name existing
        if(handlers[event]) {
          // If handler is set we will look for a specific handler and only remove this
          if(handler) {
            handlers[event].splice(handlers[event].indexOf(handler), 1);
            if(handlers[event].length === 0) {
              delete handlers[event];
            }
          } else {
            // If no handler is specified we remove all handlers for this event
            delete handlers[event];
          }
        }
      }

      /**
       * Use this function to emit an event. All handlers that are listening for this event will be triggered with the data parameter.
       *
       * @memberof Chartist.Event
       * @param {String} event The event name that should be triggered
       * @param {*} data Arbitrary data that will be passed to the event handler callback functions
       */
      function emit(event, data) {
        // Only do something if there are event handlers with this name existing
        if(handlers[event]) {
          handlers[event].forEach(function(handler) {
            handler(data);
          });
        }

        // Emit event to star event handlers
        if(handlers['*']) {
          handlers['*'].forEach(function(starHandler) {
            starHandler(event, data);
          });
        }
      }

      return {
        addEventHandler: addEventHandler,
        removeEventHandler: removeEventHandler,
        emit: emit
      };
    };

  }(window, document, Chartist));
  ;/**
   * This module provides some basic prototype inheritance utilities.
   *
   * @module Chartist.Class
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    function listToArray(list) {
      var arr = [];
      if (list.length) {
        for (var i = 0; i < list.length; i++) {
          arr.push(list[i]);
        }
      }
      return arr;
    }

    /**
     * Method to extend from current prototype.
     *
     * @memberof Chartist.Class
     * @param {Object} properties The object that serves as definition for the prototype that gets created for the new class. This object should always contain a constructor property that is the desired constructor for the newly created class.
     * @param {Object} [superProtoOverride] By default extens will use the current class prototype or Chartist.class. With this parameter you can specify any super prototype that will be used.
     * @returns {Function} Constructor function of the new class
     *
     * @example
     * var Fruit = Class.extend({
       * color: undefined,
       *   sugar: undefined,
       *
       *   constructor: function(color, sugar) {
       *     this.color = color;
       *     this.sugar = sugar;
       *   },
       *
       *   eat: function() {
       *     this.sugar = 0;
       *     return this;
       *   }
       * });
     *
     * var Banana = Fruit.extend({
       *   length: undefined,
       *
       *   constructor: function(length, sugar) {
       *     Banana.super.constructor.call(this, 'Yellow', sugar);
       *     this.length = length;
       *   }
       * });
     *
     * var banana = new Banana(20, 40);
     * console.log('banana instanceof Fruit', banana instanceof Fruit);
     * console.log('Fruit is prototype of banana', Fruit.prototype.isPrototypeOf(banana));
     * console.log('bananas prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
     * console.log(banana.sugar);
     * console.log(banana.eat().sugar);
     * console.log(banana.color);
     */
    function extend(properties, superProtoOverride) {
      var superProto = superProtoOverride || this.prototype || Chartist.Class;
      var proto = Object.create(superProto);

      Chartist.Class.cloneDefinitions(proto, properties);

      var constr = function() {
        var fn = proto.constructor || function () {},
          instance;

        // If this is linked to the Chartist namespace the constructor was not called with new
        // To provide a fallback we will instantiate here and return the instance
        instance = this === Chartist ? Object.create(proto) : this;
        fn.apply(instance, Array.prototype.slice.call(arguments, 0));

        // If this constructor was not called with new we need to return the instance
        // This will not harm when the constructor has been called with new as the returned value is ignored
        return instance;
      };

      constr.prototype = proto;
      constr.super = superProto;
      constr.extend = this.extend;

      return constr;
    }

    /**
     * Creates a mixin from multiple super prototypes.
     *
     * @memberof Chartist.Class
     * @param {Array} mixProtoArr An array of super prototypes or an array of super prototype constructors.
     * @param {Object} properties The object that serves as definition for the prototype that gets created for the new class. This object should always contain a constructor property that is the desired constructor for the newly created class.
     * @returns {Function} Constructor function of the newly created mixin class
     *
     * @example
     * var Fruit = Class.extend({
       * color: undefined,
       *   sugar: undefined,
       *
       *   constructor: function(color, sugar) {
       *     this.color = color;
       *     this.sugar = sugar;
       *   },
       *
       *   eat: function() {
       *     this.sugar = 0;
       *     return this;
       *   }
       * });
     *
     * var Banana = Fruit.extend({
       *   length: undefined,
       *
       *   constructor: function(length, sugar) {
       *     Banana.super.constructor.call(this, 'Yellow', sugar);
       *     this.length = length;
       *   }
       * });
     *
     * var banana = new Banana(20, 40);
     * console.log('banana instanceof Fruit', banana instanceof Fruit);
     * console.log('Fruit is prototype of banana', Fruit.prototype.isPrototypeOf(banana));
     * console.log('bananas prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
     * console.log(banana.sugar);
     * console.log(banana.eat().sugar);
     * console.log(banana.color);
     *
     *
     * var KCal = Class.extend({
       *   sugar: 0,
       *
       *   constructor: function(sugar) {
       *     this.sugar = sugar;
       *   },
       *
       *   get kcal() {
       *     return [this.sugar * 4, 'kcal'].join('');
       *   }
       * });
     *
     *      var Nameable = Class.extend({
       *   name: undefined,
       *
       *   constructor: function(name) {
       *     this.name = name;
       *   }
       * });
     *
     * var NameableKCalBanana = Class.mix([Banana, KCal, Nameable], {
       *   constructor: function(name, length, sugar) {
       *     Nameable.prototype.constructor.call(this, name);
       *     Banana.prototype.constructor.call(this, length, sugar);
       *   },
       *
       *   toString: function() {
       *     return [this.name, 'with', this.length + 'cm', 'and', this.kcal].join(' ');
       *   }
       * });
     *
     *
     *
     * var banana = new Banana(20, 40);
     * console.log('banana instanceof Fruit', banana instanceof Fruit);
     * console.log('Fruit is prototype of banana', Fruit.prototype.isPrototypeOf(banana));
     * console.log('bananas prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
     * console.log(banana.sugar);
     * console.log(banana.eat().sugar);
     * console.log(banana.color);
     *
     * var superBanana = new NameableKCalBanana('Super Mixin Banana', 30, 80);
     * console.log(superBanana.toString());
     *
     */
    function mix(mixProtoArr, properties) {
      if(this !== Chartist.Class) {
        throw new Error('Chartist.Class.mix should only be called on the type and never on an instance!');
      }

      // Make sure our mixin prototypes are the class objects and not the constructors
      var superPrototypes = [{}]
        .concat(mixProtoArr)
        .map(function (prototype) {
          return prototype instanceof Function ? prototype.prototype : prototype;
        });

      var mixedSuperProto = Chartist.Class.cloneDefinitions.apply(undefined, superPrototypes);
      // Delete the constructor if present because we don't want to invoke a constructor on a mixed prototype
      delete mixedSuperProto.constructor;
      return this.extend(properties, mixedSuperProto);
    }

    // Variable argument list clones args > 0 into args[0] and retruns modified args[0]
    function cloneDefinitions() {
      var args = listToArray(arguments);
      var target = args[0];

      args.splice(1, args.length - 1).forEach(function (source) {
        Object.getOwnPropertyNames(source).forEach(function (propName) {
          // If this property already exist in target we delete it first
          delete target[propName];
          // Define the property with the descriptor from source
          Object.defineProperty(target, propName,
            Object.getOwnPropertyDescriptor(source, propName));
        });
      });

      return target;
    }

    Chartist.Class = {
      extend: extend,
      mix: mix,
      cloneDefinitions: cloneDefinitions
    };

  }(window, document, Chartist));
  ;/**
   * Base for all chart types. The methods in Chartist.Base are inherited to all chart types.
   *
   * @module Chartist.Base
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    /**
     * Updates the chart which currently does a full reconstruction of the SVG DOM
     *
     * @param {Object} [data] Optional data you'd like to set for the chart before it will update. If not specified the update method will use the data that is already configured with the chart.
     * @param {Object} [options] Optional options you'd like to add to the previous options for the chart before it will update. If not specified the update method will use the options that have been already configured with the chart.
     * @param {Boolean} [extendObjects] If set to true, the passed options will be used to extend the options that have been configured already.
     * @memberof Chartist.Base
     */
    function update(data, options, extendObjects) {
      if(data) {
        this.data = data;
        // Event for data transformation that allows to manipulate the data before it gets rendered in the charts
        this.eventEmitter.emit('data', {
          type: 'update',
          data: this.data
        });
      }

      if(options) {
        this.options = Chartist.extend({}, extendObjects ? this.options : {}, options);

        // If chartist was not initialized yet, we just set the options and leave the rest to the initialization
        if(!this.initializeTimeoutId) {
          this.optionsProvider.removeMediaQueryListeners();
          this.optionsProvider = Chartist.optionsProvider(this.options, this.responsiveOptions, this.eventEmitter);
        }
      }

      // Only re-created the chart if it has been initialized yet
      if(!this.initializeTimeoutId) {
        this.createChart(this.optionsProvider.currentOptions);
      }

      // Return a reference to the chart object to chain up calls
      return this;
    }

    /**
     * This method can be called on the API object of each chart and will un-register all event listeners that were added to other components. This currently includes a window.resize listener as well as media query listeners if any responsive options have been provided. Use this function if you need to destroy and recreate Chartist charts dynamically.
     *
     * @memberof Chartist.Base
     */
    function detach() {
      window.removeEventListener('resize', this.resizeListener);
      this.optionsProvider.removeMediaQueryListeners();
      return this;
    }

    /**
     * Use this function to register event handlers. The handler callbacks are synchronous and will run in the main thread rather than the event loop.
     *
     * @memberof Chartist.Base
     * @param {String} event Name of the event. Check the examples for supported events.
     * @param {Function} handler The handler function that will be called when an event with the given name was emitted. This function will receive a data argument which contains event data. See the example for more details.
     */
    function on(event, handler) {
      this.eventEmitter.addEventHandler(event, handler);
      return this;
    }

    /**
     * Use this function to un-register event handlers. If the handler function parameter is omitted all handlers for the given event will be un-registered.
     *
     * @memberof Chartist.Base
     * @param {String} event Name of the event for which a handler should be removed
     * @param {Function} [handler] The handler function that that was previously used to register a new event handler. This handler will be removed from the event handler list. If this parameter is omitted then all event handlers for the given event are removed from the list.
     */
    function off(event, handler) {
      this.eventEmitter.removeEventHandler(event, handler);
      return this;
    }

    function initialize() {
      // Add window resize listener that re-creates the chart
      window.addEventListener('resize', this.resizeListener);

      // Obtain current options based on matching media queries (if responsive options are given)
      // This will also register a listener that is re-creating the chart based on media changes
      this.optionsProvider = Chartist.optionsProvider(this.options, this.responsiveOptions, this.eventEmitter);

      // Before the first chart creation we need to register us with all plugins that are configured
      // Initialize all relevant plugins with our chart object and the plugin options specified in the config
      if(this.options.plugins) {
        this.options.plugins.forEach(function(plugin) {
          if(plugin instanceof Array) {
            plugin[0](this, plugin[1]);
          } else {
            plugin(this);
          }
        }.bind(this));
      }

      // Event for data transformation that allows to manipulate the data before it gets rendered in the charts
      this.eventEmitter.emit('data', {
        type: 'initial',
        data: this.data
      });

      // Create the first chart
      this.createChart(this.optionsProvider.currentOptions);

      // As chart is initialized from the event loop now we can reset our timeout reference
      // This is important if the chart gets initialized on the same element twice
      this.initializeTimeoutId = undefined;
    }

    /**
     * Constructor of chart base class.
     *
     * @param query
     * @param data
     * @param options
     * @param responsiveOptions
     * @constructor
     */
    function Base(query, data, options, responsiveOptions) {
      this.container = Chartist.querySelector(query);
      this.data = data;
      this.options = options;
      this.responsiveOptions = responsiveOptions;
      this.eventEmitter = Chartist.EventEmitter();
      this.supportsForeignObject = Chartist.Svg.isSupported('Extensibility');
      this.supportsAnimations = Chartist.Svg.isSupported('AnimationEventsAttribute');
      this.resizeListener = function resizeListener(){
        this.update();
      }.bind(this);

      if(this.container) {
        // If chartist was already initialized in this container we are detaching all event listeners first
        if(this.container.__chartist__) {
          if(this.container.__chartist__.initializeTimeoutId) {
            // If the initializeTimeoutId is still set we can safely assume that the initialization function has not
            // been called yet from the event loop. Therefore we should cancel the timeout and don't need to detach
            window.clearTimeout(this.container.__chartist__.initializeTimeoutId);
          } else {
            // The timeout reference has already been reset which means we need to detach the old chart first
            this.container.__chartist__.detach();
          }
        }

        this.container.__chartist__ = this;
      }

      // Using event loop for first draw to make it possible to register event listeners in the same call stack where
      // the chart was created.
      this.initializeTimeoutId = setTimeout(initialize.bind(this), 0);
    }

    // Creating the chart base class
    Chartist.Base = Chartist.Class.extend({
      constructor: Base,
      optionsProvider: undefined,
      container: undefined,
      svg: undefined,
      eventEmitter: undefined,
      createChart: function() {
        throw new Error('Base chart type can\'t be instantiated!');
      },
      update: update,
      detach: detach,
      on: on,
      off: off,
      version: Chartist.version,
      supportsForeignObject: false
    });

  }(window, document, Chartist));
  ;/**
   * Chartist SVG module for simple SVG DOM abstraction
   *
   * @module Chartist.Svg
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    var svgNs = 'http://www.w3.org/2000/svg',
      xmlNs = 'http://www.w3.org/2000/xmlns/',
      xhtmlNs = 'http://www.w3.org/1999/xhtml';

    Chartist.xmlNs = {
      qualifiedName: 'xmlns:ct',
      prefix: 'ct',
      uri: 'http://gionkunz.github.com/chartist-js/ct'
    };

    /**
     * Chartist.Svg creates a new SVG object wrapper with a starting element. You can use the wrapper to fluently create sub-elements and modify them.
     *
     * @memberof Chartist.Svg
     * @constructor
     * @param {String|SVGElement} name The name of the SVG element to create or an SVG dom element which should be wrapped into Chartist.Svg
     * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} className This class or class list will be added to the SVG element
     * @param {Object} parent The parent SVG wrapper object where this newly created wrapper and it's element will be attached to as child
     * @param {Boolean} insertFirst If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
     */
    function Svg(name, attributes, className, parent, insertFirst) {
      // If Svg is getting called with an SVG element we just return the wrapper
      if(name instanceof SVGElement) {
        this._node = name;
      } else {
        this._node = document.createElementNS(svgNs, name);

        // If this is an SVG element created then custom namespace
        if(name === 'svg') {
          this._node.setAttributeNS(xmlNs, Chartist.xmlNs.qualifiedName, Chartist.xmlNs.uri);
        }

        if(attributes) {
          this.attr(attributes);
        }

        if(className) {
          this.addClass(className);
        }

        if(parent) {
          if (insertFirst && parent._node.firstChild) {
            parent._node.insertBefore(this._node, parent._node.firstChild);
          } else {
            parent._node.appendChild(this._node);
          }
        }
      }
    }

    /**
     * Set attributes on the current SVG element of the wrapper you're currently working on.
     *
     * @memberof Chartist.Svg
     * @param {Object|String} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added. If this parameter is a String then the function is used as a getter and will return the attribute value.
     * @param {String} ns If specified, the attributes will be set as namespace attributes with ns as prefix.
     * @returns {Object|String} The current wrapper object will be returned so it can be used for chaining or the attribute value if used as getter function.
     */
    function attr(attributes, ns) {
      if(typeof attributes === 'string') {
        if(ns) {
          return this._node.getAttributeNS(ns, attributes);
        } else {
          return this._node.getAttribute(attributes);
        }
      }

      Object.keys(attributes).forEach(function(key) {
        // If the attribute value is undefined we can skip this one
        if(attributes[key] === undefined) {
          return;
        }

        if(ns) {
          this._node.setAttributeNS(ns, [Chartist.xmlNs.prefix, ':', key].join(''), attributes[key]);
        } else {
          this._node.setAttribute(key, attributes[key]);
        }
      }.bind(this));

      return this;
    }

    /**
     * Create a new SVG element whose wrapper object will be selected for further operations. This way you can also create nested groups easily.
     *
     * @memberof Chartist.Svg
     * @param {String} name The name of the SVG element that should be created as child element of the currently selected element wrapper
     * @param {Object} [attributes] An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} [className] This class or class list will be added to the SVG element
     * @param {Boolean} [insertFirst] If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
     * @returns {Chartist.Svg} Returns a Chartist.Svg wrapper object that can be used to modify the containing SVG data
     */
    function elem(name, attributes, className, insertFirst) {
      return new Chartist.Svg(name, attributes, className, this, insertFirst);
    }

    /**
     * Returns the parent Chartist.SVG wrapper object
     *
     * @returns {Chartist.Svg} Returns a Chartist.Svg wrapper around the parent node of the current node. If the parent node is not existing or it's not an SVG node then this function will return null.
     */
    function parent() {
      return this._node.parentNode instanceof SVGElement ? new Chartist.Svg(this._node.parentNode) : null;
    }

    /**
     * This method returns a Chartist.Svg wrapper around the root SVG element of the current tree.
     *
     * @returns {Chartist.Svg} The root SVG element wrapped in a Chartist.Svg element
     */
    function root() {
      var node = this._node;
      while(node.nodeName !== 'svg') {
        node = node.parentNode;
      }
      return new Chartist.Svg(node);
    }

    /**
     * Find the first child SVG element of the current element that matches a CSS selector. The returned object is a Chartist.Svg wrapper.
     *
     * @param {String} selector A CSS selector that is used to query for child SVG elements
     * @returns {Chartist.Svg} The SVG wrapper for the element found or null if no element was found
     */
    function querySelector(selector) {
      var foundNode = this._node.querySelector(selector);
      return foundNode ? new Chartist.Svg(foundNode) : null;
    }

    /**
     * Find the all child SVG elements of the current element that match a CSS selector. The returned object is a Chartist.Svg.List wrapper.
     *
     * @param {String} selector A CSS selector that is used to query for child SVG elements
     * @returns {Chartist.Svg.List} The SVG wrapper list for the element found or null if no element was found
     */
    function querySelectorAll(selector) {
      var foundNodes = this._node.querySelectorAll(selector);
      return foundNodes.length ? new Chartist.Svg.List(foundNodes) : null;
    }

    /**
     * This method creates a foreignObject (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) that allows to embed HTML content into a SVG graphic. With the help of foreignObjects you can enable the usage of regular HTML elements inside of SVG where they are subject for SVG positioning and transformation but the Browser will use the HTML rendering capabilities for the containing DOM.
     *
     * @memberof Chartist.Svg
     * @param {Node|String} content The DOM Node, or HTML string that will be converted to a DOM Node, that is then placed into and wrapped by the foreignObject
     * @param {String} [attributes] An object with properties that will be added as attributes to the foreignObject element that is created. Attributes with undefined values will not be added.
     * @param {String} [className] This class or class list will be added to the SVG element
     * @param {Boolean} [insertFirst] Specifies if the foreignObject should be inserted as first child
     * @returns {Chartist.Svg} New wrapper object that wraps the foreignObject element
     */
    function foreignObject(content, attributes, className, insertFirst) {
      // If content is string then we convert it to DOM
      // TODO: Handle case where content is not a string nor a DOM Node
      if(typeof content === 'string') {
        var container = document.createElement('div');
        container.innerHTML = content;
        content = container.firstChild;
      }

      // Adding namespace to content element
      content.setAttribute('xmlns', xhtmlNs);

      // Creating the foreignObject without required extension attribute (as described here
      // http://www.w3.org/TR/SVG/extend.html#ForeignObjectElement)
      var fnObj = this.elem('foreignObject', attributes, className, insertFirst);

      // Add content to foreignObjectElement
      fnObj._node.appendChild(content);

      return fnObj;
    }

    /**
     * This method adds a new text element to the current Chartist.Svg wrapper.
     *
     * @memberof Chartist.Svg
     * @param {String} t The text that should be added to the text element that is created
     * @returns {Chartist.Svg} The same wrapper object that was used to add the newly created element
     */
    function text(t) {
      this._node.appendChild(document.createTextNode(t));
      return this;
    }

    /**
     * This method will clear all child nodes of the current wrapper object.
     *
     * @memberof Chartist.Svg
     * @returns {Chartist.Svg} The same wrapper object that got emptied
     */
    function empty() {
      while (this._node.firstChild) {
        this._node.removeChild(this._node.firstChild);
      }

      return this;
    }

    /**
     * This method will cause the current wrapper to remove itself from its parent wrapper. Use this method if you'd like to get rid of an element in a given DOM structure.
     *
     * @memberof Chartist.Svg
     * @returns {Chartist.Svg} The parent wrapper object of the element that got removed
     */
    function remove() {
      this._node.parentNode.removeChild(this._node);
      return this.parent();
    }

    /**
     * This method will replace the element with a new element that can be created outside of the current DOM.
     *
     * @memberof Chartist.Svg
     * @param {Chartist.Svg} newElement The new Chartist.Svg object that will be used to replace the current wrapper object
     * @returns {Chartist.Svg} The wrapper of the new element
     */
    function replace(newElement) {
      this._node.parentNode.replaceChild(newElement._node, this._node);
      return newElement;
    }

    /**
     * This method will append an element to the current element as a child.
     *
     * @memberof Chartist.Svg
     * @param {Chartist.Svg} element The Chartist.Svg element that should be added as a child
     * @param {Boolean} [insertFirst] Specifies if the element should be inserted as first child
     * @returns {Chartist.Svg} The wrapper of the appended object
     */
    function append(element, insertFirst) {
      if(insertFirst && this._node.firstChild) {
        this._node.insertBefore(element._node, this._node.firstChild);
      } else {
        this._node.appendChild(element._node);
      }

      return this;
    }

    /**
     * Returns an array of class names that are attached to the current wrapper element. This method can not be chained further.
     *
     * @memberof Chartist.Svg
     * @returns {Array} A list of classes or an empty array if there are no classes on the current element
     */
    function classes() {
      return this._node.getAttribute('class') ? this._node.getAttribute('class').trim().split(/\s+/) : [];
    }

    /**
     * Adds one or a space separated list of classes to the current element and ensures the classes are only existing once.
     *
     * @memberof Chartist.Svg
     * @param {String} names A white space separated list of class names
     * @returns {Chartist.Svg} The wrapper of the current element
     */
    function addClass(names) {
      this._node.setAttribute('class',
        this.classes(this._node)
          .concat(names.trim().split(/\s+/))
          .filter(function(elem, pos, self) {
            return self.indexOf(elem) === pos;
          }).join(' ')
      );

      return this;
    }

    /**
     * Removes one or a space separated list of classes from the current element.
     *
     * @memberof Chartist.Svg
     * @param {String} names A white space separated list of class names
     * @returns {Chartist.Svg} The wrapper of the current element
     */
    function removeClass(names) {
      var removedClasses = names.trim().split(/\s+/);

      this._node.setAttribute('class', this.classes(this._node).filter(function(name) {
        return removedClasses.indexOf(name) === -1;
      }).join(' '));

      return this;
    }

    /**
     * Removes all classes from the current element.
     *
     * @memberof Chartist.Svg
     * @returns {Chartist.Svg} The wrapper of the current element
     */
    function removeAllClasses() {
      this._node.setAttribute('class', '');

      return this;
    }

    /**
     * Get element height with fallback to svg BoundingBox or parent container dimensions:
     * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
     *
     * @memberof Chartist.Svg
     * @return {Number} The elements height in pixels
     */
    function height() {
      return this._node.clientHeight || Math.round(this._node.getBBox().height) || this._node.parentNode.clientHeight;
    }

    /**
     * Get element width with fallback to svg BoundingBox or parent container dimensions:
     * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
     *
     * @memberof Chartist.Core
     * @return {Number} The elements width in pixels
     */
    function width() {
      return this._node.clientWidth || Math.round(this._node.getBBox().width) || this._node.parentNode.clientWidth;
    }

    /**
     * The animate function lets you animate the current element with SMIL animations. You can add animations for multiple attributes at the same time by using an animation definition object. This object should contain SMIL animation attributes. Please refer to http://www.w3.org/TR/SVG/animate.html for a detailed specification about the available animation attributes. Additionally an easing property can be passed in the animation definition object. This can be a string with a name of an easing function in `Chartist.Svg.Easing` or an array with four numbers specifying a cubic Bézier curve.
     * **An animations object could look like this:**
     * ```javascript
     * element.animate({
     *   opacity: {
     *     dur: 1000,
     *     from: 0,
     *     to: 1
     *   },
     *   x1: {
     *     dur: '1000ms',
     *     from: 100,
     *     to: 200,
     *     easing: 'easeOutQuart'
     *   },
     *   y1: {
     *     dur: '2s',
     *     from: 0,
     *     to: 100
     *   }
     * });
     * ```
     * **Automatic unit conversion**
     * For the `dur` and the `begin` animate attribute you can also omit a unit by passing a number. The number will automatically be converted to milli seconds.
     * **Guided mode**
     * The default behavior of SMIL animations with offset using the `begin` attribute is that the attribute will keep it's original value until the animation starts. Mostly this behavior is not desired as you'd like to have your element attributes already initialized with the animation `from` value even before the animation starts. Also if you don't specify `fill="freeze"` on an animate element or if you delete the animation after it's done (which is done in guided mode) the attribute will switch back to the initial value. This behavior is also not desired when performing simple one-time animations. For one-time animations you'd want to trigger animations immediately instead of relative to the document begin time. That's why in guided mode Chartist.Svg will also use the `begin` property to schedule a timeout and manually start the animation after the timeout. If you're using multiple SMIL definition objects for an attribute (in an array), guided mode will be disabled for this attribute, even if you explicitly enabled it.
     * If guided mode is enabled the following behavior is added:
     * - Before the animation starts (even when delayed with `begin`) the animated attribute will be set already to the `from` value of the animation
     * - `begin` is explicitly set to `indefinite` so it can be started manually without relying on document begin time (creation)
     * - The animate element will be forced to use `fill="freeze"`
     * - The animation will be triggered with `beginElement()` in a timeout where `begin` of the definition object is interpreted in milli seconds. If no `begin` was specified the timeout is triggered immediately.
     * - After the animation the element attribute value will be set to the `to` value of the animation
     * - The animate element is deleted from the DOM
     *
     * @memberof Chartist.Svg
     * @param {Object} animations An animations object where the property keys are the attributes you'd like to animate. The properties should be objects again that contain the SMIL animation attributes (usually begin, dur, from, and to). The property begin and dur is auto converted (see Automatic unit conversion). You can also schedule multiple animations for the same attribute by passing an Array of SMIL definition objects. Attributes that contain an array of SMIL definition objects will not be executed in guided mode.
     * @param {Boolean} guided Specify if guided mode should be activated for this animation (see Guided mode). If not otherwise specified, guided mode will be activated.
     * @param {Object} eventEmitter If specified, this event emitter will be notified when an animation starts or ends.
     * @returns {Chartist.Svg} The current element where the animation was added
     */
    function animate(animations, guided, eventEmitter) {
      if(guided === undefined) {
        guided = true;
      }

      Object.keys(animations).forEach(function createAnimateForAttributes(attribute) {

        function createAnimate(animationDefinition, guided) {
          var attributeProperties = {},
            animate,
            timeout,
            easing;

          // Check if an easing is specified in the definition object and delete it from the object as it will not
          // be part of the animate element attributes.
          if(animationDefinition.easing) {
            // If already an easing Bézier curve array we take it or we lookup a easing array in the Easing object
            easing = animationDefinition.easing instanceof Array ?
              animationDefinition.easing :
              Chartist.Svg.Easing[animationDefinition.easing];
            delete animationDefinition.easing;
          }

          // If numeric dur or begin was provided we assume milli seconds
          animationDefinition.begin = Chartist.ensureUnit(animationDefinition.begin, 'ms');
          animationDefinition.dur = Chartist.ensureUnit(animationDefinition.dur, 'ms');

          if(easing) {
            animationDefinition.calcMode = 'spline';
            animationDefinition.keySplines = easing.join(' ');
            animationDefinition.keyTimes = '0;1';
          }

          // Adding "fill: freeze" if we are in guided mode and set initial attribute values
          if(guided) {
            animationDefinition.fill = 'freeze';
            // Animated property on our element should already be set to the animation from value in guided mode
            attributeProperties[attribute] = animationDefinition.from;
            this.attr(attributeProperties);

            // In guided mode we also set begin to indefinite so we can trigger the start manually and put the begin
            // which needs to be in ms aside
            timeout = Chartist.stripUnit(animationDefinition.begin || 0);
            animationDefinition.begin = 'indefinite';
          }

          animate = this.elem('animate', Chartist.extend({
            attributeName: attribute
          }, animationDefinition));

          if(guided) {
            // If guided we take the value that was put aside in timeout and trigger the animation manually with a timeout
            setTimeout(function() {
              // If beginElement fails we set the animated attribute to the end position and remove the animate element
              // This happens if the SMIL ElementTimeControl interface is not supported or any other problems occured in
              // the browser. (Currently FF 34 does not support animate elements in foreignObjects)
              try {
                animate._node.beginElement();
              } catch(err) {
                // Set animated attribute to current animated value
                attributeProperties[attribute] = animationDefinition.to;
                this.attr(attributeProperties);
                // Remove the animate element as it's no longer required
                animate.remove();
              }
            }.bind(this), timeout);
          }

          if(eventEmitter) {
            animate._node.addEventListener('beginEvent', function handleBeginEvent() {
              eventEmitter.emit('animationBegin', {
                element: this,
                animate: animate._node,
                params: animationDefinition
              });
            }.bind(this));
          }

          animate._node.addEventListener('endEvent', function handleEndEvent() {
            if(eventEmitter) {
              eventEmitter.emit('animationEnd', {
                element: this,
                animate: animate._node,
                params: animationDefinition
              });
            }

            if(guided) {
              // Set animated attribute to current animated value
              attributeProperties[attribute] = animationDefinition.to;
              this.attr(attributeProperties);
              // Remove the animate element as it's no longer required
              animate.remove();
            }
          }.bind(this));
        }

        // If current attribute is an array of definition objects we create an animate for each and disable guided mode
        if(animations[attribute] instanceof Array) {
          animations[attribute].forEach(function(animationDefinition) {
            createAnimate.bind(this)(animationDefinition, false);
          }.bind(this));
        } else {
          createAnimate.bind(this)(animations[attribute], guided);
        }

      }.bind(this));

      return this;
    }

    Chartist.Svg = Chartist.Class.extend({
      constructor: Svg,
      attr: attr,
      elem: elem,
      parent: parent,
      root: root,
      querySelector: querySelector,
      querySelectorAll: querySelectorAll,
      foreignObject: foreignObject,
      text: text,
      empty: empty,
      remove: remove,
      replace: replace,
      append: append,
      classes: classes,
      addClass: addClass,
      removeClass: removeClass,
      removeAllClasses: removeAllClasses,
      height: height,
      width: width,
      animate: animate
    });

    /**
     * This method checks for support of a given SVG feature like Extensibility, SVG-animation or the like. Check http://www.w3.org/TR/SVG11/feature for a detailed list.
     *
     * @memberof Chartist.Svg
     * @param {String} feature The SVG 1.1 feature that should be checked for support.
     * @returns {Boolean} True of false if the feature is supported or not
     */
    Chartist.Svg.isSupported = function(feature) {
      return document.implementation.hasFeature('www.http://w3.org/TR/SVG11/feature#' + feature, '1.1');
    };

    /**
     * This Object contains some standard easing cubic bezier curves. Then can be used with their name in the `Chartist.Svg.animate`. You can also extend the list and use your own name in the `animate` function. Click the show code button to see the available bezier functions.
     *
     * @memberof Chartist.Svg
     */
    var easingCubicBeziers = {
      easeInSine: [0.47, 0, 0.745, 0.715],
      easeOutSine: [0.39, 0.575, 0.565, 1],
      easeInOutSine: [0.445, 0.05, 0.55, 0.95],
      easeInQuad: [0.55, 0.085, 0.68, 0.53],
      easeOutQuad: [0.25, 0.46, 0.45, 0.94],
      easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
      easeInCubic: [0.55, 0.055, 0.675, 0.19],
      easeOutCubic: [0.215, 0.61, 0.355, 1],
      easeInOutCubic: [0.645, 0.045, 0.355, 1],
      easeInQuart: [0.895, 0.03, 0.685, 0.22],
      easeOutQuart: [0.165, 0.84, 0.44, 1],
      easeInOutQuart: [0.77, 0, 0.175, 1],
      easeInQuint: [0.755, 0.05, 0.855, 0.06],
      easeOutQuint: [0.23, 1, 0.32, 1],
      easeInOutQuint: [0.86, 0, 0.07, 1],
      easeInExpo: [0.95, 0.05, 0.795, 0.035],
      easeOutExpo: [0.19, 1, 0.22, 1],
      easeInOutExpo: [1, 0, 0, 1],
      easeInCirc: [0.6, 0.04, 0.98, 0.335],
      easeOutCirc: [0.075, 0.82, 0.165, 1],
      easeInOutCirc: [0.785, 0.135, 0.15, 0.86],
      easeInBack: [0.6, -0.28, 0.735, 0.045],
      easeOutBack: [0.175, 0.885, 0.32, 1.275],
      easeInOutBack: [0.68, -0.55, 0.265, 1.55]
    };

    Chartist.Svg.Easing = easingCubicBeziers;

    /**
     * This helper class is to wrap multiple `Chartist.Svg` elements into a list where you can call the `Chartist.Svg` functions on all elements in the list with one call. This is helpful when you'd like to perform calls with `Chartist.Svg` on multiple elements.
     * An instance of this class is also returned by `Chartist.Svg.querySelectorAll`.
     *
     * @memberof Chartist.Svg
     * @param {Array<Node>|NodeList} nodeList An Array of SVG DOM nodes or a SVG DOM NodeList (as returned by document.querySelectorAll)
     * @constructor
     */
    function SvgList(nodeList) {
      var list = this;

      this.svgElements = [];
      for(var i = 0; i < nodeList.length; i++) {
        this.svgElements.push(new Chartist.Svg(nodeList[i]));
      }

      // Add delegation methods for Chartist.Svg
      Object.keys(Chartist.Svg.prototype).filter(function(prototypeProperty) {
        return ['constructor',
            'parent',
            'querySelector',
            'querySelectorAll',
            'replace',
            'append',
            'classes',
            'height',
            'width'].indexOf(prototypeProperty) === -1;
      }).forEach(function(prototypeProperty) {
        list[prototypeProperty] = function() {
          var args = Array.prototype.slice.call(arguments, 0);
          list.svgElements.forEach(function(element) {
            Chartist.Svg.prototype[prototypeProperty].apply(element, args);
          });
          return list;
        };
      });
    }

    Chartist.Svg.List = Chartist.Class.extend({
      constructor: SvgList
    });

  }(window, document, Chartist));
  ;/**
   * The Chartist line chart can be used to draw Line or Scatter charts. If used in the browser you can access the global `Chartist` namespace where you find the `Line` function as a main entry point.
   *
   * For examples on how to use the line chart please check the examples of the `Chartist.Line` method.
   *
   * @module Chartist.Line
   */
  /* global Chartist */
  (function(window, document, Chartist){
    'use strict';

    /**
     * Default options in line charts. Expand the code view to see a detailed list of options with comments.
     *
     * @memberof Chartist.Line
     */
    var defaultOptions = {
      // Options for X-Axis
      axisX: {
        // The offset of the labels to the chart area
        offset: 30,
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop
      },
      // Options for Y-Axis
      axisY: {
        // The offset of the labels to the chart area
        offset: 40,
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop,
        // This value specifies the minimum height in pixel of the scale steps
        scaleMinSpace: 20
      },
      // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
      width: undefined,
      // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
      height: undefined,
      // If the line should be drawn or not
      showLine: true,
      // If dots should be drawn or not
      showPoint: true,
      // If the line chart should draw an area
      showArea: false,
      // The base for the area chart that will be used to close the area shape (is normally 0)
      areaBase: 0,
      // Specify if the lines should be smoothed (Catmull-Rom-Splines will be used)
      lineSmooth: true,
      // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
      low: undefined,
      // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
      high: undefined,
      // Padding of the chart drawing area to the container element and labels
      chartPadding: 5,
      // When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler.
      fullWidth: false,
      // Override the class names that get used to generate the SVG structure of the chart
      classNames: {
        chart: 'ct-chart-line',
        label: 'ct-label',
        labelGroup: 'ct-labels',
        series: 'ct-series',
        line: 'ct-line',
        point: 'ct-point',
        area: 'ct-area',
        grid: 'ct-grid',
        gridGroup: 'ct-grids',
        vertical: 'ct-vertical',
        horizontal: 'ct-horizontal'
      }
    };

    /**
     * Creates a new chart
     *
     */
    function createChart(options) {
      var seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length);

      // Create new svg object
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

      // initialize bounds
      bounds = Chartist.getBounds(this.svg, Chartist.getHighLow(normalizedData), options);

      var chartRect = Chartist.createChartRect(this.svg, options);
      // Start drawing
      var labels = this.svg.elem('g').addClass(options.classNames.labelGroup),
        grid = this.svg.elem('g').addClass(options.classNames.gridGroup);

      Chartist.createXAxis(chartRect, this.data, grid, labels, options, this.eventEmitter, this.supportsForeignObject);
      Chartist.createYAxis(chartRect, bounds, grid, labels, options, this.eventEmitter, this.supportsForeignObject);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < this.data.series.length; i++) {
        seriesGroups[i] = this.svg.elem('g');

        // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
        seriesGroups[i].attr({
          'series-name': this.data.series[i].name,
          'meta': Chartist.serialize(this.data.series[i].meta)
        }, Chartist.xmlNs.uri);

        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (this.data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        var p,
          pathCoordinates = [],
          point;

        for (var j = 0; j < normalizedData[i].length; j++) {
          p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j, options);
          pathCoordinates.push(p.x, p.y);

          //If we should show points we need to create them now to avoid secondary loop
          // Small offset for Firefox to render squares correctly
          if (options.showPoint) {
            point = seriesGroups[i].elem('line', {
              x1: p.x,
              y1: p.y,
              x2: p.x + 0.01,
              y2: p.y
            }, options.classNames.point).attr({
              'value': normalizedData[i][j],
              'meta': this.data.series[i].data ?
                Chartist.serialize(this.data.series[i].data[j].meta) :
                Chartist.serialize(this.data.series[i][j].meta)
            }, Chartist.xmlNs.uri);

            this.eventEmitter.emit('draw', {
              type: 'point',
              value: normalizedData[i][j],
              index: j,
              group: seriesGroups[i],
              element: point,
              x: p.x,
              y: p.y
            });
          }
        }

        // TODO: Nicer handling of conditions, maybe composition?
        if (options.showLine || options.showArea) {
          // TODO: We should add a path API in the SVG library for easier path creation
          var pathElements = ['M' + pathCoordinates[0] + ',' + pathCoordinates[1]];

          // If smoothed path and path has more than two points then use catmull rom to bezier algorithm
          if (options.lineSmooth && pathCoordinates.length > 4) {

            var cr = Chartist.catmullRom2bezier(pathCoordinates);
            for(var k = 0; k < cr.length; k++) {
              pathElements.push('C' + cr[k].join());
            }
          } else {
            for(var l = 3; l < pathCoordinates.length; l += 2) {
              pathElements.push('L' + pathCoordinates[l - 1] + ',' + pathCoordinates[l]);
            }
          }

          if(options.showLine) {
            var line = seriesGroups[i].elem('path', {
              d: pathElements.join('')
            }, options.classNames.line, true).attr({
              'values': normalizedData[i]
            }, Chartist.xmlNs.uri);

            this.eventEmitter.emit('draw', {
              type: 'line',
              values: normalizedData[i],
              index: i,
              group: seriesGroups[i],
              element: line
            });
          }

          if(options.showArea) {
            // If areaBase is outside the chart area (< low or > high) we need to set it respectively so that
            // the area is not drawn outside the chart area.
            var areaBase = Math.max(Math.min(options.areaBase, bounds.max), bounds.min);

            // If we need to draw area shapes we just make a copy of our pathElements SVG path array
            var areaPathElements = pathElements.slice();

            // We project the areaBase value into screen coordinates
            var areaBaseProjected = Chartist.projectPoint(chartRect, bounds, [areaBase], 0, options);
            // And splice our new area path array to add the missing path elements to close the area shape
            areaPathElements.splice(0, 0, 'M' + areaBaseProjected.x + ',' + areaBaseProjected.y);
            areaPathElements[1] = 'L' + pathCoordinates[0] + ',' + pathCoordinates[1];
            areaPathElements.push('L' + pathCoordinates[pathCoordinates.length - 2] + ',' + areaBaseProjected.y);

            // Create the new path for the area shape with the area class from the options
            var area = seriesGroups[i].elem('path', {
              d: areaPathElements.join('')
            }, options.classNames.area, true).attr({
              'values': normalizedData[i]
            }, Chartist.xmlNs.uri);

            this.eventEmitter.emit('draw', {
              type: 'area',
              values: normalizedData[i],
              index: i,
              group: seriesGroups[i],
              element: area
            });
          }
        }
      }

      this.eventEmitter.emit('created', {
        bounds: bounds,
        chartRect: chartRect,
        svg: this.svg,
        options: options
      });
    }

    /**
     * This method creates a new line chart.
     *
     * @memberof Chartist.Line
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object that needs to consist of a labels and a series array
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object which exposes the API for the created chart
     *
     * @example
     * // Create a simple line chart
     * var data = {
     *   // A labels array that can contain any sort of values
     *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
     *   // Our series array that contains series objects or in this case series data arrays
     *   series: [
     *     [5, 2, 4, 2, 0]
     *   ]
     * };
     *
     * // As options we currently only set a static size of 300x200 px
     * var options = {
     *   width: '300px',
     *   height: '200px'
     * };
     *
     * // In the global name space Chartist we call the Line function to initialize a line chart. As a first parameter we pass in a selector where we would like to get our chart created. Second parameter is the actual data object and as a third parameter we pass in our options
     * new Chartist.Line('.ct-chart', data, options);
     *
     * @example
     * // Create a line chart with responsive options
     *
     * var data = {
     *   // A labels array that can contain any sort of values
     *   labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
     *   // Our series array that contains series objects or in this case series data arrays
     *   series: [
     *     [5, 2, 4, 2, 0]
     *   ]
     * };
     *
     * // In adition to the regular options we specify responsive option overrides that will override the default configutation based on the matching media queries.
     * var responsiveOptions = [
     *   ['screen and (min-width: 641px) and (max-width: 1024px)', {
     *     showPoint: false,
     *     axisX: {
     *       labelInterpolationFnc: function(value) {
     *         // Will return Mon, Tue, Wed etc. on medium screens
     *         return value.slice(0, 3);
     *       }
     *     }
     *   }],
     *   ['screen and (max-width: 640px)', {
     *     showLine: false,
     *     axisX: {
     *       labelInterpolationFnc: function(value) {
     *         // Will return M, T, W etc. on small screens
     *         return value[0];
     *       }
     *     }
     *   }]
     * ];
     *
     * new Chartist.Line('.ct-chart', data, null, responsiveOptions);
     *
     */
    function Line(query, data, options, responsiveOptions) {
      Chartist.Line.super.constructor.call(this,
        query,
        data,
        Chartist.extend({}, defaultOptions, options),
        responsiveOptions);
    }

    // Creating line chart type in Chartist namespace
    Chartist.Line = Chartist.Base.extend({
      constructor: Line,
      createChart: createChart
    });

  }(window, document, Chartist));
  ;/**
   * The bar chart module of Chartist that can be used to draw unipolar or bipolar bar and grouped bar charts.
   *
   * @module Chartist.Bar
   */
  /* global Chartist */
  (function(window, document, Chartist){
    'use strict';

    /**
     * Default options in bar charts. Expand the code view to see a detailed list of options with comments.
     *
     * @memberof Chartist.Bar
     */
    var defaultOptions = {
      // Options for X-Axis
      axisX: {
        // The offset of the chart drawing area to the border of the container
        offset: 30,
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop
      },
      // Options for Y-Axis
      axisY: {
        // The offset of the chart drawing area to the border of the container
        offset: 40,
        // Allows you to correct label positioning on this axis by positive or negative x and y offset.
        labelOffset: {
          x: 0,
          y: 0
        },
        // If labels should be shown or not
        showLabel: true,
        // If the axis grid should be drawn or not
        showGrid: true,
        // Interpolation function that allows you to intercept the value from the axis label
        labelInterpolationFnc: Chartist.noop,
        // This value specifies the minimum height in pixel of the scale steps
        scaleMinSpace: 20
      },
      // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
      width: undefined,
      // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
      height: undefined,
      // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
      high: undefined,
      // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
      low: undefined,
      // Padding of the chart drawing area to the container element and labels
      chartPadding: 5,
      // Specify the distance in pixel of bars in a group
      seriesBarDistance: 15,
      // When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler. For bar charts this might be used in conjunction with the centerBars property set to false.
      fullWidth: false,
      // This property will cause the bars of the bar chart to be drawn on the grid line rather than between two grid lines. This is useful for single series bar charts and might be used in conjunction with the fullWidth property.
      centerBars: true,
      // If set to true this property will cause the series bars to be stacked and form a total for each series point. This will also influence the y-axis and the overall bounds of the chart. In stacked mode the seriesBarDistance property will have no effect.
      stackBars: false,
      // Override the class names that get used to generate the SVG structure of the chart
      classNames: {
        chart: 'ct-chart-bar',
        label: 'ct-label',
        labelGroup: 'ct-labels',
        series: 'ct-series',
        bar: 'ct-bar',
        grid: 'ct-grid',
        gridGroup: 'ct-grids',
        vertical: 'ct-vertical',
        horizontal: 'ct-horizontal'
      }
    };

    /**
     * Creates a new chart
     *
     */
    function createChart(options) {
      var seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length),
        highLow;

      // Create new svg element
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

      if(options.stackBars) {
        // If stacked bars we need to calculate the high low from stacked values from each series
        var serialSums = Chartist.serialMap(normalizedData, function serialSums() {
          return Array.prototype.slice.call(arguments).reduce(Chartist.sum, 0);
        });

        highLow = Chartist.getHighLow([serialSums]);
      } else {
        highLow = Chartist.getHighLow(normalizedData);
      }

      // initialize bounds
      bounds = Chartist.getBounds(this.svg, highLow, options, 0);

      var chartRect = Chartist.createChartRect(this.svg, options);
      // Start drawing
      var labels = this.svg.elem('g').addClass(options.classNames.labelGroup),
        grid = this.svg.elem('g').addClass(options.classNames.gridGroup),
        // Projected 0 point
        zeroPoint = Chartist.projectPoint(chartRect, bounds, [0], 0, options),
        // Used to track the screen coordinates of stacked bars
        stackedBarValues = [];

      Chartist.createXAxis(chartRect, this.data, grid, labels, options, this.eventEmitter, this.supportsForeignObject);
      Chartist.createYAxis(chartRect, bounds, grid, labels, options, this.eventEmitter, this.supportsForeignObject);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < this.data.series.length; i++) {
        // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
        var biPol = i - (this.data.series.length - 1) / 2,
        // Half of the period width between vertical grid lines used to position bars
          periodHalfWidth = chartRect.width() / (normalizedData[i].length - (options.fullWidth ? 1 : 0)) / 2;

        seriesGroups[i] = this.svg.elem('g');

        // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
        seriesGroups[i].attr({
          'series-name': this.data.series[i].name,
          'meta': Chartist.serialize(this.data.series[i].meta)
        }, Chartist.xmlNs.uri);

        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (this.data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        for(var j = 0; j < normalizedData[i].length; j++) {
          var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j, options),
            bar,
            previousStack,
            y1,
            y2;

          // Offset to center bar between grid lines
          p.x += (options.centerBars ? periodHalfWidth : 0);
          // Using bi-polar offset for multiple series if no stacked bars are used
          p.x += options.stackBars ? 0 : biPol * options.seriesBarDistance;

          // Enter value in stacked bar values used to remember previous screen value for stacking up bars
          previousStack = stackedBarValues[j] || zeroPoint.y;
          stackedBarValues[j] = previousStack - (zeroPoint.y - p.y);

          // If bars are stacked we use the stackedBarValues reference and otherwise base all bars off the zero line
          y1 = options.stackBars ? previousStack : zeroPoint.y;
          y2 = options.stackBars ? stackedBarValues[j] : p.y;

          bar = seriesGroups[i].elem('line', {
            x1: p.x,
            y1: y1,
            x2: p.x,
            y2: y2
          }, options.classNames.bar).attr({
            'value': normalizedData[i][j],
            'meta': this.data.series[i].data ?
              Chartist.serialize(this.data.series[i].data[j].meta) :
              Chartist.serialize(this.data.series[i][j].meta)
          }, Chartist.xmlNs.uri);

          this.eventEmitter.emit('draw', {
            type: 'bar',
            value: normalizedData[i][j],
            index: j,
            group: seriesGroups[i],
            element: bar,
            x1: p.x,
            y1: y1,
            x2: p.x,
            y2: y2
          });
        }
      }

      this.eventEmitter.emit('created', {
        bounds: bounds,
        chartRect: chartRect,
        svg: this.svg,
        options: options
      });
    }

    /**
     * This method creates a new bar chart and returns API object that you can use for later changes.
     *
     * @memberof Chartist.Bar
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object that needs to consist of a labels and a series array
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object which exposes the API for the created chart
     *
     * @example
     * // Create a simple bar chart
     * var data = {
     *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
     *   series: [
     *     [5, 2, 4, 2, 0]
     *   ]
     * };
     *
     * // In the global name space Chartist we call the Bar function to initialize a bar chart. As a first parameter we pass in a selector where we would like to get our chart created and as a second parameter we pass our data object.
     * new Chartist.Bar('.ct-chart', data);
     *
     * @example
     * // This example creates a bipolar grouped bar chart where the boundaries are limitted to -10 and 10
     * new Chartist.Bar('.ct-chart', {
     *   labels: [1, 2, 3, 4, 5, 6, 7],
     *   series: [
     *     [1, 3, 2, -5, -3, 1, -6],
     *     [-5, -2, -4, -1, 2, -3, 1]
     *   ]
     * }, {
     *   seriesBarDistance: 12,
     *   low: -10,
     *   high: 10
     * });
     *
     */
    function Bar(query, data, options, responsiveOptions) {
      Chartist.Bar.super.constructor.call(this,
        query,
        data,
        Chartist.extend({}, defaultOptions, options),
        responsiveOptions);
    }

    // Creating bar chart type in Chartist namespace
    Chartist.Bar = Chartist.Base.extend({
      constructor: Bar,
      createChart: createChart
    });

  }(window, document, Chartist));
  ;/**
   * The pie chart module of Chartist that can be used to draw pie, donut or gauge charts
   *
   * @module Chartist.Pie
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    /**
     * Default options in line charts. Expand the code view to see a detailed list of options with comments.
     *
     * @memberof Chartist.Pie
     */
    var defaultOptions = {
      // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
      width: undefined,
      // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
      height: undefined,
      // Padding of the chart drawing area to the container element and labels
      chartPadding: 5,
      // Override the class names that get used to generate the SVG structure of the chart
      classNames: {
        chart: 'ct-chart-pie',
        series: 'ct-series',
        slice: 'ct-slice',
        donut: 'ct-donut',
        label: 'ct-label'
      },
      // The start angle of the pie chart in degrees where 0 points north. A higher value offsets the start angle clockwise.
      startAngle: 0,
      // An optional total you can specify. By specifying a total value, the sum of the values in the series must be this total in order to draw a full pie. You can use this parameter to draw only parts of a pie or gauge charts.
      total: undefined,
      // If specified the donut CSS classes will be used and strokes will be drawn instead of pie slices.
      donut: false,
      // Specify the donut stroke width, currently done in javascript for convenience. May move to CSS styles in the future.
      donutWidth: 60,
      // If a label should be shown or not
      showLabel: true,
      // Label position offset from the standard position which is half distance of the radius. This value can be either positive or negative. Positive values will position the label away from the center.
      labelOffset: 0,
      // An interpolation function for the label value
      labelInterpolationFnc: Chartist.noop,
      // Label direction can be 'neutral', 'explode' or 'implode'. The labels anchor will be positioned based on those settings as well as the fact if the labels are on the right or left side of the center of the chart. Usually explode is useful when labels are positioned far away from the center.
      labelDirection: 'neutral'
    };

    /**
     * Determines SVG anchor position based on direction and center parameter
     *
     * @param center
     * @param label
     * @param direction
     * @returns {string}
     */
    function determineAnchorPosition(center, label, direction) {
      var toTheRight = label.x > center.x;

      if(toTheRight && direction === 'explode' ||
        !toTheRight && direction === 'implode') {
        return 'start';
      } else if(toTheRight && direction === 'implode' ||
        !toTheRight && direction === 'explode') {
        return 'end';
      } else {
        return 'middle';
      }
    }

    /**
     * Creates the pie chart
     *
     * @param options
     */
    function createChart(options) {
      var seriesGroups = [],
        chartRect,
        radius,
        labelRadius,
        totalDataSum,
        startAngle = options.startAngle,
        dataArray = Chartist.getDataArray(this.data);

      // Create SVG.js draw
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);
      // Calculate charting rect
      chartRect = Chartist.createChartRect(this.svg, options, 0, 0);
      // Get biggest circle radius possible within chartRect
      radius = Math.min(chartRect.width() / 2, chartRect.height() / 2);
      // Calculate total of all series to get reference value or use total reference from optional options
      totalDataSum = options.total || dataArray.reduce(function(previousValue, currentValue) {
        return previousValue + currentValue;
      }, 0);

      // If this is a donut chart we need to adjust our radius to enable strokes to be drawn inside
      // Unfortunately this is not possible with the current SVG Spec
      // See this proposal for more details: http://lists.w3.org/Archives/Public/www-svg/2003Oct/0000.html
      radius -= options.donut ? options.donutWidth / 2  : 0;

      // If a donut chart then the label position is at the radius, if regular pie chart it's half of the radius
      // see https://github.com/gionkunz/chartist-js/issues/21
      labelRadius = options.donut ? radius : radius / 2;
      // Add the offset to the labelRadius where a negative offset means closed to the center of the chart
      labelRadius += options.labelOffset;

      // Calculate end angle based on total sum and current data value and offset with padding
      var center = {
        x: chartRect.x1 + chartRect.width() / 2,
        y: chartRect.y2 + chartRect.height() / 2
      };

      // Check if there is only one non-zero value in the series array.
      var hasSingleValInSeries = this.data.series.filter(function(val) {
        return val !== 0;
      }).length === 1;

      // Draw the series
      // initialize series groups
      for (var i = 0; i < this.data.series.length; i++) {
        seriesGroups[i] = this.svg.elem('g', null, null, true);

        // If the series is an object and contains a name we add a custom attribute
        if(this.data.series[i].name) {
          seriesGroups[i].attr({
            'series-name': this.data.series[i].name,
            'meta': Chartist.serialize(this.data.series[i].meta)
          }, Chartist.xmlNs.uri);
        }

        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (this.data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        var endAngle = startAngle + dataArray[i] / totalDataSum * 360;
        // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
        // with Z and use 359.99 degrees
        if(endAngle - startAngle === 360) {
          endAngle -= 0.01;
        }

        var start = Chartist.polarToCartesian(center.x, center.y, radius, startAngle - (i === 0 || hasSingleValInSeries ? 0 : 0.2)),
          end = Chartist.polarToCartesian(center.x, center.y, radius, endAngle),
          arcSweep = endAngle - startAngle <= 180 ? '0' : '1',
          d = [
            // Start at the end point from the cartesian coordinates
            'M', end.x, end.y,
            // Draw arc
            'A', radius, radius, 0, arcSweep, 0, start.x, start.y
          ];

        // If regular pie chart (no donut) we add a line to the center of the circle for completing the pie
        if(options.donut === false) {
          d.push('L', center.x, center.y);
        }

        // Create the SVG path
        // If this is a donut chart we add the donut class, otherwise just a regular slice
        var path = seriesGroups[i].elem('path', {
          d: d.join(' ')
        }, options.classNames.slice + (options.donut ? ' ' + options.classNames.donut : ''));

        // Adding the pie series value to the path
        path.attr({
          'value': dataArray[i]
        }, Chartist.xmlNs.uri);

        // If this is a donut, we add the stroke-width as style attribute
        if(options.donut === true) {
          path.attr({
            'style': 'stroke-width: ' + (+options.donutWidth) + 'px'
          });
        }

        // Fire off draw event
        this.eventEmitter.emit('draw', {
          type: 'slice',
          value: dataArray[i],
          totalDataSum: totalDataSum,
          index: i,
          group: seriesGroups[i],
          element: path,
          center: center,
          radius: radius,
          startAngle: startAngle,
          endAngle: endAngle
        });

        // If we need to show labels we need to add the label for this slice now
        if(options.showLabel) {
          // Position at the labelRadius distance from center and between start and end angle
          var labelPosition = Chartist.polarToCartesian(center.x, center.y, labelRadius, startAngle + (endAngle - startAngle) / 2),
            interpolatedValue = options.labelInterpolationFnc(this.data.labels ? this.data.labels[i] : dataArray[i], i);

          var labelElement = seriesGroups[i].elem('text', {
            dx: labelPosition.x,
            dy: labelPosition.y,
            'text-anchor': determineAnchorPosition(center, labelPosition, options.labelDirection)
          }, options.classNames.label).text('' + interpolatedValue);

          // Fire off draw event
          this.eventEmitter.emit('draw', {
            type: 'label',
            index: i,
            group: seriesGroups[i],
            element: labelElement,
            text: '' + interpolatedValue,
            x: labelPosition.x,
            y: labelPosition.y
          });
        }

        // Set next startAngle to current endAngle. Use slight offset so there are no transparent hairline issues
        // (except for last slice)
        startAngle = endAngle;
      }

      this.eventEmitter.emit('created', {
        chartRect: chartRect,
        svg: this.svg,
        options: options
      });
    }

    /**
     * This method creates a new pie chart and returns an object that can be used to redraw the chart.
     *
     * @memberof Chartist.Pie
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object in the pie chart needs to have a series property with a one dimensional data array. The values will be normalized against each other and don't necessarily need to be in percentage. The series property can also be an array of objects that contain a data property with the value and a className property to override the CSS class name for the series group.
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object with a version and an update method to manually redraw the chart
     *
     * @example
     * // Simple pie chart example with four series
     * new Chartist.Pie('.ct-chart', {
     *   series: [10, 2, 4, 3]
     * });
     *
     * @example
     * // Drawing a donut chart
     * new Chartist.Pie('.ct-chart', {
     *   series: [10, 2, 4, 3]
     * }, {
     *   donut: true
     * });
     *
     * @example
     * // Using donut, startAngle and total to draw a gauge chart
     * new Chartist.Pie('.ct-chart', {
     *   series: [20, 10, 30, 40]
     * }, {
     *   donut: true,
     *   donutWidth: 20,
     *   startAngle: 270,
     *   total: 200
     * });
     *
     * @example
     * // Drawing a pie chart with padding and labels that are outside the pie
     * new Chartist.Pie('.ct-chart', {
     *   series: [20, 10, 30, 40]
     * }, {
     *   chartPadding: 30,
     *   labelOffset: 50,
     *   labelDirection: 'explode'
     * });
     *
     * @example
     * // Overriding the class names for individual series
     * new Chartist.Pie('.ct-chart', {
     *   series: [{
     *     data: 20,
     *     className: 'my-custom-class-one'
     *   }, {
     *     data: 10,
     *     className: 'my-custom-class-two'
     *   }, {
     *     data: 70,
     *     className: 'my-custom-class-three'
     *   }]
     * });
     */
    function Pie(query, data, options, responsiveOptions) {
      Chartist.Pie.super.constructor.call(this,
        query,
        data,
        Chartist.extend({}, defaultOptions, options),
        responsiveOptions);
    }

    // Creating pie chart type in Chartist namespace
    Chartist.Pie = Chartist.Base.extend({
      constructor: Pie,
      createChart: createChart,
      determineAnchorPosition: determineAnchorPosition
    });

  }(window, document, Chartist));

  return Chartist;

}));
