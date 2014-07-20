(function (document, window, undefined) {
  'use strict';

  // Export chartist namespace
  var Chartist = window.Chartist = window.Chartist || {};

  Chartist.version = '0.1.3';

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

  // Simple array each function
  // TODO: Use Array forEach as browser support allows (IE 9+)
  Chartist.each = function (array, callback) {
    for (var i = 0; i < array.length; i++) {
      var value = callback.call(array[i], i, array[i]);

      if (value === false) {
        break;
      }
    }
  };

  // Get element height / width with fallback to svg BoundingBox or parent container dimensions
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=530985
  Chartist.getHeight = function (svgElement) {
    return svgElement.clientHeight || Math.round(svgElement.getBBox().height) || svgElement.parentNode.clientHeight;
  };

  Chartist.getWidth = function (svgElement) {
    return svgElement.clientWidth || Math.round(svgElement.getBBox().width) || svgElement.parentNode.clientWidth;
  };

  // Create Chartist.js container and instantiate SVG.js draw
  Chartist.createDraw = function (query, width, height) {
    // Get dom object from query or if already dom object just use it
    var container = query.nodeType ? query : document.querySelector(query),
      draw;

    // If container was not found we throw up
    if (!container) {
      throw 'Container node with selector "' + query + '" not found';
    }

    // If already contains draw we clear it, set width / height and return
    if (container.__ctDraw !== undefined) {
      draw = container.__ctDraw.attr({
        width: width || '100%',
        height: height || '100%'
      });
      // Clear the draw if its already used before so we start fresh
      draw.clear();

    } else {
      // Create Snap paper with width and height or use 100% as default
      draw = SVG(container).size(width || '100%', height || '100%');
      if (!draw) {
        throw 'Could not instantiate SVG.js!';
      }

      // Set draw in DOM element so we have a trace for later
      container.__ctDraw = draw;
    }

    return draw;
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

  Chartist.projectLength = function (draw, length, bounds, options) {
    var availableHeight = Chartist.getAvailableHeight(draw, options);
    return (length / bounds.range * availableHeight);
  };

  Chartist.getAvailableHeight = function (draw, options) {
    return Chartist.getHeight(draw.node) - (options.chartPadding * 2) - options.axisX.offset;
  };

  // Get highest and lowest value of data array
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

  // Find the highest and lowest values in a two dimensional array and calculate scale based on order of magnitude
  Chartist.getBounds = function (draw, data, options, high, low) {
    var i,
      newMin,
      newMax,
      bounds = Chartist.getHighLow(Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length));

    // Overrides of high / low from settings
    bounds.high = options.high || (options.high === 0 ? 0 : bounds.high);
    bounds.low = options.low || (options.low === 0 ? 0 : bounds.low);

    // Overrides of high / low from function call (highest priority)
    bounds.high = high || (high === 0 ? 0 : bounds.high);
    bounds.low = low || (low === 0 ? 0 : bounds.low);

    bounds.valueRange = bounds.high - bounds.low;
    bounds.oom = Chartist.orderOfMagnitude(bounds.valueRange);
    bounds.min = Math.floor(bounds.low / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
    bounds.max = Math.ceil(bounds.high / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
    bounds.range = bounds.max - bounds.min;
    bounds.step = Math.pow(10, bounds.oom);
    bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

    // Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
    while (true) {
      var length = Chartist.projectLength(draw, bounds.step / 2, bounds, options);
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

  Chartist.calculateLabelOffset = function (draw, data, labelClass, labelInterpolationFnc, offsetFnc) {
    var offset = 0;
    for (var i = 0; i < data.length; i++) {
      // If interpolation function returns falsy value we skipp this label
      var interpolated = labelInterpolationFnc(data[i], i);
      if (!interpolated && interpolated !== 0) {
        continue;
      }

      var label = draw.plain('' + interpolated);
      label.attr({
        'font-family': null
      });
      //TODO: Check if needed
      label.dx(0);
      label.dy(0);
      label.addClass(labelClass);

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

  Chartist.polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
  Chartist.createChartRect = function (draw, options, xAxisOffset, yAxisOffset) {
    return {
      x1: options.chartPadding + yAxisOffset,
      y1: (options.height || Chartist.getHeight(draw.node)) - options.chartPadding - xAxisOffset,
      x2: (options.width || Chartist.getWidth(draw.node)) - options.chartPadding,
      y2: options.chartPadding,
      width: function () {
        return this.x2 - this.x1;
      },
      height: function () {
        return this.y1 - this.y2;
      }
    };
  };

  Chartist.createXAxis = function (chartRect, data, grid, labels, options) {
    // Create X-Axis
    Chartist.each(data.labels, function (index, value) {
      var interpolatedValue = options.axisX.labelInterpolationFnc(value, index),
        pos = chartRect.x1 + chartRect.width() / data.labels.length * index;

      // If interpolated value returns falsey (except 0) we don't draw the grid line
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisX.showGrid) {
        var line = grid.line(pos, chartRect.y1, pos, chartRect.y2);
        line.addClass([options.classNames.grid, options.classNames.horizontal].join(' '));
      }

      if (options.axisX.showLabel) {
        // Use config offset for setting labels of
        var label = labels.plain('' + interpolatedValue);
        label.attr({
          'font-family': null
        });
        label.dx(pos + 2);

        label.addClass([options.classNames.label, options.classNames.horizontal].join(' '));

        // TODO: should use 'alignment-baseline': 'hanging' but not supported in firefox. Instead using calculated height to offset y pos
        label.dy(chartRect.y1 + Chartist.getHeight(label.node) + options.axisX.offset);
      }
    });
  };

  Chartist.createYAxis = function (chartRect, bounds, grid, labels, offset, options) {
    // Create Y-Axis
    Chartist.each(bounds.values, function (index, value) {
      var interpolatedValue = options.axisY.labelInterpolationFnc(value, index),
        pos = chartRect.y1 - chartRect.height() / bounds.values.length * index;

      // If interpolated value returns falsey (except 0) we don't draw the grid line
      if (!interpolatedValue && interpolatedValue !== 0) {
        return;
      }

      if (options.axisY.showGrid) {
        var line = grid.line(chartRect.x1, pos, chartRect.x2, pos);
        line.addClass(options.classNames.grid + ' ' + options.classNames.vertical);
      }

      if (options.axisY.showLabel) {
        // Position later
        //TODO: make padding of 2px configurable
        //TODO: Check for refactoring
        var label = labels.plain('' + interpolatedValue);
        // Reset defaults
        label.attr({
          'font-family': null
        });
        label.dx(options.axisY.labelAlign === 'right' ? offset - options.axisY.offset + options.chartPadding : options.chartPadding);
        label.dy(pos - 2);
        label.addClass(options.classNames.label + ' ' + options.classNames.vertical);

        // Set text-anchor based on alignment
        label.attr({
          'text-anchor': options.axisY.labelAlign === 'right' ? 'end' : 'start'
        });
      }
    });
  };

  Chartist.projectPoint = function (chartRect, bounds, data, index) {
    return {
      x: chartRect.x1 + chartRect.width() / data.length * index,
      y: chartRect.y1 - chartRect.height() * (data[index] - bounds.min) / (bounds.range + bounds.step)
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

  // http://schepers.cc/getting-to-the-point
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

}(document, window));