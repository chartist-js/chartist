/**
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
   * @param {string|HTMLElement} query A selector query string or directly a DOM element
   * @param {object} data The data object that needs to consist of a labels and a series array
   * @param {object} [options] The options object with options that override the default options. Check the examples for a detailed list.
   * @param {array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return {object} An object with a version and an update method to manually redraw the chart
   * @function
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
   *   // Override the class names that get used to generate the SVG structure of the chart
   *   classNames: {
   *     chart: 'ct-chart-line',
   *     label: 'ct-label',
   *     series: 'ct-series',
   *     line: 'ct-line',
   *     point: 'ct-point',
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
          grid: 'ct-grid',
          vertical: 'ct-vertical',
          horizontal: 'ct-horizontal'
        }
      },
      currentOptions,
      svg;

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new svg object
      svg = Chartist.createSvg(query, options.width, options.height, options.classNames.chart);

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
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
        ].join(' '));

        var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], 0),
          pathCoordinates = [p.x, p.y],
          point;

        // First dot we need to add before loop
        if (options.showPoint) {
          // Small offset for Firefox to render squares correctly
          point = seriesGroups[i].elem('line', {
            x1: p.x,
            y1: p.y,
            x2: p.x + 0.01,
            y2: p.y
          }, options.classNames.point);
        }

        // First point is created, continue with rest
        for (var j = 1; j < normalizedData[i].length; j++) {
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
            }, options.classNames.point);
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

          seriesGroups[i].elem('path', {
            d: svgPathString
          }, options.classNames.line);
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

}(window, document, Chartist));
