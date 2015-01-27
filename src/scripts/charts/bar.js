/**
 * The bar chart module of Chartist that can be used to draw unipolar or bipolar bar and grouped bar charts.
 *
 * @module Chartist.Bar
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';

  /**
   * Default options in bar charts. Expand the code view to see a detailed list of options with comments.
   *
   * @memberof Chartist.Bar
   */
  var defaultOptions = {
    // Options for X-Axis
    axisX: {
      // The offset of the chart drawing area to the border of the container
      offset: 30,
      // Allows you to correct label positioning on this axis by positive or negative x and y offset.
      labelOffset: {
        x: 0,
        y: 0
      },
      // If labels should be shown or not
      showLabel: true,
      // If the axis grid should be drawn or not
      showGrid: true,
      // Interpolation function that allows you to intercept the value from the axis label
      labelInterpolationFnc: Chartist.noop
    },
    // Options for Y-Axis
    axisY: {
      // The offset of the chart drawing area to the border of the container
      offset: 40,
      // Allows you to correct label positioning on this axis by positive or negative x and y offset.
      labelOffset: {
        x: 0,
        y: 0
      },
      // If labels should be shown or not
      showLabel: true,
      // If the axis grid should be drawn or not
      showGrid: true,
      // Interpolation function that allows you to intercept the value from the axis label
      labelInterpolationFnc: Chartist.noop,
      // This value specifies the minimum height in pixel of the scale steps
      scaleMinSpace: 20
    },
    // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
    width: undefined,
    // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
    height: undefined,
    // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
    high: undefined,
    // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
    low: undefined,
    // Padding of the chart drawing area to the container element and labels
    chartPadding: 5,
    // Specify the distance in pixel of bars in a group
    seriesBarDistance: 15,
    // When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler. For bar charts this might be used in conjunction with the centerBars property set to false.
    fullWidth: false,
    // This property will cause the bars of the bar chart to be drawn on the grid line rather than between two grid lines. This is useful for single series bar charts and might be used in conjunction with the fullWidth property.
    centerBars: true,
    // If set to true this property will cause the series bars to be stacked and form a total for each series point. This will also influence the y-axis and the overall bounds of the chart. In stacked mode the seriesBarDistance property will have no effect.
    stackBars: false,
    // Override the class names that get used to generate the SVG structure of the chart
    classNames: {
      chart: 'ct-chart-bar',
      label: 'ct-label',
      labelGroup: 'ct-labels',
      series: 'ct-series',
      bar: 'ct-bar',
      grid: 'ct-grid',
      gridGroup: 'ct-grids',
      vertical: 'ct-vertical',
      horizontal: 'ct-horizontal'
    }
  };

  /**
   * Creates a new chart
   *
   */
  function createChart(options) {
    var seriesGroups = [],
      projectedValues,
      normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length),
      highLow;

    // Create new svg element
    this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

    if(options.stackBars) {
      // If stacked bars we need to calculate the high low from stacked values from each series
      var serialSums = Chartist.serialMap(normalizedData, function serialSums() {
        return Array.prototype.slice.call(arguments).reduce(Chartist.sum, 0);
      });

      highLow = Chartist.getHighLow([serialSums]);
    } else {
      highLow = Chartist.getHighLow(normalizedData);
    }
    // Overrides of high / low from settings
    highLow.high = +options.high || (options.high === 0 ? 0 : highLow.high);
    highLow.low = +options.low || (options.low === 0 ? 0 : highLow.low);

    var chartRect = Chartist.createChartRect(this.svg, options);

    var axisX = new Chartist.StepAxis(
      Chartist.Axis.units.x,
      chartRect.x2 - chartRect.x1, {
        stepCount: this.data.labels.length,
        stretch: options.fullWidth
      }
    );

    var axisY = new Chartist.LinearScaleAxis(
      Chartist.Axis.units.y,
      chartRect.y1 - chartRect.y2, {
        highLow: highLow,
        scaleMinSpace: options.axisY.scaleMinSpace,
        referenceValue: 0
      }
    );

    // Start drawing
    var labelGroup = this.svg.elem('g').addClass(options.classNames.labelGroup),
      gridGroup = this.svg.elem('g').addClass(options.classNames.gridGroup),
      // Projected 0 point
      zeroPoint = chartRect.y1 - axisY.projectValue(0).pos,
      // Used to track the screen coordinates of stacked bars
      stackedBarValues = [];

    Chartist.drawAxis(
      axisX,
      this.data.labels,
      function(projectedValue) {
        projectedValue.pos = chartRect.x1 + projectedValue.pos;
        return projectedValue;
      },
      chartRect,
      gridGroup,
      chartRect.y2,
      labelGroup,
      {
        x: options.axisX.labelOffset.x,
        y: chartRect.y1 + options.axisX.labelOffset.y + (this.supportsForeignObject ? 5 : 20)
      },
      this.supportsForeignObject,
      options,
      this.eventEmitter
    );

    Chartist.drawAxis(
      axisY,
      axisY.bounds.values,
      function(projectedValue) {
        projectedValue.pos = chartRect.y1 - projectedValue.pos;
        return projectedValue;
      },
      chartRect,
      gridGroup,
      chartRect.x1,
      labelGroup, {
        x: options.chartPadding + options.axisY.labelOffset.x + (this.supportsForeignObject ? -10 : 0),
        y: options.axisY.labelOffset.y + (this.supportsForeignObject ? -15 : 0)
      },
      this.supportsForeignObject,
      options,
      this.eventEmitter
    );

    // Draw the series
    this.data.series.forEach(function(series, seriesIndex) {
      // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
      var biPol = seriesIndex - (this.data.series.length - 1) / 2,
      // Half of the period width between vertical grid lines used to position bars
        periodHalfWidth = chartRect.width() / (normalizedData[seriesIndex].length - (options.fullWidth ? 1 : 0)) / 2;

      seriesGroups[seriesIndex] = this.svg.elem('g');

      // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
      seriesGroups[seriesIndex].attr({
        'series-name': series.name,
        'meta': Chartist.serialize(series.meta)
      }, Chartist.xmlNs.uri);

      // Use series class from series data or if not set generate one
      seriesGroups[seriesIndex].addClass([
        options.classNames.series,
        (series.className || options.classNames.series + '-' + Chartist.alphaNumerate(seriesIndex))
      ].join(' '));

      normalizedData[seriesIndex].forEach(function(value, valueIndex) {
        var p = {
              x: chartRect.x1 + axisX.projectValue(value, valueIndex, normalizedData[seriesIndex]).pos,
              y: chartRect.y1 - axisY.projectValue(value, valueIndex, normalizedData[seriesIndex]).pos
            },
          bar,
          previousStack,
          y1,
          y2;

        // Offset to center bar between grid lines
        p.x += (options.centerBars ? periodHalfWidth : 0);
        // Using bi-polar offset for multiple series if no stacked bars are used
        p.x += options.stackBars ? 0 : biPol * options.seriesBarDistance;

        // Enter value in stacked bar values used to remember previous screen value for stacking up bars
        previousStack = stackedBarValues[valueIndex] || zeroPoint;
        stackedBarValues[valueIndex] = previousStack - (zeroPoint - p.y);

        // If bars are stacked we use the stackedBarValues reference and otherwise base all bars off the zero line
        y1 = options.stackBars ? previousStack : zeroPoint;
        y2 = options.stackBars ? stackedBarValues[valueIndex] : p.y;

        bar = seriesGroups[seriesIndex].elem('line', {
          x1: p.x,
          y1: y1,
          x2: p.x,
          y2: y2
        }, options.classNames.bar).attr({
          'value': value,
          'meta': Chartist.getMetaData(series, valueIndex)
        }, Chartist.xmlNs.uri);

        this.eventEmitter.emit('draw', {
          type: 'bar',
          value: value,
          index: valueIndex,
          group: seriesGroups[seriesIndex],
          element: bar,
          x1: p.x,
          y1: y1,
          x2: p.x,
          y2: y2
        });
      }.bind(this));
    }.bind(this));

    this.eventEmitter.emit('created', {
      bounds: axisY.bounds,
      chartRect: chartRect,
      svg: this.svg,
      options: options
    });
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
      Chartist.extend({}, defaultOptions, options),
      responsiveOptions);
  }

  // Creating bar chart type in Chartist namespace
  Chartist.Bar = Chartist.Base.extend({
    constructor: Bar,
    createChart: createChart
  });

}(window, document, Chartist));
