//TODO: The whole library needs to be extracted into its own library project and not together with the website / documentation
//TODO: Add more chart types!
//TODO: Refactor methods to simplify structure
(function (document, window, undefined) {
  'use strict';

  // Helps to simplify functional style code
  function noop(n) {
    return n;
  }

  // Generates a-z from number
  function alphaNumerate(n) {
    // Limit to a-z
    return String.fromCharCode(97 + n%26);
  }

  // Some utility functions
  function extend(target, source) {
    target = target || {};
    for (var prop in source) {
      if (typeof source[prop] === 'object') {
        target[prop] = extend(target[prop], source[prop]);
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }

  // Get element height / width with fallback to SVGAnimatedLength
  function getHeight(svgElement) {
    if (svgElement.clientHeight) {
      return svgElement.clientHeight;
    } else {
      try {
        return svgElement.height.baseVal.value;
      } catch (e) {
      }
    }

    return 0;
  }

  function getWidth(svgElement) {
    if (svgElement.clientWidth) {
      return svgElement.clientWidth;
    } else {
      try {
        return svgElement.width.baseVal.value;
      } catch (e) {
      }
    }

    return 0;
  }

  var ChartHelpers = {
    // Internal functions
    getDataArray: function (data) {
      var array = [];

      for (var i = 0; i < data.series.length; i++) {
        array[i] = data.series[i].data;
      }

      return array;
    },

    // Add missing values at the end of the arrays
    normalizeDataArray: function (dataArray, length) {
      for (var i = 0; i < dataArray.length; i++) {
        if (dataArray[i].length === length) {
          continue;
        }

        for (var j = dataArray[i].length; j < length; j++) {
          dataArray[i][j] = 0;
        }
      }

      return dataArray;
    },

    orderOfMagnitude: function (value) {
      return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
    },

    projectLength: function (paper, length, bounds, options) {
      var availableHeight = ChartHelpers.getAvailableHeight(paper, options);
      return (length / bounds.range * availableHeight);
    },

    getAvailableHeight: function (paper, options) {
      return getHeight(paper.node) - (options.chartPadding * 2) - options.axisX.offset;
    },

    // Find the highest and lowest values in a two dimensional array and calculate scale based on order of magnitude
    getBounds: function (paper, dataArray, options) {
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
      bounds.oom = ChartHelpers.orderOfMagnitude(bounds.valueRange);
      bounds.min = Math.floor(bounds.low / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
      bounds.max = Math.ceil(bounds.high / Math.pow(10, bounds.oom)) * Math.pow(10, bounds.oom);
      bounds.range = bounds.max - bounds.min;
      bounds.step = Math.pow(10, bounds.oom);
      bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

      // Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
      while (true) {
        var length = ChartHelpers.projectLength(paper, bounds.step / 2, bounds, options);
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
    }
  };


  // Chartist closure constructor
  window.Chartist = window.Chartist || function (query, data, options, responsiveOptions) {

    var defaultOptions = {
        axisX: {
          offset: 5,
          showLabel: true,
          showGrid: true,
          labelInterpolationFnc: noop
        },
        axisY: {
          offset: 5,
          showLabel: true,
          showGrid: true,
          labelAlign: 'right',
          labelInterpolationFnc: noop,
          scaleMinSpace: 20
        },
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
      baseOptions = extend(extend({}, defaultOptions), options),
      container = document.querySelector(query),
      paper,
      dataArray = ChartHelpers.normalizeDataArray(ChartHelpers.getDataArray(data), data.labels.length),
      i;

    function createChart() {
      var options,
        xAxisOffset = 0,
        yAxisOffset = 0,
        seriesGroups = [],
        bounds;

      // Clear the stage
      paper.clear();

      // Construct current options based on responsive option overrides (overrides in sequence of responsiveOptions)
      options = extend({}, baseOptions);
      if (responsiveOptions) {
        for (i = 0; i < responsiveOptions.length; i++) {
          var mql = window.matchMedia(responsiveOptions[i][0]);
          if (mql.matches) {
            options = extend(options, responsiveOptions[i][1]);
          }
        }
      }

      // initialize bounds
      bounds = ChartHelpers.getBounds(paper, dataArray, options);

      function calculateLabelOffset(data, labelClass, labelInterpolationFnc, offsetFnc) {
        var offset = 0;
        for (var i = 0; i < data.length; i++) {
          // If interpolation function returns falsy value we skipp this label
          var interpolated = labelInterpolationFnc(data[i], i);
          if(!interpolated && interpolated !== 0) {
            continue;
          }

          var label = paper.text(0, 0, ''+interpolated);
          label.node.setAttribute('class', labelClass);

          // Check if this is the largest label and update offset
          offset = Math.max(offset, offsetFnc(label.node));
          // Remove label after offset Calculation
          label.remove();
        }

        return offset;
      }

      // First generate labels to calculate max offset for chart
      if (options.axisX.showLabel) {
        xAxisOffset = calculateLabelOffset(data.labels, options.classNames.labelX, options.axisX.labelInterpolationFnc, getHeight);
      }
      xAxisOffset += options.axisX.offset;

      if (options.axisY.showLabel) {
        yAxisOffset = calculateLabelOffset(bounds.values, options.classNames.labelY, options.axisY.labelInterpolationFnc, getWidth);
      }
      yAxisOffset += options.axisY.offset;

      // Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
      var chartRect = {
        x1: yAxisOffset + options.chartPadding,
        y1: getHeight(paper.node) - xAxisOffset - options.chartPadding,
        x2: getWidth(paper.node) - options.chartPadding,
        y2: options.chartPadding,
        width: function() {
          return this.x2 - this.x1;
        },
        height: function() {
          return this.y1 - this.y2;
        }
      };

      // Start drawing
      var labels = paper.g(),
        grid = paper.g();

      function interpolateData(data, labelInterpolationFnc, callback) {
        for (var index = 0; index < data.length; index++) {
          // If interpolation function returns falsy value we skipp this label
          var interpolatedValue = labelInterpolationFnc(data[index], index);
          if(!interpolatedValue && interpolatedValue !== 0) {
            continue;
          }

          callback(data, index, interpolatedValue);
        }
      }

      interpolateData(data.labels, options.axisX.labelInterpolationFnc, function(data, index, interpolatedValue) {
        var pos = chartRect.x1 + chartRect.width() / data.length * index;

        if (options.axisX.showGrid) {
          var line = paper.line(pos, chartRect.y1, pos, chartRect.y2);
          line.node.setAttribute('class', options.classNames.grid + ' ' + options.classNames.horizontal);
          grid.add(line);
        }

        if (options.axisX.showLabel) {
          // Use config offset for setting labels of
          var label = paper.text(pos + 2, chartRect.y1 + options.axisX.offset, ''+interpolatedValue);
          // Set alignment baseline to hanging (text is below specified Y coordinate)
          label.attr({
            'alignment-baseline': 'hanging'
          });
          label.node.setAttribute('class', options.classNames.label + ' ' + options.classNames.horizontal);
          labels.add(label);
        }
      });

      interpolateData(bounds.values, options.axisY.labelInterpolationFnc, function(data, index, interpolatedValue) {
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
            pos - 2, ''+interpolatedValue);
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
        if(options.showPoint) {
          point = paper.line(p.x, p.y, p.x, p.y);
          point.node.setAttribute('class', options.classNames.point);
          seriesGroup.append(point);
        }

        // First point is created, continue with rest
        for (var i = 1; i < data.length; i++) {
          p = projectPointFnc(data, i);
          path += ' ' + p.x + ',' + p.y;

          //If we should show points we need to create them now to avoid secondary loop
          if(options.showPoint) {
            point = paper.line(p.x, p.y, p.x, p.y);
            point.node.setAttribute('class', options.classNames.point);
            seriesGroup.append(point);
          }
        }

        if(options.showLine) {
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
          (data.series[i].className || options.classNames.series + '-' + alphaNumerate(i)));

        createSeries(data.series[i].data, seriesGroups[i], projectPoint);

        paper.add(seriesGroups[i]);
      }
    }



    // Do important checks and throw if necessary
    if (!container) {
      throw 'Container node with selector "' + query + '" not found';
    }

    paper = Snap();
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
      version: '0.2',
      update: function() {
        createChart();
      }
    };
  };
}(document, window));