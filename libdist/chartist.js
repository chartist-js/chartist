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

  /* Chartist.js 0.1.15
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
  Chartist.version = '0.1.14';

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

    //TODO: move into Chartist.svg
    /**
     * Get element height with fallback to svg BoundingBox or parent container dimensions:
     * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
     *
     * @memberof Chartist.Core
     * @param {Node} svgElement The svg element from which we want to retrieve its height
     * @return {Number} The elements height in pixels
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
     * @param {Node} svgElement The svg element from which we want to retrieve its width
     * @return {Number} The elements width in pixels
     */
    Chartist.getWidth = function (svgElement) {
      return svgElement.clientWidth || Math.round(svgElement.getBBox().width) || svgElement.parentNode.clientWidth;
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

      // If already contains our svg object we clear it, set width / height and return
      if (container.chartistSvg !== undefined) {
        svg = container.chartistSvg.attr({
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
      return Chartist.getHeight(svg._node) - (options.chartPadding * 2) - options.axisX.offset;
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
     * @param {Function} offsetFnc Function to find greatest value of either the width or the height of the label, depending on the context
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
     * @param {Object} chartRect The rectangle that sets the bounds for the chart in the svg element
     * @param {Object} data The Object that contains the data to be visualized in the chart
     * @param {Object} grid Chartist.svg wrapper object to be filled with the grid lines of the chart
     * @param {Object} labels Chartist.svg wrapper object to be filled with the lables of the chart
     * @param {Object} options The Object that contains all the optional values for the chart
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
     * @param {Object} chartRect The rectangle that sets the bounds for the chart in the svg element
     * @param {Object} bounds All the values to set the bounds of the chart
     * @param {Object} grid Chartist.svg wrapper object to be filled with the grid lines of the chart
     * @param {Object} labels Chartist.svg wrapper object to be filled with the lables of the chart
     * @param {Number} offset Offset for the y-axis
     * @param {Object} options The Object that contains all the optional values for the chart
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
     * @param {Function} optionsChangedCallbackFnc The callback that will be executed when a media change triggered new options to be used. The callback function will receive the new options as first parameter.
     * @return {Object} The consolidated options object from the defaults, base and matching responsive options
     */
    Chartist.optionsProvider = function (defaultOptions, options, responsiveOptions) {
      var baseOptions = Chartist.extend(Chartist.extend({}, defaultOptions), options),
        currentOptions,
        mediaQueryListeners = [],
        optionsListeners = [],
        i;

      function updateCrrentOptions() {
        currentOptions = Chartist.extend({}, baseOptions);

        if (responsiveOptions) {
          for (i = 0; i < responsiveOptions.length; i++) {
            var mql = window.matchMedia(responsiveOptions[i][0]);
            if (mql.matches) {
              currentOptions = Chartist.extend(currentOptions, responsiveOptions[i][1]);
            }
          }
        }
      }

      function clearMediaQueryListeners() {
        mediaQueryListeners.forEach(function(mql) {
          mql.removeListener(updateCrrentOptions);
        });
      }

      if (!window.matchMedia) {
        throw 'window.matchMedia not found! Make sure you\'re using a polyfill.';
      } else if (responsiveOptions) {

        for (i = 0; i < responsiveOptions.length; i++) {
          var mql = window.matchMedia(responsiveOptions[i][0]);
          mql.addListener(updateCrrentOptions);
          mediaQueryListeners.push(mql);
        }
      }
      // Execute initially so we get the correct current options
      updateCrrentOptions();

      return {
        get currentOptions() {
          return Chartist.extend({}, currentOptions);
        },
        addOptionsListener: function(callback) {
          optionsListeners.push(callback);
        },
        removeOptionsListener: function(callback) {
          optionsListeners.splice(optionsListeners.indexOf(callback), 1);
        },
        clear: function() {
          optionsListeners = [];
          clearMediaQueryListeners();
        }
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
   * Chartist SVG module for simple SVG DOM abstraction
   *
   * @module Chartist.svg
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    Chartist.xmlNs = {
      qualifiedName: 'xmlns:ct',
      prefix: 'ct',
      uri: 'http://gionkunz.github.com/chartist-js/ct'
    };

    Chartist.svg = function(name, attributes, className, insertFirst, parent) {

      var svgNs = 'http://www.w3.org/2000/svg',
        xmlNs = 'http://www.w3.org/2000/xmlns/';

      function attr(node, attributes, ns) {
        Object.keys(attributes).forEach(function(key) {
          if(ns) {
            node.setAttributeNS(ns, [Chartist.xmlNs.prefix, ':', key].join(''), attributes[key]);
          } else {
            node.setAttribute(key, attributes[key]);
          }
        });

        return node;
      }

      function elem(svg, name, attributes, className, insertFirst, parentNode) {
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

      function text(node, t) {
        node.appendChild(document.createTextNode(t));
      }

      function empty(node) {
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
      }

      function remove(node) {
        node.parentNode.removeChild(node);
      }

      function classes(node) {
        return node.getAttribute('class') ? node.getAttribute('class').trim().split(/\s+/) : [];
      }

      function addClass(node, names) {
        node.setAttribute('class',
          classes(node)
            .concat(names.trim().split(/\s+/))
            .filter(function(elem, pos, self) {
              return self.indexOf(elem) === pos;
            }).join(' ')
        );
      }

      function removeClass(node, names) {
        var removedClasses = names.trim().split(/\s+/);

        node.setAttribute('class', classes(node).filter(function(name) {
          return removedClasses.indexOf(name) === -1;
        }).join(' '));
      }

      function removeAllClasses(node) {
        node.setAttribute('class', '');
      }

      return {
        _node: elem(this, name, attributes, className, insertFirst, parent ? parent._node : undefined),
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
          return this;
        },
        elem: function(name, attributes, className, insertFirst) {
          return Chartist.svg(name, attributes, className, insertFirst, this);
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

    /**
     * This method creates a new line chart and returns an object handle to the internal closure. Currently you can use the returned object only for updating / redrawing the chart.
     *
     * @memberof Chartist.Line
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object that needs to consist of a labels and a series array
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object with a version and an update method to manually redraw the chart
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
     * Chartist.Line('.ct-chart', data, options);
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
     * Chartist.Line('.ct-chart', data, null, responsiveOptions);
     *
     */
    Chartist.Line = function (query, data, options, responsiveOptions) {

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
        },
        optionsProvider,
        container = Chartist.querySelector(query),
        svg;

      function createChart(options) {
        var xAxisOffset,
          yAxisOffset,
          seriesGroups = [],
          bounds,
          normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

        // Create new svg object
        svg = Chartist.createSvg(container, options.width, options.height, options.classNames.chart);

        // initialize bounds
        bounds = Chartist.getBounds(svg, normalizedData, options);

        xAxisOffset = options.axisX.offset;
        if (options.axisX.showLabel) {
          xAxisOffset += Chartist.calculateLabelOffset(
            svg,
            data.labels,
            [options.classNames.label, options.classNames.horizontal].join(' '),
            options.axisX.labelInterpolationFnc,
            Chartist.getHeight
          );
        }

        yAxisOffset = options.axisY.offset;
        if (options.axisY.showLabel) {
          yAxisOffset += Chartist.calculateLabelOffset(
            svg,
            bounds.values,
            [options.classNames.label, options.classNames.horizontal].join(' '),
            options.axisY.labelInterpolationFnc,
            Chartist.getWidth
          );
        }

        var chartRect = Chartist.createChartRect(svg, options, xAxisOffset, yAxisOffset);
        // Start drawing
        var labels = svg.elem('g'),
          grid = svg.elem('g');

        Chartist.createXAxis(chartRect, data, grid, labels, options);
        Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options);

        // Draw the series
        // initialize series groups
        for (var i = 0; i < data.series.length; i++) {
          seriesGroups[i] = svg.elem('g');

          // If the series is an object and contains a name we add a custom attribute
          if(data.series[i].name) {
            seriesGroups[i].attr({
              'series-name': data.series[i].name
            }, Chartist.xmlNs.uri);
          }

          // Use series class from series data or if not set generate one
          seriesGroups[i].addClass([
            options.classNames.series,
            (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
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
              // If we need to draw area shapes we just make a copy of our pathElements SVG path array
              var areaPathElements = pathElements.slice();
              // We project the areaBase value into screen coordinates
              var areaBaseProjected = Chartist.projectPoint(chartRect, bounds, [options.areaBase], 0);
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
       * Updates the chart which currently does a full reconstruction of the SVG DOM
       *
       * @memberof Chartist.Line
       *
       */
      function update() {
        createChart(optionsProvider.currentOptions);
      }

      /**
       * This method will detach the chart from any event listeners that have been added. This includes window.resize and media query listeners for the responsive options. Call this method in order to de-initialize dynamically created / removed charts.
       *
       * @memberof Chartist.Line
       */
      function detach() {
        window.removeEventListener('resize', update);
        optionsProvider.clear();
      }

      /**
       * Add a listener for the responsive options updates. Once the chart will switch to a new option set the listener will be called with the new options.
       *
       * @memberof Chartist.Line
       * @param {Function} callback Callback function that will have the new options as first parameter
       */
      function addOptionsListener(callback) {
        optionsProvider.addOptionsListener(callback);
      }

      /**
       * Remove a responsive options listener that was previously added using the addOptionsListener method.
       *
       * @memberof Chartist.Line
       * @param {Function} callback The callback function that was registered earlier with addOptionsListener
       */
      function removeOptionsListener(callback) {
        optionsProvider.removeOptionsListener(callback);
      }

      // If this container already contains chartist, let's try to detach first and unregister all event listeners
      if(container.chartist) {
        container.chartist.detach();
      }

      // Obtain current options based on matching media queries (if responsive options are given)
      // This will also register a listener that is re-creating the chart based on media changes
      optionsProvider = Chartist.optionsProvider(defaultOptions, options, responsiveOptions);
      createChart(optionsProvider.currentOptions);

      // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
      // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
      // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
      // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
      // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
      // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
      function updateChart() {
        createChart(optionsProvider.currentOptions);
      }

      window.addEventListener('resize', updateChart);

      // Public members
      var api = {
        version: Chartist.version,
        update: update,
        detach: detach,
        addOptionsListener: addOptionsListener,
        removeOptionsListener: removeOptionsListener
      };

      container.chartist = api;

      return api;
    };

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
     * This method creates a new bar chart and returns an object handle with delegations to the internal closure of the bar chart. You can use the returned object to redraw the chart.
     *
     * @memberof Chartist.Bar
     * @param {String|Node} query A selector query string or directly a DOM element
     * @param {Object} data The data object that needs to consist of a labels and a series array
     * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
     * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
     * @return {Object} An object with a version and an update method to manually redraw the chart
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
     * Chartist.Bar('.ct-chart', data);
     *
     * @example
     * // This example creates a bipolar grouped bar chart where the boundaries are limitted to -10 and 10
     * Chartist.Bar('.ct-chart', {
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
    Chartist.Bar = function (query, data, options, responsiveOptions) {

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
        },
        optionsProvider,
        container = Chartist.querySelector(query),
        svg;

      function createChart(options) {
        var xAxisOffset,
          yAxisOffset,
          seriesGroups = [],
          bounds,
          normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

        // Create new svg element
        svg = Chartist.createSvg(container, options.width, options.height, options.classNames.chart);

        // initialize bounds
        bounds = Chartist.getBounds(svg, normalizedData, options, 0);

        xAxisOffset = options.axisX.offset;
        if (options.axisX.showLabel) {
          xAxisOffset += Chartist.calculateLabelOffset(
            svg,
            data.labels,
            [options.classNames.label, options.classNames.horizontal].join(' '),
            options.axisX.labelInterpolationFnc,
            Chartist.getHeight
          );
        }

        yAxisOffset = options.axisY.offset;
        if (options.axisY.showLabel) {
          yAxisOffset += Chartist.calculateLabelOffset(
            svg,
            bounds.values,
            [options.classNames.label, options.classNames.horizontal].join(' '),
            options.axisY.labelInterpolationFnc,
            Chartist.getWidth
          );
        }

        var chartRect = Chartist.createChartRect(svg, options, xAxisOffset, yAxisOffset);
        // Start drawing
        var labels = svg.elem('g'),
          grid = svg.elem('g'),
        // Projected 0 point
          zeroPoint = Chartist.projectPoint(chartRect, bounds, [0], 0);

        Chartist.createXAxis(chartRect, data, grid, labels, options);
        Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options);

        // Draw the series
        // initialize series groups
        for (var i = 0; i < data.series.length; i++) {
          // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
          var biPol = i - (data.series.length - 1) / 2,
          // Half of the period with between vertical grid lines used to position bars
            periodHalfWidth = chartRect.width() / normalizedData[i].length / 2;

          seriesGroups[i] = svg.elem('g');

          // If the series is an object and contains a name we add a custom attribute
          if(data.series[i].name) {
            seriesGroups[i].attr({
              'series-name': data.series[i].name
            }, Chartist.xmlNs.uri);
          }

          // Use series class from series data or if not set generate one
          seriesGroups[i].addClass([
            options.classNames.series,
            (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
          ].join(' '));

          for(var j = 0; j < normalizedData[i].length; j++) {
            var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j),
              bar;

            // Offset to center bar between grid lines and using bi-polar offset for multiple series
            // TODO: Check if we should really be able to add classes to the series. Should be handles with SASS and semantic / specific selectors
            p.x += periodHalfWidth + (biPol * options.seriesBarDistance);

            bar = seriesGroups[i].elem('line', {
              x1: p.x,
              y1: zeroPoint.y,
              x2: p.x,
              y2: p.y
            }, options.classNames.bar).attr({
              'value': normalizedData[i][j]
            }, Chartist.xmlNs.uri);
          }
        }
      }

      /**
       * Updates the chart which currently does a full reconstruction of the SVG DOM
       *
       * @memberof Chartist.Bar
       *
       */
      function update() {
        createChart(optionsProvider.currentOptions);
      }

      /**
       * This method will detach the chart from any event listeners that have been added. This includes window.resize and media query listeners for the responsive options. Call this method in order to de-initialize dynamically created / removed charts.
       *
       * @memberof Chartist.Bar
       */
      function detach() {
        window.removeEventListener('resize', update);
        optionsProvider.clear();
      }

      /**
       * Add a listener for the responsive options updates. Once the chart will switch to a new option set the listener will be called with the new options.
       *
       * @memberof Chartist.Bar
       * @param {Function} callback Callback function that will have the new options as first parameter
       */
      function addOptionsListener(callback) {
        optionsProvider.addOptionsListener(callback);
      }

      /**
       * Remove a responsive options listener that was previously added using the addOptionsListener method.
       *
       * @memberof Chartist.Bar
       * @param {Function} callback The callback function that was registered earlier with addOptionsListener
       */
      function removeOptionsListener(callback) {
        optionsProvider.removeOptionsListener(callback);
      }

      // If this container already contains chartist, let's try to detach first and unregister all event listeners
      if(container.chartist) {
        container.chartist.detach();
      }

      // Obtain current options based on matching media queries (if responsive options are given)
      // This will also register a listener that is re-creating the chart based on media changes
      optionsProvider = Chartist.optionsProvider(defaultOptions, options, responsiveOptions);
      createChart(optionsProvider.currentOptions);

      // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
      // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
      // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
      // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
      // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
      // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
      window.addEventListener('resize', update);

      // Public members
      var api = {
        version: Chartist.version,
        update: update,
        detach: detach,
        addOptionsListener: addOptionsListener,
        removeOptionsListener: removeOptionsListener
      };

      container.chartist = api;

      return api;
    };

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
     * Chartist.Pie('.ct-chart', {
     *   series: [10, 2, 4, 3]
     * });
     *
     * @example
     * // Drawing a donut chart
     * Chartist.Pie('.ct-chart', {
     *   series: [10, 2, 4, 3]
     * }, {
     *   donut: true
     * });
     *
     * @example
     * // Using donut, startAngle and total to draw a gauge chart
     * Chartist.Pie('.ct-chart', {
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
     * Chartist.Pie('.ct-chart', {
     *   series: [20, 10, 30, 40]
     * }, {
     *   chartPadding: 30,
     *   labelOffset: 50,
     *   labelDirection: 'explode'
     * });
     */
    Chartist.Pie = function (query, data, options, responsiveOptions) {

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
        },
        optionsProvider,
        container = Chartist.querySelector(query),
        svg;

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
          dataArray = Chartist.getDataArray(data);

        // Create SVG.js draw
        svg = Chartist.createSvg(container, options.width, options.height, options.classNames.chart);
        // Calculate charting rect
        chartRect = Chartist.createChartRect(svg, options, 0, 0);
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

        // Draw the series
        // initialize series groups
        for (var i = 0; i < data.series.length; i++) {
          seriesGroups[i] = svg.elem('g', null, null, true);

          // If the series is an object and contains a name we add a custom attribute
          if(data.series[i].name) {
            seriesGroups[i].attr({
              'series-name': data.series[i].name
            }, Chartist.xmlNs.uri);
          }

          // Use series class from series data or if not set generate one
          seriesGroups[i].addClass([
            options.classNames.series,
            (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
          ].join(' '));

          var endAngle = startAngle + dataArray[i] / totalDataSum * 360;
          // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
          // with Z and use 359.99 degrees
          if(endAngle - startAngle === 360) {
            endAngle -= 0.01;
          }

          var start = Chartist.polarToCartesian(center.x, center.y, radius, startAngle - (i === 0 ? 0 : 0.2)),
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

          // If we need to show labels we need to add the label for this slice now
          if(options.showLabel) {
            // Position at the labelRadius distance from center and between start and end angle
            var labelPosition = Chartist.polarToCartesian(center.x, center.y, labelRadius, startAngle + (endAngle - startAngle) / 2),
              interpolatedValue = options.labelInterpolationFnc(data.labels ? data.labels[i] : dataArray[i], i);

            seriesGroups[i].elem('text', {
              dx: labelPosition.x,
              dy: labelPosition.y,
              'text-anchor': determineAnchorPosition(center, labelPosition, options.labelDirection)
            }, options.classNames.label).text('' + interpolatedValue);
          }

          // Set next startAngle to current endAngle. Use slight offset so there are no transparent hairline issues
          // (except for last slice)
          startAngle = endAngle;
        }
      }

      /**
       * Updates the chart which currently does a full reconstruction of the SVG DOM
       *
       * @memberof Chartist.Pie
       *
       */
      function update() {
        createChart(optionsProvider.currentOptions);
      }

      /**
       * This method will detach the chart from any event listeners that have been added. This includes window.resize and media query listeners for the responsive options. Call this method in order to de-initialize dynamically created / removed charts.
       *
       * @memberof Chartist.Pie
       */
      function detach() {
        window.removeEventListener('resize', update);
        optionsProvider.clear();
      }

      /**
       * Add a listener for the responsive options updates. Once the chart will switch to a new option set the listener will be called with the new options.
       *
       * @memberof Chartist.Pie
       * @param {Function} callback Callback function that will have the new options as first parameter
       */
      function addOptionsListener(callback) {
        optionsProvider.addOptionsListener(callback);
      }

      /**
       * Remove a responsive options listener that was previously added using the addOptionsListener method.
       *
       * @memberof Chartist.Pie
       * @param {Function} callback The callback function that was registered earlier with addOptionsListener
       */
      function removeOptionsListener(callback) {
        optionsProvider.removeOptionsListener(callback);
      }

      // If this container already contains chartist, let's try to detach first and unregister all event listeners
      if(container.chartist) {
        container.chartist.detach();
      }

      // Obtain current options based on matching media queries (if responsive options are given)
      // This will also register a listener that is re-creating the chart based on media changes
      optionsProvider = Chartist.optionsProvider(defaultOptions, options, responsiveOptions);
      createChart(optionsProvider.currentOptions);

      // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
      // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
      // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
      // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
      // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
      // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
      function updateChart() {
        createChart(optionsProvider.currentOptions);
      }

      window.addEventListener('resize', updateChart);

      // Public members
      var api = {
        version: Chartist.version,
        update: update,
        detach: detach,
        addOptionsListener: addOptionsListener,
        removeOptionsListener: removeOptionsListener
      };

      container.chartist = api;

      return api;
    };

  }(window, document, Chartist));

  return Chartist;

}));
