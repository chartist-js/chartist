/**
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
      currentOptions,
      svg;

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new svg element
      svg = Chartist.createSvg(query, options.width, options.height, options.classNames.chart);

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
          }, options.classNames.bar + (data.series[i].barClasses ? ' ' + data.series[i].barClasses : ''));
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
