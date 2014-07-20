/* Chartist.js 0.1.4
 * Copyright © 2014 Gion Kunz
 * Free to use under the WTFPL license.
 * http://www.wtfpl.net/
 */
(function (document, window, undefined) {
  'use strict';

  // Export chartist namespace
  var Chartist = window.Chartist = window.Chartist || {};

  Chartist.version = '0.1.4';

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
      // Create svg.js draw with width and height or use 100% as default
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
      // If the series array contains an object with a data property we will use the property
      // otherwise the value directly (array or number)
      array[i] = typeof(data.series[i]) === 'object' && data.series[i].data !== undefined ?
        data.series[i].data : data.series[i];
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
  Chartist.getBounds = function (draw, normalizedData, options, high, low) {
    var i,
      newMin,
      newMax,
      bounds = Chartist.getHighLow(normalizedData);

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

}(document, window));;// Chartist line chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Line = Chartist.Line || function (query, data, options, responsiveOptions) {

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
        lineSmooth: true,
        chartPadding: 5,
        classNames: {
          label: 'ct-label',
          series: 'ct-series',
          line: 'ct-line',
          point: 'ct-point',
          grid: 'ct-grid',
          vertical: 'ct-vertical',
          horizontal: 'ct-horizontal'
        }
      },
      currentOptions,
      draw;

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new draw object
      draw = Chartist.createDraw(query, options.width, options.height);

      // initialize bounds
      bounds = Chartist.getBounds(draw, normalizedData, options);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          draw,
          data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          Chartist.getHeight
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          draw,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          Chartist.getWidth
        );
      }

      var chartRect = Chartist.createChartRect(draw, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = draw.group(),
        grid = draw.group();

      Chartist.createXAxis(chartRect, data, grid, labels, options);
      Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        seriesGroups[i] = draw.group();
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass(options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], 0),
          pathCoordinates = [p.x, p.y],
          point;

        // First dot we need to add before loop
        if (options.showPoint) {
          // Small offset for Firefox to render squares correctly
          point = seriesGroups[i].line(p.x, p.y, p.x + 0.01, p.y);
          point.addClass(options.classNames.point);
        }

        // First point is created, continue with rest
        for (var j = 1; j < normalizedData[i].length; j++) {
          p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j);
          pathCoordinates.push(p.x, p.y);

          //If we should show points we need to create them now to avoid secondary loop
          // Small offset for Firefox to render squares correctly
          if (options.showPoint) {
            point = seriesGroups[i].line(p.x, p.y, p.x + 0.01, p.y);
            point.addClass(options.classNames.point);
          }
        }

        if (options.showLine) {
          var svgPathString = 'M' + pathCoordinates[0] + ',' + pathCoordinates[1] + ' ';

          // If smoothed path and path has more than two points then use catmull rom to bezier algorithm
          if (options.lineSmooth && pathCoordinates.length > 4) {

            var cr = Chartist.catmullRom2bezier(pathCoordinates);
            for(var k = 0; k < cr.length; k++) {
              svgPathString += 'C' + cr[k].join();
            }
          } else {
            for(var l = 3; l < pathCoordinates.length; l += 2) {
              svgPathString += 'L ' + pathCoordinates[l - 1] + ',' + pathCoordinates[l];
            }
          }

          var path = seriesGroups[i].path(svgPathString);
          path.addClass(options.classNames.line);
        }
      }
    }

    // Obtain current options based on matching media queries (if responsive options are given)
    // This will also register a listener that is re-creating the chart based on media changes
    currentOptions = Chartist.optionsProvider(defaultOptions, options, responsiveOptions, function (changedOptions) {
      currentOptions = changedOptions;
      createChart(currentOptions);
    });

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    window.addEventListener('resize', function () {
      createChart(currentOptions);
    });

    // Public members
    return {
      version: Chartist.version,
      update: function () {
        createChart(currentOptions);
      }
    };
  };
}(document, window, window.Chartist));;// Chartist Bar chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Bar = Chartist.Bar || function (query, data, options, responsiveOptions) {

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
        chartPadding: 5,
        seriesBarDistance: 15,
        classNames: {
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
      currentOptions,
      draw;

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new SVG.js draw
      draw = Chartist.createDraw(query, options.width, options.height);

      // initialize bounds
      bounds = Chartist.getBounds(draw, normalizedData, options, null, 0);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          draw,
          data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          Chartist.getHeight
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          draw,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          Chartist.getWidth
        );
      }

      var chartRect = Chartist.createChartRect(draw, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = draw.group(),
        grid = draw.group();

      Chartist.createXAxis(chartRect, data, grid, labels, options);
      Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
        var biPol = i - (data.series.length - 1) / 2,
        // Half of the period with between vertical grid lines used to position bars
          periodHalfWidth = chartRect.width() / normalizedData[i].length / 2;

        seriesGroups[i] = draw.group();
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass(options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        for(var j = 0; j < normalizedData[i].length; j++) {
          var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j),
            bar;

          // Offset to center bar between grid lines and using bi-polar offset for multiple series
          // TODO: Check if we should really be able to add classes to the series. Should be handles with SASS and semantic / specific selectors
          p.x += periodHalfWidth + (biPol * options.seriesBarDistance);

          bar = seriesGroups[i].line(p.x, chartRect.y1, p.x, p.y);
          bar.addClass(options.classNames.bar + (data.series[i].barClasses ? ' ' + data.series[i].barClasses : ''));
        }
      }
    }

    // Obtain current options based on matching media queries (if responsive options are given)
    // This will also register a listener that is re-creating the chart based on media changes
    currentOptions = Chartist.optionsProvider(defaultOptions, options, responsiveOptions, function (changedOptions) {
      currentOptions = changedOptions;
      createChart(currentOptions);
    });

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    window.addEventListener('resize', function () {
      createChart(currentOptions);
    });

    // Public members
    return {
      version: Chartist.version,
      update: function () {
        createChart(currentOptions);
      }
    };
  };
}(document, window, window.Chartist));;// Chartist line chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Pie = Chartist.Pie || function (query, data, options, responsiveOptions) {

    var defaultOptions = {
        width: undefined,
        height: undefined,
        chartPadding: 5,
        classNames: {
          series: 'ct-series',
          slice: 'ct-slice',
          donut: 'ct-donut'
        },
        startAngle: 0,
        total: undefined,
        donut: false,
        donutWidth: 60
      },
      currentOptions,
      draw;

    function createChart(options) {
      var seriesGroups = [],
        chartRect,
        radius,
        totalDataSum,
        startAngle = options.startAngle,
        dataArray = Chartist.getDataArray(data);

      // Create SVG.js draw
      draw = Chartist.createDraw(query, options.width, options.height);
      // Calculate charting rect
      chartRect = Chartist.createChartRect(draw, options, 0, 0);
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

      // Calculate end angle based on total sum and current data value and offset with padding
      var center = {
        x: chartRect.x1 + chartRect.width() / 2,
        y: chartRect.y2 + chartRect.height() / 2
      };

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        seriesGroups[i] = draw.group();
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass(options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        var endAngle = startAngle + dataArray[i] / totalDataSum * 360;
        // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
        // with Z and use 359.99 degrees
        if(endAngle - startAngle === 360) {
          endAngle -= 0.01;
        }

        var start = Chartist.polarToCartesian(center.x, center.y, radius, startAngle - (i === 0 ? 0 : 0.2)),
        end = Chartist.polarToCartesian(center.x, center.y, radius, endAngle),
        arcSweep = endAngle - startAngle <= 180 ? '0' : '1',
        d =  [
          // Start at the end point from the cartesian coordinates
          'M', end.x, end.y,
          // Draw arc
          'A', radius, radius, 0, arcSweep, 0, start.x, start.y
        ];

        // If regular pie chart (no donut) we add a line to the center of the circle for completing the pie
        if(options.donut === false) {
          d.push('L', center.x, center.y);
        }

        // Create the SVG path with snap
        var path = seriesGroups[i].path(d.join(' '));

        // If this is a donut chart we add the donut class, otherwise just a regular slice
        path.addClass(options.classNames.slice + (options.donut ? ' ' + options.classNames.donut : ''));

        if(options.donut === true) {
          path.attr({
            'style': 'stroke-width: ' + (+options.donutWidth) + 'px'
          });
        }

        // Set next startAngle to current endAngle. Use slight offset so there are no transparent hairline issues
        // (except for last slice)
        startAngle = endAngle;
      }
    }

    // Obtain current options based on matching media queries (if responsive options are given)
    // This will also register a listener that is re-creating the chart based on media changes
    currentOptions = Chartist.optionsProvider(defaultOptions, options, responsiveOptions, function (changedOptions) {
      currentOptions = changedOptions;
      createChart(currentOptions);
    });

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    window.addEventListener('resize', function () {
      createChart(currentOptions);
    });

    // Public members
    return {
      version: Chartist.version,
      update: function () {
        createChart(currentOptions);
      }
    };
  };
}(document, window, window.Chartist));