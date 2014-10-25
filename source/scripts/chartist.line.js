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
    showLine: true,
    showPoint: true,
    showArea: false,
    areaBase: 0,
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
      area: 'ct-area',
      grid: 'ct-grid',
      vertical: 'ct-vertical',
      horizontal: 'ct-horizontal'
    }
  };

  function createChart(options) {
    var seriesGroups = [],
      bounds,
      normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(this.data), this.data.labels.length);

    // Create new svg object
    this.svg = Chartist.createSvg(this.container, options.width, options.height, options.classNames.chart);

    // initialize bounds
    bounds = Chartist.getBounds(this.svg, normalizedData, options);

    var chartRect = Chartist.createChartRect(this.svg, options);
    // Start drawing
    var labels = this.svg.elem('g'),
      grid = this.svg.elem('g');

    Chartist.createXAxis(chartRect, this.data, grid, labels, options, this.eventEmitter, this.supportsForeignObject);
    Chartist.createYAxis(chartRect, bounds, grid, labels, options, this.eventEmitter, this.supportsForeignObject);

    // Draw the series
    // initialize series groups
    for (var i = 0; i < this.data.series.length; i++) {
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

      var p,
        pathCoordinates = [],
        point;

      for (var j = 0; j < normalizedData[i].length; j++) {
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
          }, options.classNames.point).attr({
            'value': normalizedData[i][j]
          }, Chartist.xmlNs.uri);

          this.eventEmitter.emit('draw', {
            type: 'point',
            value: normalizedData[i][j],
            index: j,
            group: seriesGroups[i],
            element: point,
            x: p.x,
            y: p.y
          });
        }
      }

      // TODO: Nicer handling of conditions, maybe composition?
      if (options.showLine || options.showArea) {
        // TODO: We should add a path API in the SVG library for easier path creation
        var pathElements = ['M' + pathCoordinates[0] + ',' + pathCoordinates[1]];

        // If smoothed path and path has more than two points then use catmull rom to bezier algorithm
        if (options.lineSmooth && pathCoordinates.length > 4) {

          var cr = Chartist.catmullRom2bezier(pathCoordinates);
          for(var k = 0; k < cr.length; k++) {
            pathElements.push('C' + cr[k].join());
          }
        } else {
          for(var l = 3; l < pathCoordinates.length; l += 2) {
            pathElements.push('L' + pathCoordinates[l - 1] + ',' + pathCoordinates[l]);
          }
        }

        if(options.showArea) {
          // If areaBase is outside the chart area (< low or > high) we need to set it respectively so that
          // the area is not drawn outside the chart area.
          var areaBase = Math.max(Math.min(options.areaBase, bounds.high), bounds.low);

          // If we need to draw area shapes we just make a copy of our pathElements SVG path array
          var areaPathElements = pathElements.slice();

          // We project the areaBase value into screen coordinates
          var areaBaseProjected = Chartist.projectPoint(chartRect, bounds, [areaBase], 0);
          // And splice our new area path array to add the missing path elements to close the area shape
          areaPathElements.splice(0, 0, 'M' + areaBaseProjected.x + ',' + areaBaseProjected.y);
          areaPathElements[1] = 'L' + pathCoordinates[0] + ',' + pathCoordinates[1];
          areaPathElements.push('L' + pathCoordinates[pathCoordinates.length - 2] + ',' + areaBaseProjected.y);

          // Create the new path for the area shape with the area class from the options
          seriesGroups[i].elem('path', {
            d: areaPathElements.join('')
          }, options.classNames.area, true).attr({
            'values': normalizedData[i]
          }, Chartist.xmlNs.uri);
        }

        if(options.showLine) {
          seriesGroups[i].elem('path', {
            d: pathElements.join('')
          }, options.classNames.line, true).attr({
            'values': normalizedData[i]
          }, Chartist.xmlNs.uri);
        }
      }
    }
  }

  /**
   * This method creates a new line chart.
   *
   * @memberof Chartist.Line
   * @param {String|Node} query A selector query string or directly a DOM element
   * @param {Object} data The data object that needs to consist of a labels and a series array
   * @param {Object} [options] The options object with options that override the default options. Check the examples for a detailed list.
   * @param {Array} [responsiveOptions] Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return {Object} An object which exposes the API for the created chart
   *
   * @example
   * // These are the default options of the line chart
   * var options = {
   *   // Options for X-Axis
   *   axisX: {
   *     // The offset of the labels to the chart area
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
   *     // The offset of the labels to the chart area
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
   *   // If the line should be drawn or not
   *   showLine: true,
   *   // If dots should be drawn or not
   *   showPoint: true,
   *   // If the line chart should draw an area
   *   showArea: false,
   *   // The base for the area chart that will be used to close the area shape (is normally 0)
   *   areaBase: 0,
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
   *     area: 'ct-area',
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
   * new Chartist.Line('.ct-chart', data, options);
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
   * new Chartist.Line('.ct-chart', data, null, responsiveOptions);
   *
   */
  function Line(query, data, options, responsiveOptions) {
    Chartist.Line.super.constructor.call(this,
      query,
      data,
      Chartist.extend(Chartist.extend({}, defaultOptions), options),
      responsiveOptions);
  }

  // Creating line chart type in Chartist namespace
  Chartist.Line = Chartist.Base.extend({
    constructor: Line,
    createChart: createChart
  });

}(window, document, Chartist));
