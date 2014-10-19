/**
 * The pie chart module of Chartist that can be used to draw pie, donut or gauge charts
 *
 * @module Chartist.Pie
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    width: undefined,
    height: undefined,
    chartPadding: 5,
    classNames: {
      chart: 'ct-chart-pie',
      series: 'ct-series',
      slice: 'ct-slice',
      donut: 'ct-donut',
      label: 'ct-label'
    },
    startAngle: 0,
    total: undefined,
    donut: false,
    donutWidth: 60,
    showLabel: true,
    labelOffset: 0,
    labelInterpolationFnc: Chartist.noop,
    labelOverflow: false,
    labelDirection: 'neutral'
  };

  function determineAnchorPosition(center, label, direction) {
    var toTheRight = label.x > center.x;

    if(toTheRight && direction === 'explode' ||
      !toTheRight && direction === 'implode') {
      return 'start';
    } else if(toTheRight && direction === 'implode' ||
      !toTheRight && direction === 'explode') {
      return 'end';
    } else {
      return 'middle';
    }
  }

  function createChart(options) {
    var seriesGroups = [],
      chartRect,
      radius,
      labelRadius,
      totalDataSum,
      startAngle = options.startAngle,
      dataArray = Chartist.getDataArray(this.data);

    // Create SVG.js draw
    this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);
    // Calculate charting rect
    chartRect = Chartist.createChartRect(this.svg, options, 0, 0);
    // Get biggest circle radius possible within chartRect
    radius = Math.min(chartRect.width() / 2, chartRect.height() / 2);
    // Calculate total of all series to get reference value or use total reference from optional options
    totalDataSum = options.total || dataArray.reduce(function(previousValue, currentValue) {
      return previousValue + currentValue;
    }, 0);

    // If this is a donut chart we need to adjust our radius to enable strokes to be drawn inside
    // Unfortunately this is not possible with the current SVG Spec
    // See this proposal for more details: http://lists.w3.org/Archives/Public/www-svg/2003Oct/0000.html
    radius -= options.donut ? options.donutWidth / 2  : 0;

    // If a donut chart then the label position is at the radius, if regular pie chart it's half of the radius
    // see https://github.com/gionkunz/chartist-js/issues/21
    labelRadius = options.donut ? radius : radius / 2;
    // Add the offset to the labelRadius where a negative offset means closed to the center of the chart
    labelRadius += options.labelOffset;

    // Calculate end angle based on total sum and current data value and offset with padding
    var center = {
      x: chartRect.x1 + chartRect.width() / 2,
      y: chartRect.y2 + chartRect.height() / 2
    };

    // Check if there is only one non-zero value in the series array.
    var hasSingleValInSeries = this.data.series.filter(function(val) {
      return val !== 0;
    }).length === 1;

    // Draw the series
    // initialize series groups
    for (var i = 0; i < this.data.series.length; i++) {
      seriesGroups[i] = this.svg.elem('g', null, null, true);

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

      var endAngle = startAngle + dataArray[i] / totalDataSum * 360;
      // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
      // with Z and use 359.99 degrees
      if(endAngle - startAngle === 360) {
        endAngle -= 0.01;
      }

      var start = Chartist.polarToCartesian(center.x, center.y, radius, startAngle - (i === 0 || hasSingleValInSeries ? 0 : 0.2)),
        end = Chartist.polarToCartesian(center.x, center.y, radius, endAngle),
        arcSweep = endAngle - startAngle <= 180 ? '0' : '1',
        d = [
          // Start at the end point from the cartesian coordinates
          'M', end.x, end.y,
          // Draw arc
          'A', radius, radius, 0, arcSweep, 0, start.x, start.y
        ];

      // If regular pie chart (no donut) we add a line to the center of the circle for completing the pie
      if(options.donut === false) {
        d.push('L', center.x, center.y);
      }

      // Create the SVG path
      // If this is a donut chart we add the donut class, otherwise just a regular slice
      var path = seriesGroups[i].elem('path', {
        d: d.join(' ')
      }, options.classNames.slice + (options.donut ? ' ' + options.classNames.donut : ''));

      // Adding the pie series value to the path
      path.attr({
        'value': dataArray[i]
      }, Chartist.xmlNs.uri);

      // If this is a donut, we add the stroke-width as style attribute
      if(options.donut === true) {
        path.attr({
          'style': 'stroke-width: ' + (+options.donutWidth) + 'px'
        });
      }

      // Fire off draw event
      this.eventEmitter.emit('draw', {
        type: 'slice',
        value: dataArray[i],
        totalDataSum: totalDataSum,
        index: i,
        group: seriesGroups[i],
        element: path,
        center: center,
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle
      });

      // If we need to show labels we need to add the label for this slice now
      if(options.showLabel) {
        // Position at the labelRadius distance from center and between start and end angle
        var labelPosition = Chartist.polarToCartesian(center.x, center.y, labelRadius, startAngle + (endAngle - startAngle) / 2),
          interpolatedValue = options.labelInterpolationFnc(this.data.labels ? this.data.labels[i] : dataArray[i], i);

        var labelElement = seriesGroups[i].elem('text', {
          dx: labelPosition.x,
          dy: labelPosition.y,
          'text-anchor': determineAnchorPosition(center, labelPosition, options.labelDirection)
        }, options.classNames.label).text('' + interpolatedValue);

        // Fire off draw event
        this.eventEmitter.emit('draw', {
          type: 'label',
          index: i,
          group: seriesGroups[i],
          element: labelElement,
          text: '' + interpolatedValue,
          x: labelPosition.x,
          y: labelPosition.y
        });
      }

      // Set next startAngle to current endAngle. Use slight offset so there are no transparent hairline issues
      // (except for last slice)
      startAngle = endAngle;
    }
  }

  /**
   * This method creates a new pie chart and returns an object that can be used to redraw the chart.
   *
   * @memberof Chartist.Pie
   * @param {String|Node} query A selector query string or directly a DOM element
   * @param {Object} data The data object in the pie chart needs to have a series property with a one dimensional data array. The values will be normalized against each other and don't necessarily need to be in percentage.
   * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
   * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return {Object} An object with a version and an update method to manually redraw the chart
   *
   * @example
   * // Default options of the pie chart
   * var defaultOptions = {
   *   // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
   *   width: undefined,
   *   // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
   *   height: undefined,
   *   // Padding of the chart drawing area to the container element and labels
   *   chartPadding: 5,
   *   // Override the class names that get used to generate the SVG structure of the chart
   *   classNames: {
   *     chart: 'ct-chart-pie',
   *     series: 'ct-series',
   *     slice: 'ct-slice',
   *     donut: 'ct-donut',
         label: 'ct-label'
   *   },
   *   // The start angle of the pie chart in degrees where 0 points north. A higher value offsets the start angle clockwise.
   *   startAngle: 0,
   *   // An optional total you can specify. By specifying a total value, the sum of the values in the series must be this total in order to draw a full pie. You can use this parameter to draw only parts of a pie or gauge charts.
   *   total: undefined,
   *   // If specified the donut CSS classes will be used and strokes will be drawn instead of pie slices.
   *   donut: false,
   *   // Specify the donut stroke width, currently done in javascript for convenience. May move to CSS styles in the future.
   *   donutWidth: 60,
   *   // If a label should be shown or not
   *   showLabel: true,
   *   // Label position offset from the standard position which is half distance of the radius. This value can be either positive or negative. Positive values will position the label away from the center.
   *   labelOffset: 0,
   *   // An interpolation function for the label value
   *   labelInterpolationFnc: function(value, index) {return value;},
   *   // Label direction can be 'neutral', 'explode' or 'implode'. The labels anchor will be positioned based on those settings as well as the fact if the labels are on the right or left side of the center of the chart. Usually explode is useful when labels are positioned far away from the center.
   *   labelDirection: 'neutral'
   * };
   *
   * @example
   * // Simple pie chart example with four series
   * new Chartist.Pie('.ct-chart', {
   *   series: [10, 2, 4, 3]
   * });
   *
   * @example
   * // Drawing a donut chart
   * new Chartist.Pie('.ct-chart', {
   *   series: [10, 2, 4, 3]
   * }, {
   *   donut: true
   * });
   *
   * @example
   * // Using donut, startAngle and total to draw a gauge chart
   * new Chartist.Pie('.ct-chart', {
   *   series: [20, 10, 30, 40]
   * }, {
   *   donut: true,
   *   donutWidth: 20,
   *   startAngle: 270,
   *   total: 200
   * });
   *
   * @example
   * // Drawing a pie chart with padding and labels that are outside the pie
   * new Chartist.Pie('.ct-chart', {
   *   series: [20, 10, 30, 40]
   * }, {
   *   chartPadding: 30,
   *   labelOffset: 50,
   *   labelDirection: 'explode'
   * });
   */
  function Pie(query, data, options, responsiveOptions) {
    Chartist.Pie.super.constructor.call(this,
      query,
      data,
      Chartist.extend(Chartist.extend({}, defaultOptions), options),
      responsiveOptions);
  }

  // Creating pie chart type in Chartist namespace
  Chartist.Pie = Chartist.Base.extend({
    constructor: Pie,
    createChart: createChart,
    determineAnchorPosition: determineAnchorPosition
  });

}(window, document, Chartist));
