/**
 * The candle stick chart module of Chartist that can be used to draw unipolar or bipolar bar and grouped candle stick charts.
 *
 * @module Chartist.Candle
 */
/* global Chartist */
(function(window, document, Chartist){
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
    // Unless low/high are explicitly set, candle stick chart will be centered at zero by default. Set referenceValue to null to auto scale.
    referenceValue: 0,
    // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
    chartPadding: {
      top: 15,
      right: 15,
      bottom: 5,
      left: 10
    },
    // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
    reverseData: false,
    // If the candle stick chart should add a background fill to the .ct-grids group.
    showGridBackground: false,
    // Override the class names that get used to generate the SVG structure of the chart
    classNames: {
      chart: 'ct-chart-bar',
      label: 'ct-label',
      labelGroup: 'ct-labels',
      series: 'ct-series',
      candle: 'ct-bar',
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
   *
   */
  function createChart(options) {
    var data;
    var highLow;

    data = Chartist.normalizeData(this.data, options.reverseData, 'y');

    // Create new svg element
    this.svg = Chartist.createSvg(
      this.container,
      options.width,
      options.height,
      options.classNames.chart
    );

    // Drawing groups in correct order
    var gridGroup = this.svg.elem('g').addClass(options.classNames.gridGroup);
    var seriesGroup = this.svg.elem('g');
    var labelGroup = this.svg.elem('g').addClass(options.classNames.labelGroup);

    // if(data.normalized.series.length !== 0) {
    //
    //   // If stacked bars we need to calculate the high low from stacked values from each series
    //   var serialSums = Chartist.serialMap(data.normalized.series, function serialSums() {
    //     return Array.prototype.slice.call(arguments).map(function(value) {
    //       return value;
    //     }).reduce(function(prev, curr) {
    //       return {
    //         x: prev.x + (curr && curr.x) || 0,
    //         y: prev.y + (curr && curr.y) || 0
    //       };
    //     }, {x: 0, y: 0});
    //   });
    //
    //   highLow = Chartist.getHighLow([serialSums], options, 'y');
    //
    // } else {

      highLow = Chartist.getHighLow(data.normalized.series, options, 'y');
    // }

    // Overrides of high / low from settings
    highLow.high = +options.high || (options.high === 0 ? 0 : highLow.high);
    highLow.low = +options.low || (options.low === 0 ? 0 : highLow.low);

    var chartRect = Chartist.createChartRect(this.svg, options, defaultOptions.padding);

    var valueAxis,
      labelAxisTicks,
      labelAxis,
      axisX,
      axisY;

    // We need to set step count based on some options combinations
    // If distributed series are enabled but stacked bars aren't, we should use the series labels
    // If we are drawing a regular candle stick chart with two dimensional series data, we just use the labels array
    // as the bars are normalized
    labelAxisTicks = data.normalized.labels;

    // Set labelAxis and valueAxis. This setting will flip the axes if necessary.
    if(options.axisX.type === undefined) {
      labelAxis = axisX = new Chartist.StepAxis(Chartist.Axis.units.x, data.normalized.series, chartRect, {
        ticks: labelAxisTicks
      });
    } else {
      labelAxis = axisX = options.axisX.type.call(Chartist, Chartist.Axis.units.x, data.normalized.series, chartRect, options.axisX);
    }

    if(options.axisY.type === undefined) {
      valueAxis = axisY = new Chartist.AutoScaleAxis(Chartist.Axis.units.y, data.normalized.series, chartRect, Chartist.extend({}, options.axisY, {
        highLow: highLow,
        referenceValue: 0
      }));
    } else {
      valueAxis = axisY = options.axisY.type.call(Chartist, Chartist.Axis.units.y, data.normalized.series, chartRect, Chartist.extend({}, options.axisY, {
        highLow: highLow,
        referenceValue: 0
      }));
    }

    // Projected 0 point
    var zeroPoint = (chartRect.y1 - valueAxis.projectValue(0));
    var openEqualsClose = valueAxis.projectValue(1);

    labelAxis.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);
    valueAxis.createGridAndLabels(gridGroup, labelGroup, this.supportsForeignObject, options, this.eventEmitter);

    if (options.showGridBackground) {
      Chartist.createGridBackground(gridGroup, chartRect, options.classNames.gridBackground, this.eventEmitter);
    }

    // Draw the candles (each series is representing a single candle)
    data.raw.series.forEach(function(series, seriesIndex) {
      // Half of the period width between vertical grid lines used to position bars
      var periodHalfLength;
      // Current series SVG element
      var seriesElement;
      var projected,
        candle,
        open,
        highest,
        lowest,
        close,
        upperValue,
        lowerValue;

      // We need to set periodHalfLength
      // On regular candle stick charts we should just use the series length
      periodHalfLength = labelAxis.axisLength / data.normalized.series[seriesIndex].length / 2;

      // Adding the series group to the series element
      seriesElement = seriesGroup.elem('g');

      // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
      seriesElement.attr({
        'ct:series-name': series.name,
        'ct:meta': Chartist.serialize(series.meta)
      });

      // Use series class from series data or if not set generate one
      seriesElement.addClass([
        options.classNames.series,
        (series.className || options.classNames.series + '-' + Chartist.alphaNumerate(seriesIndex))
      ].join(' '));

      // Assign series values
      open = data.normalized.series[seriesIndex][0].y;
      highest = data.normalized.series[seriesIndex][1].y;
      lowest = data.normalized.series[seriesIndex][2].y;
      close = data.normalized.series[seriesIndex][3].y;

      if (open > close) {
        upperValue = open;
        lowerValue = close;
      } else if (close > open) {
        upperValue = close;
        lowerValue = open;
      } else {
        upperValue = open;
        lowerValue = close - 10000;
      }

      //console.log(upperValue + " " + lowerValue);
      //console.log(chartRect.y1);

      // We need to transform coordinates differently based on the chart layout
      projected = {
        x: chartRect.x1 + labelAxis.projectValue(upperValue && upperValue.x ? upperValue.x : 0, seriesIndex, data.normalized.series[seriesIndex]),
        y1: chartRect.y1 - valueAxis.projectValue(upperValue || 0),
        y2: chartRect.y1 - valueAxis.projectValue(lowerValue || 0)
      };

      console.log(projected);

      // If the label axis is a step based axis we will offset the bar into the middle of between two steps using the periodHalfLength value.
      // If we don't have a step axis, the bar positions can be chosen freely so we should not add any automated positioning.
      if(labelAxis instanceof Chartist.StepAxis) {
        // Offset to center bar between grid lines, but only if the step axis is not stretched
        if(!labelAxis.options.stretch) {
          projected[labelAxis.units.pos] += periodHalfLength * 1;
        }
        // Using bi-polar offset for multiple series if no stacked bars or series distribution is used
        projected[labelAxis.units.pos] += 0;
      }

      // Skip if value is undefined
      if(open === undefined || highest === undefined || lowest === undefined || close === undefined) {
        return;
      }

      // y1 == top (0 <=> very top)
      // y2 == bottom
      var positions = {};
      positions[labelAxis.units.pos + '1'] = projected[labelAxis.units.pos];
      positions[labelAxis.units.pos + '2'] = projected[labelAxis.units.pos];
      positions[labelAxis.counterUnits.pos + '1'] = projected[labelAxis.counterUnits.pos + '1'];
      positions[labelAxis.counterUnits.pos + '2'] = projected[labelAxis.counterUnits.pos + '2'];

      //console.log(positions);

      // Limit x and y so that they are within the chart rect
      positions.x1 = Math.min(Math.max(positions.x1, chartRect.x1), chartRect.x2);
      positions.x2 = Math.min(Math.max(positions.x2, chartRect.x1), chartRect.x2);
      positions.y1 = Math.min(Math.max(positions.y1, chartRect.y2), chartRect.y1);
      positions.y2 = Math.min(Math.max(positions.y2, chartRect.y2), chartRect.y1);

      var metaData = Chartist.getMetaData(series, seriesIndex);

      // Create candle stick element
      candle = seriesElement.elem('line', positions, options.classNames.candle).attr({
        'ct:value': [close.x, close.y].filter(Chartist.isNumeric).join(','),
        'ct:meta': Chartist.serialize(metaData)
      });

      this.eventEmitter.emit('draw', Chartist.extend({
        type: 'candle',
        value: close,
        index: seriesIndex,
        meta: metaData,
        series: series,
        seriesIndex: seriesIndex,
        axisX: axisX,
        axisY: axisY,
        chartRect: chartRect,
        group: seriesElement,
        element: candle
      }, positions));






      // data.normalized.series[seriesIndex].forEach(function(value, valueIndex) {
      //   var projected,
      //     candle,
      //     previousStack,
      //     labelAxisValueIndex;
      //
      //   // We need to set labelAxisValueIndex
      //   // On regular candle stick charts we just use the value index to project on the label step axis
      //   labelAxisValueIndex = valueIndex;
      //
      //   // We need to transform coordinates differently based on the chart layout
      //   projected = {
      //     x: chartRect.x1 + labelAxis.projectValue(value && value.x ? value.x : 0, labelAxisValueIndex, data.normalized.series[seriesIndex]),
      //     y: chartRect.y1 - valueAxis.projectValue(value && value.y ? value.y : 0, valueIndex, data.normalized.series[seriesIndex])
      //   };
      //
      //   // If the label axis is a step based axis we will offset the bar into the middle of between two steps using the periodHalfLength value.
      //   // If we don't have a step axis, the bar positions can be chosen freely so we should not add any automated positioning.
      //   if(labelAxis instanceof Chartist.StepAxis) {
      //     // Offset to center bar between grid lines, but only if the step axis is not stretched
      //     if(!labelAxis.options.stretch) {
      //       projected[labelAxis.units.pos] += periodHalfLength * 1;
      //     }
      //     // Using bi-polar offset for multiple series if no stacked bars or series distribution is used
      //     projected[labelAxis.units.pos] += 0;
      //   }
      //
      //   // Enter value in stacked bar values used to remember previous screen value for stacking up bars
      //   previousStack = stackedBarValues[valueIndex] || zeroPoint;
      //   stackedBarValues[valueIndex] = previousStack - (zeroPoint - projected[labelAxis.counterUnits.pos]);
      //
      //   // Skip if value is undefined
      //   if(value === undefined) {
      //     return;
      //   }
      //
      //   var positions = {};
      //   positions[labelAxis.units.pos + '1'] = projected[labelAxis.units.pos];
      //   positions[labelAxis.units.pos + '2'] = projected[labelAxis.units.pos];
      //
      //   // Stack mode: accumulate (default)
      //   // If bars are stacked we use the stackedBarValues reference and otherwise base all bars off the zero line
      //   // We want backwards compatibility, so the expected fallback without the 'stackMode' option
      //   // to be the or iginal behaviour (accumulate)
      //   positions[labelAxis.counterUnits.pos + '1'] = previousStack;
      //   positions[labelAxis.counterUnits.pos + '2'] = stackedBarValues[valueIndex];
      //
      //   // Limit x and y so that they are within the chart rect
      //   positions.x1 = Math.min(Math.max(positions.x1, chartRect.x1), chartRect.x2);
      //   positions.x2 = Math.min(Math.max(positions.x2, chartRect.x1), chartRect.x2);
      //   positions.y1 = Math.min(Math.max(positions.y1, chartRect.y2), chartRect.y1);
      //   positions.y2 = Math.min(Math.max(positions.y2, chartRect.y2), chartRect.y1);
      //
      //   var metaData = Chartist.getMetaData(series, valueIndex);
      //
      //   // Create bar element
      //   candle = seriesElement.elem('line', positions, options.classNames.bar).attr({
      //     'ct:value': [value.x, value.y].filter(Chartist.isNumeric).join(','),
      //     'ct:meta': Chartist.serialize(metaData)
      //   });
      //
      //   this.eventEmitter.emit('draw', Chartist.extend({
      //     type: 'candle',
      //     value: value,
      //     index: valueIndex,
      //     meta: metaData,
      //     series: series,
      //     seriesIndex: seriesIndex,
      //     axisX: axisX,
      //     axisY: axisY,
      //     chartRect: chartRect,
      //     group: seriesElement,
      //     element: candle
      //   }, positions));
      // }.bind(this));
    }.bind(this));

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
