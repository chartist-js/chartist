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
      // This value specifies the minimum width in pixel of the scale steps
      scaleMinSpace: 30,
      // Use only integer values (whole numbers) for the scale steps
      onlyInteger: false
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
      // This value specifies the minimum height in pixel of the scale steps
      scaleMinSpace: 20,
      // Use only integer values (whole numbers) for the scale steps
      onlyInteger: false
    },
    // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
    width: undefined,
    // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
    height: undefined,
    // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
    high: undefined,
    // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
    low: undefined,
    // Use only integer values (whole numbers) for the scale steps
    onlyInteger: false,
    // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
    chartPadding: {
      top: 15,
      right: 15,
      bottom: 5,
      left: 10
    },
    // Specify the distance in pixel of bars in a group
    seriesBarDistance: 15,
    // If set to true this property will cause the series bars to be stacked and form a total for each series point. This will also influence the y-axis and the overall bounds of the chart. In stacked mode the seriesBarDistance property will have no effect.
    stackBars: false,
    // Inverts the axes of the bar chart in order to draw a horizontal bar chart. Be aware that you also need to invert your axis settings as the Y Axis will now display the labels and the X Axis the values.
    horizontalBars: false,
    // If set to true then each bar will represent a series and the data array is expected to be a one dimensional array of data values rather than a series array of series. This is useful if the bar chart should represent a profile rather than some data over time.
    distributeSeries: false,
    // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
    reverseData: false,
    // Override the class names that get used to generate the SVG structure of the chart
    classNames: {
      chart: 'ct-chart-bar',
      horizontalBars: 'ct-horizontal-bars',
      label: 'ct-label',
      labelGroup: 'ct-labels',
      series: 'ct-series',
      bar: 'ct-bar',
      grid: 'ct-grid',
      gridGroup: 'ct-grids',
      vertical: 'ct-vertical',
      horizontal: 'ct-horizontal',
      start: 'ct-start',
      end: 'ct-end'
    }
  };

  /**
   * Creates a new chart
   *
   */
  function createChart(options) {
    var seriesGroups = [];
    var data = Chartist.getDataArray(this.data, options.reverseData);
    var normalizedData = options.distributeSeries ? data.map(function(value) {
      return [value];
    }) : Chartist.normalizeDataArray(data, this.data.labels.length);
    var highLow;

    // Create new svg element
    this.svg = Chartist.createSvg(
      this.container,
      options.width,
      options.height,
      options.classNames.chart + (options.horizontalBars ? ' ' + options.classNames.horizontalBars : '')
    );

    if(options.stackBars) {
      // If stacked bars we need to calculate the high low from stacked values from each series
      var serialSums = Chartist.serialMap(normalizedData, function serialSums() {
        return Array.prototype.slice.call(arguments).reduce(Chartist.sum, 0);
      });

      highLow = Chartist.getHighLow([serialSums], options);
    } else {
      highLow = Chartist.getHighLow(normalizedData, options);
    }
    // Overrides of high / low from settings
    highLow.high = +options.high || (options.high === 0 ? 0 : highLow.high);
    highLow.low = +options.low || (options.low === 0 ? 0 : highLow.low);

    var chartRect = Chartist.createChartRect(this.svg, options, defaultOptions.padding);

    var valueAxis,
      labelAxisStepCount,
      labelAxis,
      axisX,
      axisY;

    // We need to set step count based on some options combinations
    if(options.distributeSeries && !options.stackBars) {
      // If distributed series are enabled but stacked bars aren't, we need to use the one dimensional series array
      // length as step count for the label axis
      labelAxisStepCount = normalizedData.length;
    } else if(options.distributeSeries && options.stackBars) {
      // If distributed series are enabled and bars need to be stacked, we'll only have one bar and therefore set step
      // count to 1
      labelAxisStepCount = 1;
    } else {
      // If we are drawing a regular bar chart with two dimensional series data, we just use the labels array length
      // as the bars are normalized
      labelAxisStepCount = this.data.labels.length;
    }

    // Set labelAxis and valueAxis based on the horizontalBars setting. This setting will flip the axes if necessary.
    if(options.horizontalBars) {
      labelAxis = axisY = new Chartist.StepAxis(Chartist.Axis.units.y, chartRect, {
        stepCount: labelAxisStepCount
      });

      valueAxis = axisX = new Chartist.LinearScaleAxis(Chartist.Axis.units.x, chartRect, {
        highLow: highLow,
        scaleMinSpace: options.axisX.scaleMinSpace,
        onlyInteger: options.axisX.onlyInteger,
        referenceValue: 0
      });
    } else {
      labelAxis = axisX = new Chartist.StepAxis(Chartist.Axis.units.x, chartRect, {
        stepCount: labelAxisStepCount
      });

      valueAxis = axisY = new Chartist.LinearScaleAxis(Chartist.Axis.units.y, chartRect, {
        highLow: highLow,
        scaleMinSpace: options.axisY.scaleMinSpace,
        onlyInteger: options.axisY.onlyInteger,
        referenceValue: 0
      });
    }

    // Start drawing: grid -> series -> labels
    var gridGroup = this.svg.elem('g').addClass(options.classNames.gridGroup);

    // Projected 0 point
    var zeroPoint = options.horizontalBars ? (chartRect.x1 + valueAxis.projectValue(0).pos) : (chartRect.y1 - valueAxis.projectValue(0).pos),
      // Used to track the screen coordinates of stacked bars
      stackedBarValues = [];

    // Draw the series
    this.data.series.forEach(function(series, seriesIndex) {
      // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
      var biPol = seriesIndex - (this.data.series.length - 1) / 2,
      // Half of the period width between vertical grid lines used to position bars
        periodHalfLength;

      // We need to set periodHalfLength based on some options combinations
      if(options.distributeSeries && !options.stackBars) {
        // If distributed series are enabled but stacked bars aren't, we need to use the length of the normaizedData array
        // which is the series count and divide by 2
        periodHalfLength = labelAxis.axisLength / normalizedData.length / 2;
      } else if(options.distributeSeries && options.stackBars) {
        // If distributed series and stacked bars are enabled we'll only get one bar so we should just divide the axis
        // length by 2
        periodHalfLength = labelAxis.axisLength / 2;
      } else {
        // On regular bar charts we should just use the series length
        periodHalfLength = labelAxis.axisLength / normalizedData[seriesIndex].length / 2;
      }

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
        var projected,
          bar,
          previousStack,
          labelAxisValueIndex;

        // We need to set labelAxisValueIndex based on some options combinations
        if(options.distributeSeries && !options.stackBars) {
          // If distributed series are enabled but stacked bars aren't, we can use the seriesIndex for later projection
          // on the step axis for label positioning
          labelAxisValueIndex = seriesIndex;
        } else if(options.distributeSeries && options.stackBars) {
          // If distributed series and stacked bars are enabled, we will only get one bar and therefore always use
          // 0 for projection on the label step axis
          labelAxisValueIndex = 0;
        } else {
          // On regular bar charts we just use the value index to project on the label step axis
          labelAxisValueIndex = valueIndex;
        }

        // We need to transform coordinates differently based on the chart layout
        if(options.horizontalBars) {
          projected = {
            x: chartRect.x1 + valueAxis.projectValue(value, valueIndex, normalizedData[seriesIndex]).pos,
            y: chartRect.y1 - labelAxis.projectValue(value, labelAxisValueIndex, normalizedData[seriesIndex]).pos
          };
        } else {
          projected = {
            x: chartRect.x1 + labelAxis.projectValue(value, labelAxisValueIndex, normalizedData[seriesIndex]).pos,
            y: chartRect.y1 - valueAxis.projectValue(value, valueIndex, normalizedData[seriesIndex]).pos
          }
        }

        // Offset to center bar between grid lines
        projected[labelAxis.units.pos] += periodHalfLength * (options.horizontalBars ? -1 : 1);
        // Using bi-polar offset for multiple series if no stacked bars or series distribution is used
        projected[labelAxis.units.pos] += (options.stackBars || options.distributeSeries) ? 0 : biPol * options.seriesBarDistance * (options.horizontalBars ? -1 : 1);

        // Enter value in stacked bar values used to remember previous screen value for stacking up bars
        previousStack = stackedBarValues[valueIndex] || zeroPoint;
        stackedBarValues[valueIndex] = previousStack - (zeroPoint - projected[labelAxis.counterUnits.pos]);

        var positions = {};
        positions[labelAxis.units.pos + '1'] = projected[labelAxis.units.pos];
        positions[labelAxis.units.pos + '2'] = projected[labelAxis.units.pos];
        // If bars are stacked we use the stackedBarValues reference and otherwise base all bars off the zero line
        positions[labelAxis.counterUnits.pos + '1'] = options.stackBars ? previousStack : zeroPoint;
        positions[labelAxis.counterUnits.pos + '2'] = options.stackBars ? stackedBarValues[valueIndex] : projected[labelAxis.counterUnits.pos];

        bar = seriesGroups[seriesIndex].elem('line', positions, options.classNames.bar).attr({
          'value': value,
          'meta': Chartist.getMetaData(series, valueIndex)
        }, Chartist.xmlNs.uri);

        this.eventEmitter.emit('draw', Chartist.extend({
          type: 'bar',
          value: value,
          index: valueIndex,
          meta: Chartist.getMetaData(series, valueIndex),
          series: series,
          seriesIndex: seriesIndex,
          chartRect: chartRect,
          group: seriesGroups[seriesIndex],
          element: bar
        }, positions));
      }.bind(this));
    }.bind(this));

    // Draw labels
    var labelGroup = this.svg.elem('g').addClass(options.classNames.labelGroup);

    // Create grid
    Chartist.createAxis(
      valueAxis,
      valueAxis.bounds.values,
      chartRect,
      gridGroup,
      labelGroup,
      this.supportsForeignObject,
      options,
      this.eventEmitter
    );

    // Create labels
    Chartist.createAxis(
      labelAxis,
      this.data.labels,
      chartRect,
      gridGroup,
      labelGroup,
      this.supportsForeignObject,
      options,
      this.eventEmitter
    ); 

    this.eventEmitter.emit('created', {
      bounds: valueAxis.bounds,
      chartRect: chartRect,
      axisX: axisX,
      axisY: axisY,
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
      defaultOptions,
      Chartist.extend({}, defaultOptions, options),
      responsiveOptions);
  }

  // Creating bar chart type in Chartist namespace
  Chartist.Bar = Chartist.Base.extend({
    constructor: Bar,
    createChart: createChart
  });

}(window, document, Chartist));
