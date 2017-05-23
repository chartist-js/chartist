/**
 * The candle stick chart module of Chartist that can be used to draw candle stick charts.
 *
 * @module Chartist.Candle
 *
 * @author Simon Pfeifer
 * @since May 2017 (Chartist v0.11.0)
 * @version 0.0.1
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  /**
   * Default options in candle stick charts. Expand the code view to see a detailed list of options with comments.
   *
   * @memberof Chartist.Candle
   */
  var defaultOptions = {
    // Options for X-Axis
    axisX: {
      // The offset of the chart drawing area to the border of the container
      offset: 30,
      // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
      position: 'end',
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
      // Set the axis type to be used to project values on this axis. If not defined, Chartist.StepAxis will be used for the X-Axis, where the ticks option will be set to the labels in the data and the stretch option will be set to the global fullWidth option. This type can be changed to any axis constructor available (e.g. Chartist.FixedScaleAxis), where all axis options should be present here.
      type: undefined
    },
    // Options for Y-Axis
    axisY: {
      // The offset of the chart drawing area to the border of the container
      offset: 40,
      // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
      position: 'start',
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
      // Set the axis type to be used to project values on this axis. If not defined, Chartist.StepAxis will be used for the X-Axis, where the ticks option will be set to the labels in the data and the stretch option will be set to the global fullWidth option. This type can be changed to any axis constructor available (e.g. Chartist.FixedScaleAxis), where all axis options should be present here.
      type: undefined
    },
    // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
    width: undefined,
    // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
    height: undefined,
    // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
    high: undefined,
    // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
    low: undefined,
    // Width of candle body in pixel
    candleWidth: 10,
    // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
    chartPadding: {
      top: 15,
      right: 15,
      bottom: 5,
      left: 10
    },
    // When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler.
    fullWidth: false,
    // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
    reverseData: false,
    // Override the class names that get used to generate the SVG structure of the chart
    classNames: {
      chart: 'ct-chart-candle',
      label: 'ct-label',
      labelGroup: 'ct-labels',
      series: 'ct-series',
      candlePositive: 'ct-class-candle-green',
      candleNegative: 'ct-class-candle-red',
      grid: 'ct-grid',
      gridGroup: 'ct-grids',
      gridBackground: 'ct-grid-background',
      vertical: 'ct-vertical',
      horizontal: 'ct-horizontal',
      start: 'ct-start',
      end: 'ct-end'
    }
  };

  /**
   * Creates a new chart
   */
  function createChart(options) {

    // Prepare data
    var data = Chartist.normalizeData(this.data, options.reverseData, true);

    // Create new svg element
    this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

    // Drawing groups in correct order
    var gridGroup = this.svg.elem('g').addClass(options.classNames.gridGroup);
    var seriesGroup = this.svg.elem('g');
    var labelGroup = this.svg.elem('g').addClass(options.classNames.labelGroup);

    // Create chart rectangle
    var chartRect = Chartist.createChartRect(this.svg, options, defaultOptions.chartPadding);

    // Add missing label elements to label array to avoid none displayed candle sticks and the end of the chart.
    // Length is used to create the axisX (see attribute ticks)
    var differenceNumberLabelValues = data.normalized.series.length - data.normalized.labels.length;
    if (differenceNumberLabelValues > 0) {
      var startIndex = data.normalized.labels.length;
      for (var i = 0; i < differenceNumberLabelValues; i++) {
        data.normalized.labels[startIndex + i] = '';
      }
    }

    // Prepare x and y axis
    var axisX, axisY;
    if (options.axisX.type === undefined) {
      axisX = new Chartist.StepAxis(Chartist.Axis.units.x, data.normalized.series, chartRect, Chartist.extend({}, options.axisX, {
        ticks: data.normalized.labels,
        stretch: options.fullWidth
      }));
    } else {
      axisX = options.axisX.type.call(Chartist, Chartist.Axis.units.x, data.normalized.series, chartRect, options.axisX);
    }
    if (options.axisY.type === undefined) {
      axisY = new Chartist.AutoScaleAxis(Chartist.Axis.units.y, data.normalized.series, chartRect, Chartist.extend({}, options.axisY, {
        high: Chartist.isNumeric(options.high) ? options.high : options.axisY.high,
        low: Chartist.isNumeric(options.low) ? options.low : options.axisY.low
      }));
    } else {
      axisY = options.axisY.type.call(Chartist, Chartist.Axis.units.y, data.normalized.series, chartRect, options.axisY);
    }
    axisX.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);
    axisY.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);

    // Draw the candles (each series is representing a single candle)
    data.raw.series.forEach(function (series, seriesIndex) {
      var open,
        highest,
        lowest,
        close,
        upperValue,
        lowerValue;

      // Get meta data from series
      var metaData = Chartist.getMetaData(series, seriesIndex);

      // Adding the series group and write attributes to current series group element
      // If series name or meta is undefined the attributes will not be written
      var seriesElement = seriesGroup.elem('g').attr({
        'ct:series-name': series.name,
        'ct:meta': Chartist.serialize(metaData)
      });

      // Use series class from series data
      seriesElement.addClass([options.classNames.series, series.className].join(' '));

      // Assign series values
      open = data.normalized.series[seriesIndex][0].y;
      highest = data.normalized.series[seriesIndex][1].y;
      lowest = data.normalized.series[seriesIndex][2].y;
      close = data.normalized.series[seriesIndex][3].y;

      // Need to find out weather or not the open value is higher than close value.
      // And it's important to have at least a small visible range in case open == highest == lowest == close
      var candleColorStyle = options.classNames.candleNegative;
      if (open > close) {
        upperValue = open;
        lowerValue = close;
      } else if (close > open) {
        upperValue = close;
        lowerValue = open;
        candleColorStyle = options.classNames.candlePositive;
      } else {
        upperValue = open;
        lowerValue = close - close / 100;
        lowest = close - close / 100;
      }

      var candleCenterWidth = options.candleWidth / 2;
      var partedCandleWidth = options.candleWidth / 3;

      // Create projected object
      var positions = {
        x1: chartRect.x1 + axisX.projectValue(0, seriesIndex, data.normalized.series[seriesIndex]) - candleCenterWidth,
        x2: chartRect.x1 + axisX.projectValue(0, seriesIndex, data.normalized.series[seriesIndex]) - candleCenterWidth + options.candleWidth,
        y1: chartRect.y1 - axisY.projectValue(upperValue || 0),
        y2: chartRect.y1 - axisY.projectValue(lowerValue || 0),
        y3: chartRect.y1 - axisY.projectValue(highest || 0),
        y4: chartRect.y1 - axisY.projectValue(lowest || 0)
      };

      // Create candle stick element
      // <svg>
      // <path d="M2 25 L2 75 L6 75 L6 100 L12 100 L12 75 L16 75 L16 25 L12 25 L12 0 L6 0 L6 25 Z" style="fill:red;stroke:black;stroke-width:1;" />
      //   Sorry, your browser does not support inline SVG.
      // </svg>
      // var path = new Chartist.Svg.Path(true).move(2, 25).line(2, 75).line(6, 75).line(6, 100).line(12, 100).line(12, 75).line(16, 75)
      //   .line(16, 25).line(12, 25).line(12, 0).line(6, 0).line(6, 25);
      var path = new Chartist.Svg.Path(true)
        .move(positions.x1, positions.y1).line(positions.x1, positions.y2)
        .line(positions.x1 + partedCandleWidth, positions.y2).line(positions.x1 + partedCandleWidth, positions.y4).line(positions.x1 + partedCandleWidth * 2, positions.y4).line(positions.x1 + partedCandleWidth * 2, positions.y2)
        .line(positions.x2, positions.y2).line(positions.x2, positions.y1)
        .line(positions.x1 + partedCandleWidth * 2, positions.y1).line(positions.x1 + partedCandleWidth * 2, positions.y3).line(positions.x1 + partedCandleWidth, positions.y3).line(positions.x1 + partedCandleWidth, positions.y1);

      // Create candle SVG by a given path
      var candle = seriesElement.elem('path', {
        d: path.stringify()
      }, candleColorStyle, true);

      this.eventEmitter.emit('draw', {
        type: 'candle',
        values: data.normalized.series[seriesIndex],
        path: path.clone(),
        chartRect: chartRect,
        index: seriesIndex,
        series: series,
        seriesIndex: seriesIndex,
        seriesMeta: series.meta,
        axisX: axisX,
        axisY: axisY,
        group: seriesElement,
        element: candle
      });

    }.bind(this));

    this.eventEmitter.emit('created', {
      bounds: axisY.bounds,
      chartRect: chartRect,
      axisX: axisX,
      axisY: axisY,
      svg: this.svg,
      options: options
    });
  }

  /**
   * This method creates a new candle stick chart and returns API object that you can use for later changes.
   *
   * @memberof Chartist.Candle
   * @param {String|Node} query A selector query string or directly a DOM element
   * @param {Object} data The data object that needs to consist of a labels and a series array
   * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
   * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return {Object} An object which exposes the API for the created chart
   */
  function Candle(query, data, options, responsiveOptions) {
    Chartist.Candle.super.constructor.call(this,
      query,
      data,
      defaultOptions,
      Chartist.extend({}, defaultOptions, options),
      responsiveOptions);
  }

  // Creating candle stick chart type in Chartist namespace
  Chartist.Candle = Chartist.Base.extend({
    constructor: Candle,
    createChart: createChart
  });

}(window, document, Chartist));
