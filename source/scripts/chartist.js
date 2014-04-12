(function (document, window, undefined) {
  'use strict';

  // Export chartist namespace
  var Chartist = window.Chartist = window.Chartist || {};

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

  // Line chart constructor
  window.Chartist.Line = window.Chartist.Line || function (query, data, options, responsiveOptions) {

    var defaultOptions = {
        axisX: {
          offset: 0,
          showLabel: true,
          showGrid: true,
          labelInterpolationFnc: Chartist.noop
        },
        axisY: {
          offset: 5,
          showLabel: true,
          showGrid: true,
          labelAlign: 'right',
          labelInterpolationFnc: Chartist.noop,
          scaleMinSpace: 20
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
      baseOptions = Chartist.extend(Chartist.extend({}, defaultOptions), options),
      container = document.querySelector(query),
      paper,
      dataArray = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length),
      i;

    function createChart() {
      var options,
        xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds;

      // Clear the stage
      paper.clear();

      // Construct current options based on responsive option overrides (overrides in sequence of responsiveOptions)
      options = Chartist.extend({}, baseOptions);
      if (responsiveOptions) {
        for (i = 0; i < responsiveOptions.length; i++) {
          var mql = window.matchMedia(responsiveOptions[i][0]);
          if (mql.matches) {
            options = Chartist.extend(options, responsiveOptions[i][1]);
          }
        }
      }

      // initialize bounds
      bounds = Chartist.getBounds(paper, dataArray, options);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          paper,
          data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          Chartist.getHeight
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          paper,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          Chartist.getWidth
        );
      }

      var chartRect = Chartist.createChartRect(paper, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = paper.g(),
        grid = paper.g();

      // Create X-Axis
      Chartist.interpolateData(data.labels, options.axisX.labelInterpolationFnc, function (data, index, interpolatedValue) {
        var pos = chartRect.x1 + chartRect.width() / data.length * index;

        if (options.axisX.showGrid) {
          var line = paper.line(pos, chartRect.y1, pos, chartRect.y2);
          line.node.setAttribute('class', [options.classNames.grid, options.classNames.horizontal].join(' '));
          grid.add(line);
        }

        if (options.axisX.showLabel) {
          // Use config offset for setting labels of
          var label = paper.text(pos + 2, 0, '' + interpolatedValue);
          label.node.setAttribute('class', [options.classNames.label, options.classNames.horizontal].join(' '));

          // TODO: should use 'alignment-baseline': 'hanging' but not supported in firefox. Instead using calculated height to offset y pos
          label.attr({
            y: chartRect.y1 + Chartist.getHeight(label.node) + options.axisX.offset
          });

          labels.add(label);
        }
      });

      // Create Y-Axis
      Chartist.interpolateData(bounds.values, options.axisY.labelInterpolationFnc, function (data, index, interpolatedValue) {
        var pos = chartRect.y1 - chartRect.height() / data.length * index;

        if (options.axisY.showGrid) {
          var line = paper.line(chartRect.x1, pos, chartRect.x2, pos);
          line.node.setAttribute('class', options.classNames.grid + ' ' + options.classNames.vertical);
          grid.add(line);
        }

        if (options.axisY.showLabel) {
          // Position later
          //TODO: make padding of 2px configurable
          var label = paper.text(options.axisY.labelAlign === 'right' ? yAxisOffset - options.axisY.offset + options.chartPadding : options.chartPadding,
            pos - 2, '' + interpolatedValue);
          label.node.setAttribute('class', options.classNames.label + ' ' + options.classNames.vertical);

          // Set text-anchor based on alignment
          label.attr({
            'text-anchor': options.axisY.labelAlign === 'right' ? 'end' : 'start'
          });

          labels.add(label);
        }
      });

      function createSeries(data, seriesGroup, projectPointFnc) {
        var p = projectPointFnc(data, 0),
          path = 'M' + p.x + ',' + p.y + ' ' + (options.lineSmooth ? 'R' : 'L'),
          point;

        // First dot we need to add before loop
        if (options.showPoint) {
          point = paper.line(p.x, p.y, p.x, p.y);
          point.node.setAttribute('class', options.classNames.point);
          seriesGroup.append(point);
        }

        // First point is created, continue with rest
        for (var i = 1; i < data.length; i++) {
          p = projectPointFnc(data, i);
          path += ' ' + p.x + ',' + p.y;

          //If we should show points we need to create them now to avoid secondary loop
          if (options.showPoint) {
            point = paper.line(p.x, p.y, p.x, p.y);
            point.node.setAttribute('class', options.classNames.point);
            seriesGroup.append(point);
          }
        }

        if (options.showLine) {
          var snapPath = paper.path(path);
          snapPath.node.setAttribute('class', options.classNames.line);
          seriesGroup.prepend(snapPath);
        }
      }

      function projectPoint(data, index) {
        return {
          x: chartRect.x1 + chartRect.width() / data.length * index,
          y: chartRect.y1 - data[index] / bounds.range * chartRect.height() + (bounds.min / bounds.range * chartRect.height())
        };
      }

      // Draw the series
      // initialize series groups
      for (i = 0; i < data.series.length; i++) {
        seriesGroups[i] = paper.g();
        // Use series class from series data or if not set generate one
        seriesGroups[i].node.setAttribute('class', options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        createSeries(data.series[i].data, seriesGroups[i], projectPoint);

        paper.add(seriesGroups[i]);
      }
    }


    // Do important checks and throw if necessary
    if (!container) {
      throw 'Container node with selector "' + query + '" not found';
    }

    paper = Snap(options.width || '100%', options.height || '100%');
    if (!paper) {
      throw 'Could not instantiate Snap.js!';
    }
    container.appendChild(paper.node);

    if (!window.matchMedia) {
      throw 'window.matchMedia not found! Make sure you\'re using a polyfill.';
    } else if (responsiveOptions) {

      for (i = 0; i < responsiveOptions.length; i++) {
        var mql = window.matchMedia(responsiveOptions[i][0]);
        mql.addListener(createChart);
      }
    }

    createChart();

    // Public members
    return {
      version: '0.0.3',
      update: function () {
        createChart();
      }
    };
  };
}(document, window));