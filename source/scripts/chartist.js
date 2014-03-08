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
  function alphaNumerize(n) {
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

    // Create points from positions
    createPoints: function (paper, positions, options) {
      var points = [];
      for (var i = 0; i < positions.length; i++) {
        var point = paper.line(positions[i].x, positions[i].y, positions[i].x, positions[i].y);
        if (options.classNames.point) {
          point.node.setAttribute('class', options.classNames.point);

        }
        points.push(point);
      }

      return points;
    },

    // Create lines from positions
    createLines: function (paper, positions, options) {
      var path = 'M' + positions[0].x + ',' + positions[0].y + ' ' + (options.lineSmooth ? 'R' : 'L');
      for (var i = 1; i < positions.length; i++) {
        path += ' ' + positions[i].x + ',' + positions[i].y;
      }

      var snapPath = paper.path(path);
      snapPath.node.setAttribute('class', options.classNames.line);

      return snapPath;
    },

    createLabels: function (paper, labels, positions, options) {
      var labelElements = [];
      for (var i = 0; i < positions.length; i++) {

        // If interpolation function returns falsy value we skipp this label
        var interpolated = options.axisX.labelInterpolationFnc(labels[i]);
        if(!interpolated && interpolated !== 0) {
          continue;
        }

        //TODO: Add possibility to define padding (not using 2 px default)
        var label = paper.text(positions[i].x + 2, positions[i].y, interpolated);
        if (options.classNames.labels) {
          label.node.setAttribute('class', options.classNames.labels);
        }
        labelElements.push(label);
      }

      return labelElements;
    },

    createHorizontalGrid: function (paper, positions, options) {
      var gridElements = [];
      for (var i = 0; i < positions.length; i++) {

        // Add grid line
        var gridElement = paper.line(positions[i].x, positions[i].y, positions[i].x, options.chartPadding);
        if (options.classNames.verticalGridLine) {
          gridElement.node.setAttribute('class', options.classNames.verticalGridLine);
        }
        gridElements.push(gridElement);
      }

      return gridElements;
    },

    createVerticalGrid: function (paper, bounds, options) {
      var gridElements = [];
      for (var i = bounds.min; i <= bounds.max; i += bounds.step) {
        // Add grid line
        var gridLineY = ChartHelpers.projectPoint(paper, i, bounds, options);
        var gridElement = paper.line(options.chartPadding, gridLineY, getWidth(paper.node) - options.chartPadding, gridLineY);
        if (options.classNames.horizontalGridLine) {
          gridElement.node.setAttribute('class', options.classNames.horizontalGridLine);
        }
        gridElements.push(gridElement);
      }

      return gridElements;
    },

    orderOfMagnitude: function (value) {
      return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
    },

    projectPoint: function (paper, value, bounds, options) {
      var availableHeight = ChartHelpers.getAvailableHeight(paper, options);
      return availableHeight - (value / bounds.range * availableHeight) + options.chartPadding + (bounds.min / bounds.range * availableHeight);
    },

    projectLength: function (paper, length, bounds, options) {
      var availableHeight = ChartHelpers.getAvailableHeight(paper, options);
      return (length / bounds.range * availableHeight);
    },

    getAvailableHeight: function (paper, options) {
      return getHeight(paper.node) - (options.chartPadding * 2) - options.axisX.labelOffset;
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

      return bounds;
    }
  };


  // Chartist closure constructor
  window.Chartist = window.Chartist || function (query, data, options) {

    var defaultOptions = {
        axisX: {
          showLabel: true,
          showGrid: true,
          labelOffset: 40,
          labelInterpolationFnc: noop
        },
        axisY: {
          showLabel: true,
          showGrid: true,
          labelOffset: 40,
          labelInterpolationFnc: noop,
          scaleMinSpace: 40
        },
        showLines: true,
        showPoint: true,
        lineSmooth: true,
        chartPadding: 20,
        classNames: {
          labels: 'ct-label',
          series: 'ct-series',
          line: 'ct-line',
          point: 'ct-point',
          verticalGridLine: 'ct-vertical-grid',
          horizontalGridLine: 'ct-horizontal-grid'
        }
      },
      baseOptions = extend(extend({}, defaultOptions), options),
      responsiveOptions = arguments[3] || false,
      paper = Snap(query),
      dataArray = ChartHelpers.normalizeDataArray(ChartHelpers.getDataArray(data), data.labels.length),
      i,
      j;

    function createChart() {
      var options,
        positions = [],
        labelPositions = [],
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

      // initialize series groups and position array
      for (j = 0; j < data.series.length; j++) {
        seriesGroups[j] = paper.g();
        // Use series class from series data or if not set generate one
        seriesGroups[j].node.setAttribute('class', options.classNames.series + ' '
          + (data.series[j].className || options.classNames.series + '-' + alphaNumerize(j)));
        positions[j] = [];
      }

      for (i = 0; i < data.labels.length; i++) {
        for (j = 0; j < dataArray.length; j++) {
          positions[j][i] = {
            x: ((getWidth(paper.node) - options.chartPadding * 2) / data.labels.length * i) + options.chartPadding,
            y: ChartHelpers.projectPoint(paper, dataArray[j][i], bounds, options)
          };

          labelPositions[i] = {
            x: ((getWidth(paper.node) - options.chartPadding * 2) / data.labels.length * i) + options.chartPadding,
            y: getHeight(paper.node) - options.chartPadding
          };
        }
      }

      // Create SVG objects based on positions
      // TODO: Optimize performance so we only loop once

      // First draw the grids
      if (options.axisX.showGrid) {
        var verticalGrid = paper.g();
        verticalGrid.add(ChartHelpers.createHorizontalGrid(paper, labelPositions, options));
        verticalGrid.prependTo(paper);
      }

      if (options.axisY.showGrid) {
        var horizontalGrid = paper.g();
        horizontalGrid.add(ChartHelpers.createVerticalGrid(paper, bounds, options));
        horizontalGrid.prependTo(paper);
      }

      // Draw the series
      for (j = 0; j < data.series.length; j++) {
        if (options.showLines) {
          seriesGroups[j].add(ChartHelpers.createLines(paper, positions[j], options));
        }

        if (options.showPoint) {
          seriesGroups[j].add(ChartHelpers.createPoints(paper, positions[j], options));
        }
      }

      if (options.axisX.showLabel) {
        var labels = paper.g();
        labels.add(ChartHelpers.createLabels(paper, data.labels, labelPositions, options));
        labels.appendTo(paper);
      }
    }

    // Do important checks and throw if necessary
    if (!paper) {
      throw 'Could not instantiate Snap.js with query "' + query + '"';
    }

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
      update: function() {
        createChart();
      }
    };
  };
}(document, window));