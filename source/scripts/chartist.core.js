/**
 * The core module of Chartist that is mainly providing static functions and higher level functions for chart modules.
 *
 * @module Chartist.Core
 */
var Chartist = {};
Chartist.version = '0.1.12';

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
   * @param {number} n A number from 0 to 26 that will result in a letter a-z
   * @return {string} A character from a-z based on the input number n
   */
  Chartist.alphaNumerate = function (n) {
    // Limit to a-z
    return String.fromCharCode(97 + n % 26);
  };

  /**
   * Simple recursive object extend
   *
   * @memberof Chartist.Core
   * @param {object} target Target object where the source will be merged into
   * @param {object} source This object will be merged into target and then target is returned
   * @return {object} An object that has the same reference as target but is extended and merged with the properties of source
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

  //TODO: move into Chartist.svg
  /**
   * Get element height with fallback to svg BoundingBox or parent container dimensions:
   * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
   *
   * @memberof Chartist.Core
   * @param {object} svgElement The svg element from which we want to retrieve its height
   * @return {number} The elements height in pixels
   */
  Chartist.getHeight = function (svgElement) {
    return svgElement.clientHeight || Math.round(svgElement.getBBox().height) || svgElement.parentNode.clientHeight;
  };

  //TODO: move into Chartist.svg
  /**
   * Get element width with fallback to svg BoundingBox or parent container dimensions:
   * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
   *
   * @memberof Chartist.Core
   * @param {object} svgElement The svg element from which we want to retrieve its width
   * @return {number} The elements width in pixels
   */
  Chartist.getWidth = function (svgElement) {
    return svgElement.clientWidth || Math.round(svgElement.getBBox().width) || svgElement.parentNode.clientWidth;
  };

  /**
   * Create or reinitialize the SVG element for the chart
   *
   * @memberof Chartist.Core
   * @param {string|node} query The query to select the HTML element that will serve as container or directly a DOM Node object
   * @param {string} width Set the width of the SVG element. Default is 100%
   * @param {string} height Set the height of the SVG element. Default is 100%
   * @param {string} className Specify a class to be added to the SVG element
   * @return {object} The created/reinitialized SVG element
   */
  Chartist.createSvg = function (query, width, height, className) {
    // Get dom object from query or if already dom object just use it
    var container = query.nodeType ? query : document.querySelector(query),
      svg;

    // If container was not found we throw up
    if (!container) {
      throw {
        name: 'NodeNotFoundException',
        message: 'Container node with selector "' + query + '" not found'
      };
    }

    // If already contains our svg object we clear it, set width / height and return
    if (container._ctChart !== undefined) {
      svg = container._ctChart.attr({
        width: width || '100%',
        height: height || '100%'
      }).removeAllClasses().addClass(className);
      // Clear the draw if its already used before so we start fresh
      svg.empty();

    } else {
      // Create svg object with width and height or use 100% as default
      svg = Chartist.svg('svg').attr({
        width: width || '100%',
        height: height || '100%'
      }).addClass(className);

      // Add the DOM node to our container
      container.appendChild(svg._node);
      container._ctChart = svg;
    }

    return svg;
  };

  /**
   * Convert data series into plain array
   *
   * @memberof Chartist.Core
   * @param {object} data The series object that contains the data to be visualized in the chart
   * @return {array} A plain array that contains the data to be visualized in the chart
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
   * @param {array} dataArray The array that contains the data to be visualized in the chart. The array in this parameter will be modified by function.
   * @param {number} length The length of the x-axis data array.
   * @return {array} The array that got updated with missing values.
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
   * @param {number} value The value Range of the chart
   * @return {number} The order of magnitude
   */
  Chartist.orderOfMagnitude = function (value) {
    return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  };

  /**
   * Project a data length into screen coordinates (pixels)
   *
   * @memberof Chartist.Core
   * @param {object} svg The svg element for the chart
   * @param {number} length Single data value from a series array
   * @param {object} bounds All the values to set the bounds of the chart
   * @param {object} options The Object that contains all the optional values for the chart
   * @return {number} The projected data length in pixels
   */
  Chartist.projectLength = function (svg, length, bounds, options) {
    var availableHeight = Chartist.getAvailableHeight(svg, options);
    return (length / bounds.range * availableHeight);
  };

  /**
   * Get the height of the area in the chart for the data series
   *
   * @memberof Chartist.Core
   * @param {object} svg The svg element for the chart
   * @param {object} options The Object that contains all the optional values for the chart
   * @return {number} The height of the area in the chart for the data series
   */
  Chartist.getAvailableHeight = function (svg, options) {
    return Chartist.getHeight(svg._node) - (options.chartPadding * 2) - options.axisX.offset;
  };

  /**
   * Get highest and lowest value of data array. This Array contains the data that will be visualized in the chart.
   *
   * @memberof Chartist.Core
   * @param {array} dataArray The array that contains the data to be visualized in the chart
   * @return {array} The array that contains the highest and lowest value that will be visualized on the chart.
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
   * @param {object} svg The svg element for the chart
   * @param {array} normalizedData The array that got updated with missing values.
   * @param {object} options The Object that contains all the optional values for the chart
   * @param {number} referenceValue The reference value for the chart.
   * @return {object} All the values to set the bounds of the chart
   */
  Chartist.getBounds = function (svg, normalizedData, options, referenceValue) {
    var i,
      newMin,
      newMax,
      bounds = Chartist.getHighLow(normalizedData);

    // Overrides of high / low from settings
    bounds.high = options.high || (options.high === 0 ? 0 : bounds.high);
    bounds.low = options.low || (options.low === 0 ? 0 : bounds.low);

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
   * @param {object} svg The svg element for the chart
   * @param {array} data The array that contains the data to be visualized in the chart
   * @param {object} labelClass All css classes of the label
   * @param {function} labelInterpolationFnc The function that interpolates the label value
   * @param {function} offsetFnc Function to find greatest value of either the width or the height of the label, depending on the context
   * @return {number} The number that represents the label offset in pixels
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
      offset = Math.max(offset, offsetFnc(label._node));
      // Remove label after offset Calculation
      label.remove();
    }

    return offset;
  };

  /**
   * Calculate cartesian coordinates of polar coordinates
   *
   * @memberof Chartist.Core
   * @param {number} centerX X-axis coordinates of center point of circle segment
   * @param {number} centerY X-axis coordinates of center point of circle segment
   * @param {number} radius Radius of circle segment
   * @param {number} angleInDegrees Angle of circle segment in degrees
   * @return {number} Coordinates of point on circumference
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
   * @param {object} svg The svg element for the chart
   * @param {object} options The Object that contains all the optional values for the chart
   * @param {number} xAxisOffset The offset of the x-axis to the border of the svg element
   * @param {number} yAxisOffset The offset of the y-axis to the border of the svg element
   * @return {object} The chart rectangles coordinates inside the svg element plus the rectangles measurements
   */
  Chartist.createChartRect = function (svg, options, xAxisOffset, yAxisOffset) {
    return {
      x1: options.chartPadding + yAxisOffset,
      y1: (options.height || Chartist.getHeight(svg._node)) - options.chartPadding - xAxisOffset,
      x2: (options.width || Chartist.getWidth(svg._node)) - options.chartPadding,
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
   * @param {object} chartRect The rectangle that sets the bounds for the chart in the svg element
   * @param {object} data The Object that contains the data to be visualized in the chart
   * @param {object} grid Chartist.svg wrapper object to be filled with the grid lines of the chart
   * @param {object} labels Chartist.svg wrapper object to be filled with the lables of the chart
   * @param {object} options The Object that contains all the optional values for the chart
   */
  Chartist.createXAxis = function (chartRect, data, grid, labels, options) {
    // Create X-Axis
    data.labels.forEach(function (value, index) {
      var interpolatedValue = options.axisX.labelInterpolationFnc(value, index),
        pos = chartRect.x1 + chartRect.width() / data.labels.length * index;

      // If interpolated value returns falsey (except 0) we don't draw the grid line
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisX.showGrid) {
        grid.elem('line', {
          x1: pos,
          y1: chartRect.y1,
          x2: pos,
          y2: chartRect.y2
        }, [options.classNames.grid, options.classNames.horizontal].join(' '));
      }

      if (options.axisX.showLabel) {
        // Use config offset for setting labels of
        var label = labels.elem('text', {
          dx: pos + 2
        }, [options.classNames.label, options.classNames.horizontal].join(' ')).text('' + interpolatedValue);

        // TODO: should use 'alignment-baseline': 'hanging' but not supported in firefox. Instead using calculated height to offset y pos
        label.attr({
          dy: chartRect.y1 + Chartist.getHeight(label._node) + options.axisX.offset
        });
      }
    });
  };

  /**
   * Generate grid lines and labels for the y-axis into grid and labels group SVG elements
   *
   * @memberof Chartist.Core
   * @param {object} chartRect The rectangle that sets the bounds for the chart in the svg element
   * @param {object} bounds All the values to set the bounds of the chart
   * @param {object} grid Chartist.svg wrapper object to be filled with the grid lines of the chart
   * @param {object} labels Chartist.svg wrapper object to be filled with the lables of the chart
   * @param {number} offset Offset for the y-axis
   * @param {object} options The Object that contains all the optional values for the chart
   */
  Chartist.createYAxis = function (chartRect, bounds, grid, labels, offset, options) {
    // Create Y-Axis
    bounds.values.forEach(function (value, index) {
      var interpolatedValue = options.axisY.labelInterpolationFnc(value, index),
        pos = chartRect.y1 - chartRect.height() / bounds.values.length * index;

      // If interpolated value returns falsey (except 0) we don't draw the grid line
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisY.showGrid) {
        grid.elem('line', {
          x1: chartRect.x1,
          y1: pos,
          x2: chartRect.x2,
          y2: pos
        }, [options.classNames.grid, options.classNames.vertical].join(' '));
      }

      if (options.axisY.showLabel) {
        labels.elem('text', {
          dx: options.axisY.labelAlign === 'right' ? offset - options.axisY.offset + options.chartPadding : options.chartPadding,
          dy: pos - 2,
          'text-anchor': options.axisY.labelAlign === 'right' ? 'end' : 'start'
        }, [options.classNames.label, options.classNames.vertical].join(' ')).text('' + interpolatedValue);
      }
    });
  };

  /**
   * Determine the current point on the svg element to draw the data series
   *
   * @memberof Chartist.Core
   * @param {object} chartRect The rectangle that sets the bounds for the chart in the svg element
   * @param {object} bounds All the values to set the bounds of the chart
   * @param {array} data The array that contains the data to be visualized in the chart
   * @param {number} index The index of the current project point
   * @return {object} The coordinates object of the current project point containing an x and y number property
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
   * @param {object} defaultOptions Default options from Chartist
   * @param {object} options Options set by user
   * @param {array} responsiveOptions Optional functions to add responsive behavior to chart
   * @param {function} optionsChangedCallbackFnc The callback that will be executed when a media change triggered new options to be used. The callback function will receive the new options as first parameter.
   * @return {object} The consolidated options object from the defaults, base and matching responsive options
   */
  Chartist.optionsProvider = function (defaultOptions, options, responsiveOptions, optionsChangedCallbackFnc) {
    var baseOptions = Chartist.extend(Chartist.extend({}, defaultOptions), options),
      currentOptions,
      mediaQueryListeners = [],
      i;

    function applyOptions() {
      currentOptions = Chartist.extend({}, baseOptions);

      if (responsiveOptions) {
        for (i = 0; i < responsiveOptions.length; i++) {
          var mql = window.matchMedia(responsiveOptions[i][0]);
          if (mql.matches) {
            currentOptions = Chartist.extend(currentOptions, responsiveOptions[i][1]);
          }
        }
      }

      optionsChangedCallbackFnc(currentOptions);
      return currentOptions;
    }

    if (!window.matchMedia) {
      throw 'window.matchMedia not found! Make sure you\'re using a polyfill.';
    } else if (responsiveOptions) {

      for (i = 0; i < responsiveOptions.length; i++) {
        var mql = window.matchMedia(responsiveOptions[i][0]);
        mql.addListener(applyOptions);
        mediaQueryListeners.push(mql);
      }
    }

    return applyOptions();
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
