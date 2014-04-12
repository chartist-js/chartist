(function (document, window, undefined) {
  'use strict';

  // Export chartist namespace
  var Chartist = window.Chartist = window.Chartist || {};

  Chartist.version = '0.0.3';

  // Helps to simplify functional style code
  Chartist.noop = function (n) {
    return n;
  };

  // Generates a-z from number
  Chartist.alphaNumerate = function (n) {
    // Limit to a-z
    return String.fromCharCode(97 + n % 26);
  };

  // Simple recursive object extend
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

  // Filter an array
  Chartist.filter = function (array, filterFnc) {
    var accepted = [],
      acceptedOnly,
      i,
      handler = {
        accept: function (e) {
          accepted.push(e);
        },
        acceptOnly: function (e) {
          acceptedOnly = e;
        }
      };

    for (i = 0; i < array.length; i++) {
      var returnValue = filterFnc.call(handler, array[i]);

      if (acceptedOnly !== undefined) {
        return acceptedOnly;
      }

      if (returnValue === false) {
        return accepted;
      }
    }

    return accepted;
  };

  // Get element height / width with fallback to svg BoundingBox or parent container dimensions
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=530985
  Chartist.getHeight = function (svgElement) {
    return svgElement.clientHeight || Math.round(svgElement.getBBox().height) || svgElement.parentNode.clientHeight;
  };

  Chartist.getWidth = function (svgElement) {
    return svgElement.clientWidth || Math.round(svgElement.getBBox().width) || svgElement.parentNode.clientWidth;
  };

  // Convert data series into plain array
  Chartist.getDataArray = function (data) {
    var array = [];

    for (var i = 0; i < data.series.length; i++) {
      array[i] = data.series[i].data;
    }

    return array;
  };

  // Add missing values at the end of the arrays
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

  // Find the highest and lowest values in a two dimensional array and calculate scale based on order of magnitude
  Chartist.getBounds = function (paper, dataArray, options) {
    var i,
      j,
      newMin,
      newMax,
      bounds = {
        low: Number.MAX_VALUE,
        high: Number.MIN_VALUE
      };

    for (i = 0; i < dataArray.length; i++) {
      for (j = 0; j < dataArray[i].length; j++) {
        if (dataArray[i][j] > bounds.high) {
          bounds.high = dataArray[i][j];
        }

        if (dataArray[i][j] < bounds.low) {
          bounds.low = dataArray[i][j];
        }
      }
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
      var length = Chartist.projectLength(paper, bounds.step / 2, bounds, options);
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

  Chartist.calculateLabelOffset = function (paper, data, labelClass, labelInterpolationFnc, offsetFnc) {
    var offset = 0;
    for (var i = 0; i < data.length; i++) {
      // If interpolation function returns falsy value we skipp this label
      var interpolated = labelInterpolationFnc(data[i], i);
      if (!interpolated && interpolated !== 0) {
        continue;
      }

      var label = paper.text(0, 0, '' + interpolated);
      label.node.setAttribute('class', labelClass);

      // Check if this is the largest label and update offset
      offset = Math.max(offset, offsetFnc(label.node));
      // Remove label after offset Calculation
      label.remove();
    }

    return offset;
  };

  // Used to iterate over array, interpolate using a interpolation function and executing callback (used for rendering)
  Chartist.interpolateData = function (data, labelInterpolationFnc, callback) {
    for (var index = 0; index < data.length; index++) {
      // If interpolation function returns falsy value we skipp this label
      var interpolatedValue = labelInterpolationFnc(data[index], index);
      if (!interpolatedValue && interpolatedValue !== 0) {
        continue;
      }

      callback(data, index, interpolatedValue);
    }
  };

  // Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
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

  // Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
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