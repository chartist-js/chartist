/**
 * @author Gion Kunz
 */
(function (document, window, undefined) {
  'use strict';

  /**
   * @name Chartist
   * @description Export chartist namespace
   * @type {{}|*|Window.Chartist}
   */
  var Chartist = window.Chartist = window.Chartist || {};

  Chartist.version = '0.0.3';

  /**
   * @name noop
   * @function noop
   * @description Helps to simplify functional style code
   * @param n
   * @returns {*}
   */
  Chartist.noop = function (n) {
    return n;
  };

  /**
   * @name alphaNumerate
   * @function alphaNumerate
   * @description Generates a-z from number
   * @param n
   * @returns {string}
   */
  Chartist.alphaNumerate = function (n) {

    /**
     * @description Limit to a-z
     */
    return String.fromCharCode(97 + n % 26);
  };

  /**
   * @name extend
   * @function extend
   * @description Simple recursive object extend
   * @param target
   * @param source
   * @returns {*|{}}
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

  // TODO: Use Array forEach as browser support allows (IE 9+)
  /**
   * @name each
   * @function each
   * @description Simple array each function
   * @param array
   * @param callback
   */
  Chartist.each = function (array, callback) {
    for (var i = 0; i < array.length; i++) {
      var value = callback.call(array[i], i, array[i]);

      if (value === false) {
        break;
      }
    }
  };

  /**
   * @name getHeight
   * @function getHeight
   * @description Get element height / width with fallback to svg BoundingBox or parent container dimensions
   * @description See https://bugzilla.mozilla.org/show_bug.cgi?id=530985
   * @param svgElement
   * @returns {number}
   */
  Chartist.getHeight = function (svgElement) {
    return svgElement.clientHeight || Math.round(svgElement.getBBox().height) || svgElement.parentNode.clientHeight;
  };

  Chartist.getWidth = function (svgElement) {
    return svgElement.clientWidth || Math.round(svgElement.getBBox().width) || svgElement.parentNode.clientWidth;
  };

  /**
   * @name createPaper
   * @function createPaper
   * @description Create Chartist container and instantiate snap paper
   * @param query
   * @param width
   * @param height
   * @returns {*}
   */
  Chartist.createPaper = function (query, width, height) {
    /**
     * @description Get dom object from query or if already dom object just use it
     */
    var container = query.nodeType ? query : document.querySelector(query),
      paper;

    /**
     * @description If container was not found we throw up
     */
    if (!container) {
      throw 'Container node with selector "' + query + '" not found';
    }

    /**
     * @description If already contains paper we clear it, set width / height and return
     */
    if (container.__chartistPaper !== undefined) {
      paper = container.__chartistPaper.attr({
        width: width || '100%',
        height: height || '100%'
      });
      /**
       * @description Clear the paper if its already used before so we start fresh
       */
      paper.clear();

    } else {
      /**
       * @description Create Snap paper with width and height or use 100% as default
       */
      paper = Snap(width || '100%', height || '100%');
      if (!paper) {
        throw 'Could not instantiate Snap.js!';
      }
      /**
       * @description Append the snap SVG to our container
       */
      container.appendChild(paper.node);

      /**
       * @description Set paper in DOM element so we have a trace for later
       */
      container.__chartistPaper = paper;
    }

    return paper;
  };

  /**
   * @name getDateArray
   * @function getDataArray
   * @description Convert data series into plain array
   * @param data
   * @returns {Array}
   */
  Chartist.getDataArray = function (data) {
    var array = [];

    for (var i = 0; i < data.series.length; i++) {
      array[i] = data.series[i].data;
    }

    return array;
  };

  /**
   * @name normalizeDataArray
   * @function normalizeDataArray
   * @description Add missing values at the end of the arrays
   * @param dataArray
   * @param length
   * @returns {*}
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

  Chartist.orderOfMagnitude = function (value) {
    return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  };

  Chartist.projectLength = function (paper, length, bounds, options) {
    var availableHeight = Chartist.getAvailableHeight(paper, options);
    return (length / bounds.range * availableHeight);
  };

  Chartist.getAvailableHeight = function (paper, options) {
    return Chartist.getHeight(paper.node) - (options.chartPadding * 2) - options.axisX.offset;
  };

  /**
   * @name getHighLow
   * @function getHighLow
   * @description Get highest and lowest value of data array
   * @param dataArray
   * @returns {{high: Number, low: Number}}
   */
  Chartist.getHighLow = function (dataArray) {
    var i,
      j,
      highLow = {
        high: Number.MIN_VALUE,
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
   * @name getBounds
   * @function getBounds
   * @description Find the highest and lowest values in a two dimensional array and calculate scale based on order of magnitude
   * @param paper
   * @param dataArray
   * @param options
   * @param high
   * @param low
   * @returns {*}
   */
  Chartist.getBounds = function (paper, dataArray, options, high, low) {
    var i,
      newMin,
      newMax,
      bounds = Chartist.getHighLow(dataArray);

    /**
     * @description Overrides of high / low from settings
     * @type {*|number}
     */
    bounds.high = options.high || (options.high === 0 ? 0 : bounds.high);
    bounds.low = options.low || (options.low === 0 ? 0 : bounds.low);

    /**
     * @description Overrides of high / low from function call (highest priority)
     * @type {*|number}
     */
    bounds.high = high || (high === 0 ? 0 : bounds.high);
    bounds.low = low || (low === 0 ? 0 : bounds.low);

    bounds.valueRange = bounds.high - bounds.low;
    bounds.oom = Chartist.orderOfMagnitude(bounds.valueRange);
    bounds.min = Math.floor(bounds.low / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
    bounds.max = Math.ceil(bounds.high / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
    bounds.range = bounds.max - bounds.min;
    bounds.step = Math.pow(10, bounds.oom);
    bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

    /**
     * @description Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
     */
    while (true) {
      var length = Chartist.projectLength(paper, bounds.step / 2, bounds, options);
      if (length >= options.axisY.scaleMinSpace) {
        bounds.step /= 2;
      } else {
        break;
      }
    }

    /**
     * @description Narrow min and max based on new step
     */
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

  Chartist.calculateLabelOffset = function (paper, data, labelClass, labelInterpolationFnc, offsetFnc) {
    var offset = 0;
    for (var i = 0; i < data.length; i++) {
      /**
       * @description If interpolation function returns falsy value we skipp this label
       */
      var interpolated = labelInterpolationFnc(data[i], i);
      if (!interpolated && interpolated !== 0) {
        continue;
      }

      var label = paper.text(0, 0, '' + interpolated);
      label.node.setAttribute('class', labelClass);

      /**
       * @description Check if this is the largest label and update offset
       * @type {number}
       */
      offset = Math.max(offset, offsetFnc(label.node));
      /**
       * @description Remove label after offset Calculation
       */
      label.remove();
    }

    return offset;
  };

  /**
   * @name interpolateData
   * @function interpolateData
   * @description Used to iterate over array, interpolate using a interpolation function and executing callback (used for rendering)
   * @param data
   * @param labelInterpolationFnc
   * @param callback
   */
  Chartist.interpolateData = function (data, labelInterpolationFnc, callback) {
    for (var index = 0; index < data.length; index++) {
      /**
       * @description If interpolation function returns falsy value we skipp this label
       */
      var interpolatedValue = labelInterpolationFnc(data[index], index);
      if (!interpolatedValue && interpolatedValue !== 0) {
        continue;
      }

      callback(data, index, interpolatedValue);
    }
  };

  Chartist.polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  /**
   * @name createChartRect
   * @function createChartRect
   * @description Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
   * @param paper
   * @param options
   * @param xAxisOffset
   * @param yAxisOffset
   * @returns {{x1: *, y1: number, x2: number, y2: (k.chartPadding|*|m.chartPadding|p.chartPadding|q.chartPadding|defaultOptions.chartPadding), width: width, height: height}}
   */
  Chartist.createChartRect = function (paper, options, xAxisOffset, yAxisOffset) {
    return {
      x1: options.chartPadding + yAxisOffset,
      y1: (options.height || Chartist.getHeight(paper.node)) - options.chartPadding - xAxisOffset,
      x2: (options.width || Chartist.getWidth(paper.node)) - options.chartPadding,
      y2: options.chartPadding,
      width: function () {
        return this.x2 - this.x1;
      },
      height: function () {
        return this.y1 - this.y2;
      }
    };
  };

  Chartist.createXAxis = function (paper, chartRect, data, grid, labels, options) {
    /**
     * @description Create X-Axis
     */
    Chartist.each(data.labels, function (index, value) {
      var interpolatedValue = options.axisX.labelInterpolationFnc(value, index),
        pos = chartRect.x1 + chartRect.width() / data.labels.length * index;

      /**
       * @description If interpolated value returns falsey (except 0) we don't draw the grid line
       */
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisX.showGrid) {
        var line = paper.line(pos, chartRect.y1, pos, chartRect.y2);
        line.node.setAttribute('class', [options.classNames.grid, options.classNames.horizontal].join(' '));
        grid.add(line);
      }

      if (options.axisX.showLabel) {
        /**
         * @description Use config offset for setting labels of
         */
        var label = paper.text(pos + 2, 0, '' + interpolatedValue);
        label.node.setAttribute('class', [options.classNames.label, options.classNames.horizontal].join(' '));

        // TODO: should use 'alignment-baseline': 'hanging' but not supported in firefox. Instead using calculated height to offset y pos
        label.attr({
          y: chartRect.y1 + Chartist.getHeight(label.node) + options.axisX.offset
        });

        labels.add(label);
      }
    });
  };

  Chartist.createYAxis = function (paper, chartRect, bounds, grid, labels, offset, options) {
    /**
     * @description Create Y-Axis
     */
    Chartist.each(bounds.values, function (index, value) {
      var interpolatedValue = options.axisY.labelInterpolationFnc(value, index),
        pos = chartRect.y1 - chartRect.height() / bounds.values.length * index;

      /**
       * @description If interpolated value returns falsey (except 0) we don't draw the grid line
       */
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisY.showGrid) {
        var line = paper.line(chartRect.x1, pos, chartRect.x2, pos);
        line.node.setAttribute('class', options.classNames.grid + ' ' + options.classNames.vertical);
        grid.add(line);
      }

      if (options.axisY.showLabel) {
        /**
         * @description Position later
         */
        //TODO: make padding of 2px configurable
        //TODO: Check for refacoring
        var label = paper.text(options.axisY.labelAlign === 'right' ? offset - options.axisY.offset + options.chartPadding : options.chartPadding,
            pos - 2, '' + interpolatedValue);
        label.node.setAttribute('class', options.classNames.label + ' ' + options.classNames.vertical);

        /**
         * @description Set text-anchor based on alignment
         */
        label.attr({
          'text-anchor': options.axisY.labelAlign === 'right' ? 'end' : 'start'
        });

        labels.add(label);
      }
    });
  };

  Chartist.projectPoint = function (chartRect, bounds, data, index) {
    return {
      x: chartRect.x1 + chartRect.width() / data.length * index,
      y: chartRect.y1 - chartRect.height() * (data[index] - bounds.min) / (bounds.range + bounds.step)
    };
  };

  /**
   * @name optionsProvider
   * @function optionsProvider
   * @description Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
   * @param defaultOptions
   * @param options
   * @param responsiveOptions
   * @param optionsChangedCallbackFnc
   * @returns {*}
   */
    // TODO: With multiple media queries the handleMediaChange function is triggered too many times, only need one
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
}(document, window));