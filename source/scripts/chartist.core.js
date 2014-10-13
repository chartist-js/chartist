/**
 * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
 *
 * @module Chartist.Core
 */
var Chartist = {};
Chartist.version = '0.2.2';

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

}(window, document, Chartist));