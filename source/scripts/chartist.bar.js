/**
 * The bar chart module of Chartist that can be used to draw unipolar or bipolar bar and grouped bar charts.
 *
 * @module Chartist.Bar
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';

  var defaultOptions = {
    axisX: {
      offset: 30,
      labelOffset: {
        x: 0,
        y: 0
      },
      showLabel: true,
      showGrid: true,
      labelInterpolationFnc: Chartist.noop
    },
    axisY: {
      offset: 40,
      labelOffset: {
        x: 0,
        y: 0
      },
      showLabel: true,
      showGrid: true,
      labelInterpolationFnc: Chartist.noop,
      scaleMinSpace: 30
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
      grid: 'ct-grid',
      vertical: 'ct-vertical',
      horizontal: 'ct-horizontal'
    }
  };

  function createChart(options) {
    var seriesGroups = [],
      bounds,
      normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length);

    // Create new svg element
    this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

    // initialize bounds
    bounds = Chartist.getBounds(this.svg, normalizedData, options, 0);

    var chartRect = Chartist.createChartRect(this.svg, options);
    // Start drawing
    var labels = this.svg.elem('g'),
      grid = this.svg.elem('g'),
    // Projected 0 point
      zeroPoint = Chartist.projectPoint(chartRect, bounds, [0], 0);

    Chartist.createXAxis(chartRect, this.data, grid, labels, options, this.eventEmitter, this.supportsForeignObject);
    Chartist.createYAxis(chartRect, bounds, grid, labels, options, this.eventEmitter, this.supportsForeignObject);

    // Draw the series
    // initialize series groups
    for (var i = 0; i < this.data.series.length; i++) {
      // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
      var biPol = i - (this.data.series.length - 1) / 2,
      // Half of the period with between vertical grid lines used to position bars
        periodHalfWidth = chartRect.width() / normalizedData[i].length / 2;

      seriesGroups[i] = this.svg.elem('g');

      // If the series is an object and contains a name we add a custom attribute
      if(this.data.series[i].name) {
        seriesGroups[i].attr({
          'series-name': this.data.series[i].name
        }, Chartist.xmlNs.uri);
      }

      // Use series class from series data or if not set generate one
      seriesGroups[i].addClass([
        options.classNames.series,
        (this.data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
      ].join(' '));

      for(var j = 0; j < normalizedData[i].length; j++) {
        var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j),
          bar;

        // Offset to center bar between grid lines and using bi-polar offset for multiple series
        // TODO: Check if we should really be able to add classes to the series. Should be handles with Sass and semantic / specific selectors
        p.x += periodHalfWidth + (biPol * options.seriesBarDistance);

        bar = seriesGroups[i].elem('line', {
          x1: p.x,
          y1: zeroPoint.y,
          x2: p.x,
          y2: p.y
        }, options.classNames.bar).attr({
          'value': normalizedData[i][j]
        }, Chartist.xmlNs.uri);

        this.eventEmitter.emit('draw', {
          type: 'bar',
          value: normalizedData[i][j],
          index: j,
          group: seriesGroups[i],
          element: bar,
          x1: p.x,
          y1: zeroPoint.y,
          x2: p.x,
          y2: p.y
        });
      }
    }
  }

  /**
   * This method creates a new bar chart and returns API object that you can use for later changes.
   *
   * @memberof Chartist.Bar
   * @param {String|Node} query A selector query string or directly a DOM element
   * @param {Object} data The data object that needs to consist of a labels and a series array
   * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
   * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return {Object} An object which exposes the API for the created chart
   *
   * @example
   * // These are the default options of the bar chart
   * var options = {
   *   // Options for X-Axis
   *   axisX: {
   *     // The offset of the chart drawing area to the border of the container
   *     offset: 30,
   *     // Allows you to correct label positioning on this axis by positive or negative x and y offset.
   *     labelOffset: {
   *       x: 0,
   *       y: 0
   *     },
   *     // If labels should be shown or not
   *     showLabel: true,
   *     // If the axis grid should be drawn or not
   *     showGrid: true,
   *     // Interpolation function that allows you to intercept the value from the axis label
   *     labelInterpolationFnc: function(value){return value;}
   *   },
   *   // Options for Y-Axis
   *   axisY: {
   *     // The offset of the chart drawing area to the border of the container
   *     offset: 40,
   *     // Allows you to correct label positioning on this axis by positive or negative x and y offset.
   *     labelOffset: {
   *       x: 0,
   *       y: 0
   *     },
   *     // If labels should be shown or not
   *     showLabel: true,
   *     // If the axis grid should be drawn or not
   *     showGrid: true,
   *     // Interpolation function that allows you to intercept the value from the axis label
   *     labelInterpolationFnc: function(value){return value;},
   *     // This value specifies the minimum height in pixel of the scale steps
   *     scaleMinSpace: 30
   *   },
   *   // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
   *   width: undefined,
   *   // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
   *   height: undefined,
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
   * new Chartist.Bar('.ct-chart', data);
   *
   * @example
   * // This example creates a bipolar grouped bar chart where the boundaries are limitted to -10 and 10
   * new Chartist.Bar('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5, 6, 7],
   *   series: [
   *     [1, 3, 2, -5, -3, 1, -6],
   *     [-5, -2, -4, -1, 2, -3, 1]
   *   ]
   * }, {
   *   seriesBarDistance: 12,
   *   low: -10,
   *   high: 10
   * });
   *
   */
  function Bar(query, data, options, responsiveOptions) {
    Chartist.Bar.super.constructor.call(this,
      query,
      data,
      Chartist.extend(Chartist.extend({}, defaultOptions), options),
      responsiveOptions);
  }

  // Creating bar chart type in Chartist namespace
  Chartist.Bar = Chartist.Base.extend({
    constructor: Bar,
    createChart: createChart
  });

}(window, document, Chartist));
