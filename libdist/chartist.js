(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['Chartist'] = factory();
    }
}(this, function() {

  /* Chartist.js 0.2.4
   * Copyright © 2014 Gion Kunz
   * Free to use under the WTFPL license.
   * http://www.wtfpl.net/
   */
  /**
   * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
   *
   * @module Chartist.Core
   */
  var Chartist = {};
  Chartist.version = '0.2.4';

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

    // TODO: Make it possible to call extend with var args
    /**
     * Simple recursive object extend
     *
     * @memberof Chartist.Core
     * @param {Object} target Target object where the source will be merged into
     * @param {Object} source This object will be merged into target and then target is returned
     * @return {Object} An object that has the same reference as target but is extended and merged with the properties of source
     */
    Chartist.extend = function (target, source) {
      target = target || {};
      for (var prop in source) {
        if (typeof source[prop] === 'object') {
          target[prop] = Chartist.extend(target[prop], source[prop]);
        } else {
          target[prop] = source[prop];
        }
      }
      return target;
    };

    /**
     * Converts a string to a number while removing the unit px if present. If a number is passed then this will be returned unmodified.
     *
     * @param {String|Number} length
     * @returns {Number} Returns the pixel as number or NaN if the passed length could not be converted to pixel
     */
    Chartist.getPixelLength = function(length) {
      if(typeof length === 'string') {
        length = length.replace(/px/i, '');
      }

      return +length;
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

      // If already contains our svg object we clear it, set width / height and return
      if (container.chartistSvg !== undefined) {
        svg = container.chartistSvg.attr({
          width: width,
          height: height
        }).removeAllClasses().addClass(className).attr({
          style: 'width: ' + width + '; height: ' + height + ';'
        });
        // Clear the draw if its already used before so we start fresh
        svg.empty();

      } else {
        // Create svg object with width and height or use 100% as default
        svg = Chartist.Svg('svg').attr({
          width: width,
          height: height
        }).addClass(className).attr({
          style: 'width: ' + width + '; height: ' + height + ';'
        });

        // Add the DOM node to our container
        container.appendChild(svg._node);
        container.chartistSvg = svg;
      }

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
      var array = [];

      for (var i = 0; i < data.series.length; i++) {
        // If the series array contains an object with a data property we will use the property
        // otherwise the value directly (array or number)
        array[i] = typeof(data.series[i]) === 'object' && data.series[i].data !== undefined ?
          data.series[i].data : data.series[i];
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
      return svg.height() - (options.chartPadding * 2) - options.axisX.offset;
    };

    /**
     * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
     *
     * @memberof Chartist.Core
     * @param {Array} dataArray The array that contains the data to be visualized in the chart
     * @return {Array} The array that contains the highest and lowest value that will be visualized on the chart.
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

    // Find the highest and lowest values in a two dimensional array and calculate scale based on order of magnitude
    /**
     * Calculate and retrieve all the bounds for the chart and return them in one array
     *
     * @memberof Chartist.Core
     * @param {Object} svg The svg element for the chart
     * @param {Array} normalizedData The array that got updated with missing values.
     * @param {Object} options The Object that contains all the optional values for the chart
     * @param {Number} referenceValue The reference value for the chart.
     * @return {Object} All the values to set the bounds of the chart
     */
    Chartist.getBounds = function (svg, normalizedData, options, referenceValue) {
      var i,
        newMin,
        newMax,
        bounds = Chartist.getHighLow(normalizedData);

      // Overrides of high / low from settings
      bounds.high = options.high || (options.high === 0 ? 0 : bounds.high);
      bounds.low = options.low || (options.low === 0 ? 0 : bounds.low);

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
      while (true) {
        var length = Chartist.projectLength(svg, bounds.step / 2, bounds, options);
        if (length >= options.axisY.scaleMinSpace) {
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

        if (i - bounds.step > bounds.high) {
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
     * Calculate the needed offset to fit in the labels
     *
     * @memberof Chartist.Core
     * @param {Object} svg The svg element for the chart
     * @param {Array} data The array that contains the data to be visualized in the chart
     * @param {Object} labelClass All css classes of the label
     * @param {Function} labelInterpolationFnc The function that interpolates the label value
     * @param {String} offsetFnc width or height. Will be used to call function on SVG element to get length
     * @return {Number} The number that represents the label offset in pixels
     */
    Chartist.calculateLabelOffset = function (svg, data, labelClass, labelInterpolationFnc, offsetFnc) {
      var offset = 0;
      for (var i = 0; i < data.length; i++) {
        // If interpolation function returns falsy value we skipp this label
        var interpolated = labelInterpolationFnc(data[i], i);
        if (!interpolated && interpolated !== 0) {
          continue;
        }

        var label = svg.elem('text', {
          dx: 0,
          dy: 0
        }, labelClass).text('' + interpolated);

        // Check if this is the largest label and update offset
        offset = Math.max(offset, label[offsetFnc]());
        // Remove label after offset Calculation
        label.remove();
      }

      return offset;
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
     * @param {Number} xAxisOffset The offset of the x-axis to the border of the svg element
     * @param {Number} yAxisOffset The offset of the y-axis to the border of the svg element
     * @return {Object} The chart rectangles coordinates inside the svg element plus the rectangles measurements
     */
    Chartist.createChartRect = function (svg, options, xAxisOffset, yAxisOffset) {
      return {
        x1: options.chartPadding + yAxisOffset,
        y1: (Chartist.getPixelLength(options.height) || svg.height()) - options.chartPadding - xAxisOffset,
        x2: (Chartist.getPixelLength(options.width) || svg.width()) - options.chartPadding,
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
     * Generate grid lines and labels for the x-axis into grid and labels group SVG elements
     *
     * @memberof Chartist.Core
     * @param {Object} chartRect The rectangle that sets the bounds for the chart in the svg element
     * @param {Object} data The Object that contains the data to be visualized in the chart
     * @param {Object} grid Chartist.Svg wrapper object to be filled with the grid lines of the chart
     * @param {Object} labels Chartist.Svg wrapper object to be filled with the lables of the chart
     * @param {Object} options The Object that contains all the optional values for the chart
     */
    Chartist.createXAxis = function (chartRect, data, grid, labels, options, eventEmitter) {
      // Create X-Axis
      data.labels.forEach(function (value, index) {
        var interpolatedValue = options.axisX.labelInterpolationFnc(value, index),
          space = chartRect.width() / data.labels.length,
          pos = chartRect.x1 + space * index;

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
          // Use config offset for setting labels of
          var labelPos = {
            x: pos + 2,
            y: 0
          };

          var labelElement = labels.elem('text', {
            dx: labelPos.x
          }, [options.classNames.label, options.classNames.horizontal].join(' ')).text('' + interpolatedValue);

          // TODO: should use 'alignment-baseline': 'hanging' but not supported in firefox. Instead using calculated height to offset y pos
          labelPos.y = chartRect.y1 + labelElement.height() + options.axisX.offset;
          labelElement.attr({
            dy: labelPos.y
          });

          eventEmitter.emit('draw', {
            type: 'label',
            axis: 'x',
            index: index,
            group: labels,
            element: labelElement,
            text: '' + interpolatedValue,
            x: labelPos.x,
            y: labelPos.y,
            space: space
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
     * @param {Number} offset Offset for the y-axis
     * @param {Object} options The Object that contains all the optional values for the chart
     */
    Chartist.createYAxis = function (chartRect, bounds, grid, labels, offset, options, eventEmitter) {
      // Create Y-Axis
      bounds.values.forEach(function (value, index) {
        var interpolatedValue = options.axisY.labelInterpolationFnc(value, index),
          space = chartRect.height() / bounds.values.length,
          pos = chartRect.y1 - space * index;

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
          // Use calculated offset and include padding for label x position
          // TODO: Review together with possibilities to style labels. Maybe we should start using fixed label width which is easier and also makes multi line labels with foreignObjects easier
          var labelPos = {
            x: options.axisY.labelAlign === 'right' ? offset - options.axisY.offset + options.chartPadding : options.chartPadding,
            y: pos - 2
          };

          var labelElement = labels.elem('text', {
            dx: options.axisY.labelAlign === 'right' ? offset - options.axisY.offset + options.chartPadding : options.chartPadding,
            dy: pos - 2,
            'text-anchor': options.axisY.labelAlign === 'right' ? 'end' : 'start'
          }, [options.classNames.label, options.classNames.vertical].join(' ')).text('' + interpolatedValue);

          eventEmitter.emit('draw', {
            type: 'label',
            axis: 'y',
            index: index,
            group: labels,
            element: labelElement,
            text: '' + interpolatedValue,
            x: labelPos.x,
            y: labelPos.y,
            space: space
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
     * @return {Object} The coordinates object of the current project point containing an x and y number property
     */
    Chartist.projectPoint = function (chartRect, bounds, data, index) {
      return {
        x: chartRect.x1 + chartRect.width() / data.length * index,
        y: chartRect.y1 - chartRect.height() * (data[index] - bounds.min) / (bounds.range + bounds.step)
      };
    };

    // TODO: With multiple media queries the handleMediaChange function is triggered too many times, only need one
    /**
     * Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
     *
     * @memberof Chartist.Core
     * @param {Object} defaultOptions Default options from Chartist
     * @param {Object} options Options set by user
     * @param {Array} responsiveOptions Optional functions to add responsive behavior to chart
     * @param {Object} eventEmitter The event emitter that will be used to emit the options changed events
     * @return {Object} The consolidated options object from the defaults, base and matching responsive options
     */
    Chartist.optionsProvider = function (defaultOptions, options, responsiveOptions, eventEmitter) {
      var baseOptions = Chartist.extend(Chartist.extend({}, defaultOptions), options),
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

  }(window, document, Chartist));;/**
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
      }

      return {
        addEventHandler: addEventHandler,
        removeEventHandler: removeEventHandler,
        emit: emit
      };
    };

  }(window, document, Chartist));;/**
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
     * console.log('bananas\'s prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
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
     * console.log('bananas\'s prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
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
     * console.log('bananas\'s prototype is Fruit', Object.getPrototypeOf(banana) === Fruit.prototype);
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

  }(window, document, Chartist));;/**
   * Base for all chart classes.
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
     * @memberof Chartist.Line
     */
    function update() {
      this.createChart(this.optionsProvider.currentOptions);
    }

    /**
     * This method can be called on the API object of each chart and will un-register all event listeners that were added to other components. This currently includes a window.resize listener as well as media query listeners if any responsive options have been provided. Use this function if you need to destroy and recreate Chartist charts dynamically.
     *
     * @memberof Chartist.Line
     */
    function detach() {
      window.removeEventListener('resize', this.update);
      this.optionsProvider.removeMediaQueryListeners();
    }

    /**
     * Use this function to register event handlers. The handler callbacks are synchronous and will run in the main thread rather than the event loop.
     *
     * @memberof Chartist.Line
     * @param {String} event Name of the event. Check the examples for supported events.
     * @param {Function} handler The handler function that will be called when an event with the given name was emitted. This function will receive a data argument which contains event data. See the example for more details.
     */
    function on(event, handler) {
      this.eventEmitter.addEventHandler(event, handler);
    }

    /**
     * Use this function to un-register event handlers. If the handler function parameter is omitted all handlers for the given event will be un-registered.
     *
     * @memberof Chartist.Line
     * @param {String} event Name of the event for which a handler should be removed
     * @param {Function} [handler] The handler function that that was previously used to register a new event handler. This handler will be removed from the event handler list. If this parameter is omitted then all event handlers for the given event are removed from the list.
     */
    function off(event, handler) {
      this.eventEmitter.removeEventHandler(event, handler);
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

      window.addEventListener('resize', this.update.bind(this));

      // Using event loop for first draw to make it possible to register event listeners in the same call stack where
      // the chart was created.
      setTimeout(function() {
        // Obtain current options based on matching media queries (if responsive options are given)
        // This will also register a listener that is re-creating the chart based on media changes
        // TODO: Remove default options parameter from optionsProvider
        this.optionsProvider = Chartist.optionsProvider({}, this.options, this.responsiveOptions, this.eventEmitter);
        this.createChart(this.optionsProvider.currentOptions);
      }.bind(this), 0);
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
      version: Chartist.version
    });

  }(window, document, Chartist));;/**
   * Chartist SVG module for simple SVG DOM abstraction
   *
   * @module Chartist.Svg
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    Chartist.xmlNs = {
      qualifiedName: 'xmlns:ct',
      prefix: 'ct',
      uri: 'http://gionkunz.github.com/chartist-js/ct'
    };

    /**
     * Chartist.Svg creates a new SVG object wrapper with a starting element. You can use the wrapper to fluently create sub-elements and modify them.
     *
     * @memberof Chartist.Svg
     * @param {String} name The name of the SVG element to create
     * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} className This class or class list will be added to the SVG element
     * @param {Object} parent The parent SVG wrapper object where this newly created wrapper and it's element will be attached to as child
     * @param {Boolean} insertFirst If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
     * @returns {Object} Returns a Chartist.Svg wrapper object that can be used to modify the containing SVG data
     */
    Chartist.Svg = function(name, attributes, className, parent, insertFirst) {

      var svgNs = 'http://www.w3.org/2000/svg',
        xmlNs = 'http://www.w3.org/2000/xmlns/',
        xhtmlNs = 'http://www.w3.org/1999/xhtml';

      /**
       * Set attributes on the current SVG element of the wrapper you're currently working on.
       *
       * @memberof Chartist.Svg
       * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
       * @param {String} ns If specified, the attributes will be set as namespace attributes with ns as prefix.
       * @returns {Object} The current wrapper object will be returned so it can be used for chaining.
       */
      function attr(node, attributes, ns) {
        Object.keys(attributes).forEach(function(key) {
          // If the attribute value is undefined we can skip this one
          if(attributes[key] === undefined) {
            return;
          }

          if(ns) {
            node.setAttributeNS(ns, [Chartist.xmlNs.prefix, ':', key].join(''), attributes[key]);
          } else {
            node.setAttribute(key, attributes[key]);
          }
        });

        return node;
      }

      /**
       * Create a new SVG element whose wrapper object will be selected for further operations. This way you can also create nested groups easily.
       *
       * @memberof Chartist.Svg
       * @param {String} name The name of the SVG element that should be created as child element of the currently selected element wrapper
       * @param {Object} [attributes] An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
       * @param {String} [className] This class or class list will be added to the SVG element
       * @param {Boolean} [insertFirst] If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
       * @returns {Object} Returns a Chartist.Svg wrapper object that can be used to modify the containing SVG data
       */
      function elem(name, attributes, className, parentNode, insertFirst) {
        var node = document.createElementNS(svgNs, name);

        // If this is an SVG element created then custom namespace
        if(name === 'svg') {
          node.setAttributeNS(xmlNs, Chartist.xmlNs.qualifiedName, Chartist.xmlNs.uri);
        }

        if(parentNode) {
          if(insertFirst && parentNode.firstChild) {
            parentNode.insertBefore(node, parentNode.firstChild);
          } else {
            parentNode.appendChild(node);
          }
        }

        if(attributes) {
          attr(node, attributes);
        }

        if(className) {
          addClass(node, className);
        }

        return node;
      }

      /**
       * This method creates a foreignObject (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) that allows to embed HTML content into a SVG graphic. With the help of foreignObjects you can enable the usage of regular HTML elements inside of SVG where they are subject for SVG positioning and transformation but the Browser will use the HTML rendering capabilities for the containing DOM.
       *
       * @memberof Chartist.Svg
       * @param {Node|String} content The DOM Node, or HTML string that will be converted to a DOM Node, that is then placed into and wrapped by the foreignObject
       * @param {String} [x] The X position where the foreignObject will be placed relative to the next higher ViewBox
       * @param {String} [y] The Y position where the foreignObject will be placed relative to the next higher ViewBox
       * @param {String} [width] The width of the foreignElement
       * @param {String} [height] The height of the foreignElement
       * @param {String} [className] This class or class list will be added to the SVG element
       * @param {Boolean} [insertFirst] Specifies if the foreignObject should be inserted as first child
       * @returns {Object} New wrapper object that wraps the foreignObject element
       */
      function foreignObject(content, x, y, width, height, className, parent, insertFirst) {
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
        var fnObj = Chartist.Svg('foreignObject', {
          x: x,
          y: y,
          width: width,
          height: height
        }, className, parent, insertFirst);

        // Add content to foreignObjectElement
        fnObj._node.appendChild(content);

        return fnObj;
      }

      /**
       * This method adds a new text element to the current Chartist.Svg wrapper.
       *
       * @memberof Chartist.Svg
       * @param {String} t The text that should be added to the text element that is created
       * @returns {Object} The same wrapper object that was used to add the newly created element
       */
      function text(node, t) {
        node.appendChild(document.createTextNode(t));
      }

      /**
       * This method will clear all child nodes of the current wrapper object.
       *
       * @memberof Chartist.Svg
       * @returns {Object} The same wrapper object that got emptied
       */
      function empty(node) {
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
      }

      /**
       * This method will cause the current wrapper to remove itself from its parent wrapper. Use this method if you'd like to get rid of an element in a given DOM structure.
       *
       * @memberof Chartist.Svg
       * @returns {Object} The parent wrapper object of the element that got removed
       */
      function remove(node) {
        node.parentNode.removeChild(node);
      }

      /**
       * This method will replace the element with a new element that can be created outside of the current DOM.
       *
       * @memberof Chartist.Svg
       * @param {Object} newElement The new wrapper object that will be used to replace the current wrapper object
       * @returns {Object} The wrapper of the new element
       */
      function replace(node, newChild) {
        node.parentNode.replaceChild(newChild, node);
      }

      /**
       * This method will append an element to the current element as a child.
       *
       * @memberof Chartist.Svg
       * @param {Object} element The element that should be added as a child
       * @param {Boolean} [insertFirst] Specifies if the element should be inserted as first child
       * @returns {Object} The wrapper of the appended object
       */
      function append(node, child, insertFirst) {
        if(insertFirst && node.firstChild) {
          node.insertBefore(child, node.firstChild);
        } else {
          node.appendChild(child);
        }
      }

      /**
       * Returns an array of class names that are attached to the current wrapper element. This method can not be chained further.
       *
       * @memberof Chartist.Svg
       * @returns {Array} A list of classes or an empty array if there are no classes on the current element
       */
      function classes(node) {
        return node.getAttribute('class') ? node.getAttribute('class').trim().split(/\s+/) : [];
      }

      /**
       * Adds one or a space separated list of classes to the current element and ensures the classes are only existing once.
       *
       * @memberof Chartist.Svg
       * @param {String} names A white space separated list of class names
       * @returns {Object} The wrapper of the current element
       */
      function addClass(node, names) {
        node.setAttribute('class',
          classes(node)
            .concat(names.trim().split(/\s+/))
            .filter(function(elem, pos, self) {
              return self.indexOf(elem) === pos;
            }).join(' ')
        );
      }

      /**
       * Removes one or a space separated list of classes from the current element.
       *
       * @memberof Chartist.Svg
       * @param {String} names A white space separated list of class names
       * @returns {Object} The wrapper of the current element
       */
      function removeClass(node, names) {
        var removedClasses = names.trim().split(/\s+/);

        node.setAttribute('class', classes(node).filter(function(name) {
          return removedClasses.indexOf(name) === -1;
        }).join(' '));
      }

      /**
       * Removes all classes from the current element.
       *
       * @memberof Chartist.Svg
       * @returns {Object} The wrapper of the current element
       */
      function removeAllClasses(node) {
        node.setAttribute('class', '');
      }

      /**
       * Get element height with fallback to svg BoundingBox or parent container dimensions:
       * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
       *
       * @memberof Chartist.Svg
       * @return {Number} The elements height in pixels
       */
      function height(node) {
        return node.clientHeight || Math.round(node.getBBox().height) || node.parentNode.clientHeight;
      }

      /**
       * Get element width with fallback to svg BoundingBox or parent container dimensions:
       * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
       *
       * @memberof Chartist.Core
       * @return {Number} The elements width in pixels
       */
      function width(node) {
        return node.clientWidth || Math.round(node.getBBox().width) || node.parentNode.clientWidth;
      }

      return {
        _node: elem(name, attributes, className, parent ? parent._node : undefined, insertFirst),
        _parent: parent,
        parent: function() {
          return this._parent;
        },
        attr: function(attributes, ns) {
          attr(this._node, attributes, ns);
          return this;
        },
        empty: function() {
          empty(this._node);
          return this;
        },
        remove: function() {
          remove(this._node);
          return this.parent();
        },
        replace: function(newElement) {
          newElement._parent = this._parent;
          replace(this._node, newElement._node);
          return newElement;
        },
        append: function(element, insertFirst) {
          element._parent = this;
          append(this._node, element._node, insertFirst);
          return element;
        },
        elem: function(name, attributes, className, insertFirst) {
          return Chartist.Svg(name, attributes, className, this, insertFirst);
        },
        foreignObject: function(content, x, y, width, height, className, insertFirst) {
          return foreignObject(content, x, y, width, height, className, this, insertFirst);
        },
        text: function(t) {
          text(this._node, t);
          return this;
        },
        addClass: function(names) {
          addClass(this._node, names);
          return this;
        },
        removeClass: function(names) {
          removeClass(this._node, names);
          return this;
        },
        removeAllClasses: function() {
          removeAllClasses(this._node);
          return this;
        },
        classes: function() {
          return classes(this._node);
        },
        height: function() {
          return height(this._node);
        },
        width: function() {
          return width(this._node);
        }
      };
    };

  }(window, document, Chartist));;/**
   * The Chartist line chart can be used to draw Line or Scatter charts. If used in the browser you can access the global `Chartist` namespace where you find the `Line` function as a main entry point.
   *
   * For examples on how to use the line chart please check the examples of the `Chartist.Line` method.
   *
   * @module Chartist.Line
   */
  /* global Chartist */
  (function(window, document, Chartist){
    'use strict';

    var defaultOptions = {
      axisX: {
        offset: 10,
        showLabel: true,
        showGrid: true,
        labelInterpolationFnc: Chartist.noop
      },
      axisY: {
        offset: 15,
        showLabel: true,
        showGrid: true,
        labelAlign: 'right',
        labelInterpolationFnc: Chartist.noop,
        scaleMinSpace: 30
      },
      width: undefined,
      height: undefined,
      showLine: true,
      showPoint: true,
      showArea: false,
      areaBase: 0,
      lineSmooth: true,
      low: undefined,
      high: undefined,
      chartPadding: 5,
      classNames: {
        chart: 'ct-chart-line',
        label: 'ct-label',
        series: 'ct-series',
        line: 'ct-line',
        point: 'ct-point',
        area: 'ct-area',
        grid: 'ct-grid',
        vertical: 'ct-vertical',
        horizontal: 'ct-horizontal'
      }
    };

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length);

      // Create new svg object
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

      // initialize bounds
      bounds = Chartist.getBounds(this.svg, normalizedData, options);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          this.svg,
          this.data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          'height'
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          this.svg,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          'width'
        );
      }

      var chartRect = Chartist.createChartRect(this.svg, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = this.svg.elem('g'),
        grid = this.svg.elem('g');

      Chartist.createXAxis(chartRect, this.data, grid, labels, options, this.eventEmitter);
      Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options, this.eventEmitter);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < this.data.series.length; i++) {
        seriesGroups[i] = this.svg.elem('g');

        // If the series is an object and contains a name we add a custom attribute
        if(this.data.series[i].name) {
          seriesGroups[i].attr({
            'series-name': this.data.series[i].name
          }, Chartist.xmlNs.uri);
        }

        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (this.data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        var p,
          pathCoordinates = [],
          point;

        for (var j = 0; j < normalizedData[i].length; j++) {
          p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j);
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
              'value': normalizedData[i][j]
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

          if(options.showArea) {
            // If areaBase is outside the chart area (< low or > high) we need to set it respectively so that
            // the area is not drawn outside the chart area.
            var areaBase = Math.max(Math.min(options.areaBase, bounds.high), bounds.low);

            // If we need to draw area shapes we just make a copy of our pathElements SVG path array
            var areaPathElements = pathElements.slice();

            // We project the areaBase value into screen coordinates
            var areaBaseProjected = Chartist.projectPoint(chartRect, bounds, [areaBase], 0);
            // And splice our new area path array to add the missing path elements to close the area shape
            areaPathElements.splice(0, 0, 'M' + areaBaseProjected.x + ',' + areaBaseProjected.y);
            areaPathElements[1] = 'L' + pathCoordinates[0] + ',' + pathCoordinates[1];
            areaPathElements.push('L' + pathCoordinates[pathCoordinates.length - 2] + ',' + areaBaseProjected.y);

            // Create the new path for the area shape with the area class from the options
            seriesGroups[i].elem('path', {
              d: areaPathElements.join('')
            }, options.classNames.area, true).attr({
              'values': normalizedData[i]
            }, Chartist.xmlNs.uri);
          }

          if(options.showLine) {
            seriesGroups[i].elem('path', {
              d: pathElements.join('')
            }, options.classNames.line, true).attr({
              'values': normalizedData[i]
            }, Chartist.xmlNs.uri);
          }
        }
      }
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
     * // These are the default options of the line chart
     * var options = {
     *   // Options for X-Axis
     *   axisX: {
     *     // The offset of the labels to the chart area
     *     offset: 10,
     *     // If labels should be shown or not
     *     showLabel: true,
     *     // If the axis grid should be drawn or not
     *     showGrid: true,
     *     // Interpolation function that allows you to intercept the value from the axis label
     *     labelInterpolationFnc: function(value){return value;}
     *   },
     *   // Options for Y-Axis
     *   axisY: {
     *     // The offset of the labels to the chart area
     *     offset: 15,
     *     // If labels should be shown or not
     *     showLabel: true,
     *     // If the axis grid should be drawn or not
     *     showGrid: true,
     *     // For the Y-Axis you can set a label alignment property of right or left
     *     labelAlign: 'right',
     *     // Interpolation function that allows you to intercept the value from the axis label
     *     labelInterpolationFnc: function(value){return value;},
     *     // This value specifies the minimum height in pixel of the scale steps
     *     scaleMinSpace: 30
     *   },
     *   // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
     *   width: undefined,
     *   // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
     *   height: undefined,
     *   // If the line should be drawn or not
     *   showLine: true,
     *   // If dots should be drawn or not
     *   showPoint: true,
     *   // If the line chart should draw an area
     *   showArea: false,
     *   // The base for the area chart that will be used to close the area shape (is normally 0)
     *   areaBase: 0,
     *   // Specify if the lines should be smoothed (Catmull-Rom-Splines will be used)
     *   lineSmooth: true,
     *   // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
     *   low: undefined,
     *   // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
     *   high: undefined,
     *   // Padding of the chart drawing area to the container element and labels
     *   chartPadding: 5,
     *   // Override the class names that get used to generate the SVG structure of the chart
     *   classNames: {
     *     chart: 'ct-chart-line',
     *     label: 'ct-label',
     *     series: 'ct-series',
     *     line: 'ct-line',
     *     point: 'ct-point',
     *     area: 'ct-area',
     *     grid: 'ct-grid',
     *     vertical: 'ct-vertical',
     *     horizontal: 'ct-horizontal'
     *   }
     * };
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
        Chartist.extend(Chartist.extend({}, defaultOptions), options),
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

    var defaultOptions = {
      axisX: {
        offset: 10,
        showLabel: true,
        showGrid: true,
        labelInterpolationFnc: Chartist.noop
      },
      axisY: {
        offset: 15,
        showLabel: true,
        showGrid: true,
        labelAlign: 'right',
        labelInterpolationFnc: Chartist.noop,
        scaleMinSpace: 40
      },
      width: undefined,
      height: undefined,
      high: undefined,
      low: undefined,
      chartPadding: 5,
      seriesBarDistance: 15,
      classNames: {
        chart: 'ct-chart-bar',
        label: 'ct-label',
        series: 'ct-series',
        bar: 'ct-bar',
        thin: 'ct-thin',
        thick: 'ct-thick',
        grid: 'ct-grid',
        vertical: 'ct-vertical',
        horizontal: 'ct-horizontal'
      }
    };

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length);

      // Create new svg element
      this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

      // initialize bounds
      bounds = Chartist.getBounds(this.svg, normalizedData, options, 0);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          this.svg,
          this.data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          'height'
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          this.svg,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          'width'
        );
      }

      var chartRect = Chartist.createChartRect(this.svg, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = this.svg.elem('g'),
        grid = this.svg.elem('g'),
      // Projected 0 point
        zeroPoint = Chartist.projectPoint(chartRect, bounds, [0], 0);

      Chartist.createXAxis(chartRect, this.data, grid, labels, options, this.eventEmitter);
      Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options, this.eventEmitter);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < this.data.series.length; i++) {
        // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
        var biPol = i - (this.data.series.length - 1) / 2,
        // Half of the period with between vertical grid lines used to position bars
          periodHalfWidth = chartRect.width() / normalizedData[i].length / 2;

        seriesGroups[i] = this.svg.elem('g');

        // If the series is an object and contains a name we add a custom attribute
        if(this.data.series[i].name) {
          seriesGroups[i].attr({
            'series-name': this.data.series[i].name
          }, Chartist.xmlNs.uri);
        }

        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (this.data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        for(var j = 0; j < normalizedData[i].length; j++) {
          var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j),
            bar;

          // Offset to center bar between grid lines and using bi-polar offset for multiple series
          // TODO: Check if we should really be able to add classes to the series. Should be handles with Sass and semantic / specific selectors
          p.x += periodHalfWidth + (biPol * options.seriesBarDistance);

          bar = seriesGroups[i].elem('line', {
            x1: p.x,
            y1: zeroPoint.y,
            x2: p.x,
            y2: p.y
          }, options.classNames.bar).attr({
            'value': normalizedData[i][j]
          }, Chartist.xmlNs.uri);

          this.eventEmitter.emit('draw', {
            type: 'bar',
            value: normalizedData[i][j],
            index: j,
            group: seriesGroups[i],
            element: bar,
            x1: p.x,
            y1: zeroPoint.y,
            x2: p.x,
            y2: p.y
          });
        }
      }
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
     * // These are the default options of the line chart
     * var options = {
     *   // Options for X-Axis
     *   axisX: {
     *     // The offset of the labels to the chart area
     *     offset: 10,
     *     // If labels should be shown or not
     *     showLabel: true,
     *     // If the axis grid should be drawn or not
     *     showGrid: true,
     *     // Interpolation function that allows you to intercept the value from the axis label
     *     labelInterpolationFnc: function(value){return value;}
     *   },
     *   // Options for Y-Axis
     *   axisY: {
     *     // The offset of the labels to the chart area
     *     offset: 15,
     *     // If labels should be shown or not
     *     showLabel: true,
     *     // If the axis grid should be drawn or not
     *     showGrid: true,
     *     // For the Y-Axis you can set a label alignment property of right or left
     *     labelAlign: 'right',
     *     // Interpolation function that allows you to intercept the value from the axis label
     *     labelInterpolationFnc: function(value){return value;},
     *     // This value specifies the minimum height in pixel of the scale steps
     *     scaleMinSpace: 30
     *   },
     *   // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
     *   width: undefined,
     *   // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
     *   height: undefined,
     *   // If the line should be drawn or not
     *   showLine: true,
     *   // If dots should be drawn or not
     *   showPoint: true,
     *   // Specify if the lines should be smoothed (Catmull-Rom-Splines will be used)
     *   lineSmooth: true,
     *   // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
     *   low: undefined,
     *   // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
     *   high: undefined,
     *   // Padding of the chart drawing area to the container element and labels
     *   chartPadding: 5,
     *   // Specify the distance in pixel of bars in a group
     *   seriesBarDistance: 15,
     *   // Override the class names that get used to generate the SVG structure of the chart
     *   classNames: {
     *     chart: 'ct-chart-bar',
     *     label: 'ct-label',
     *     series: 'ct-series',
     *     bar: 'ct-bar',
     *     point: 'ct-point',
     *     grid: 'ct-grid',
     *     vertical: 'ct-vertical',
     *     horizontal: 'ct-horizontal'
     *   }
     * };
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
     *   heigh: 10
     * });
     *
     */
    function Bar(query, data, options, responsiveOptions) {
      Chartist.Bar.super.constructor.call(this,
        query,
        data,
        Chartist.extend(Chartist.extend({}, defaultOptions), options),
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

    var defaultOptions = {
      width: undefined,
      height: undefined,
      chartPadding: 5,
      classNames: {
        chart: 'ct-chart-pie',
        series: 'ct-series',
        slice: 'ct-slice',
        donut: 'ct-donut',
        label: 'ct-label'
      },
      startAngle: 0,
      total: undefined,
      donut: false,
      donutWidth: 60,
      showLabel: true,
      labelOffset: 0,
      labelInterpolationFnc: Chartist.noop,
      labelOverflow: false,
      labelDirection: 'neutral'
    };

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
            'series-name': this.data.series[i].name
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
    }

    /**
     * This method creates a new pie chart and returns an object that can be used to redraw the chart.
     *
     * @memberof Chartist.Pie
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object in the pie chart needs to have a series property with a one dimensional data array. The values will be normalized against each other and don't necessarily need to be in percentage.
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object with a version and an update method to manually redraw the chart
     *
     * @example
     * // Default options of the pie chart
     * var defaultOptions = {
     *   // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
     *   width: undefined,
     *   // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
     *   height: undefined,
     *   // Padding of the chart drawing area to the container element and labels
     *   chartPadding: 5,
     *   // Override the class names that get used to generate the SVG structure of the chart
     *   classNames: {
     *     chart: 'ct-chart-pie',
     *     series: 'ct-series',
     *     slice: 'ct-slice',
     *     donut: 'ct-donut',
           label: 'ct-label'
     *   },
     *   // The start angle of the pie chart in degrees where 0 points north. A higher value offsets the start angle clockwise.
     *   startAngle: 0,
     *   // An optional total you can specify. By specifying a total value, the sum of the values in the series must be this total in order to draw a full pie. You can use this parameter to draw only parts of a pie or gauge charts.
     *   total: undefined,
     *   // If specified the donut CSS classes will be used and strokes will be drawn instead of pie slices.
     *   donut: false,
     *   // Specify the donut stroke width, currently done in javascript for convenience. May move to CSS styles in the future.
     *   donutWidth: 60,
     *   // If a label should be shown or not
     *   showLabel: true,
     *   // Label position offset from the standard position which is half distance of the radius. This value can be either positive or negative. Positive values will position the label away from the center.
     *   labelOffset: 0,
     *   // An interpolation function for the label value
     *   labelInterpolationFnc: function(value, index) {return value;},
     *   // Label direction can be 'neutral', 'explode' or 'implode'. The labels anchor will be positioned based on those settings as well as the fact if the labels are on the right or left side of the center of the chart. Usually explode is useful when labels are positioned far away from the center.
     *   labelDirection: 'neutral'
     * };
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
     */
    function Pie(query, data, options, responsiveOptions) {
      Chartist.Pie.super.constructor.call(this,
        query,
        data,
        Chartist.extend(Chartist.extend({}, defaultOptions), options),
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
