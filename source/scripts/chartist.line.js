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
   * This method creates a new line chart and returns API object that you can use for later changes.
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
      },
      optionsProvider,
      container = Chartist.querySelector(query),
      svg,
      eventEmitter = Chartist.EventEmitter();

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new svg object
      svg = Chartist.createSvg(container, options.width, options.height, options.classNames.chart);

      // initialize bounds
      bounds = Chartist.getBounds(svg, normalizedData, options);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          svg,
          data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          'height'
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          svg,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          'width'
        );
      }

      var chartRect = Chartist.createChartRect(svg, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = svg.elem('g'),
        grid = svg.elem('g');

      Chartist.createXAxis(chartRect, data, grid, labels, options, eventEmitter);
      Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options, eventEmitter);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        seriesGroups[i] = svg.elem('g');

        // If the series is an object and contains a name we add a custom attribute
        if(data.series[i].name) {
          seriesGroups[i].attr({
            'series-name': data.series[i].name
          }, Chartist.xmlNs.uri);
        }

        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass([
          options.classNames.series,
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i))
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

            eventEmitter.emit('draw', {
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

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
    // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
    // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
    // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
    // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
    // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
    /**
     * Updates the chart which currently does a full reconstruction of the SVG DOM
     *
     * @memberof Chartist.Line
     */
    function update() {
      createChart(optionsProvider.currentOptions);
    }

    /**
     * This method can be called on the API object of each chart and will un-register all event listeners that were added to other components. This currently includes a window.resize listener as well as media query listeners if any responsive options have been provided. Use this function if you need to destroy and recreate Chartist charts dynamically.
     *
     * @memberof Chartist.Line
     */
    function detach() {
      window.removeEventListener('resize', update);
      optionsProvider.removeMediaQueryListeners();
    }

    /**
     * Use this function to register event handlers. The handler callbacks are synchronous and will run in the main thread rather than the event loop.
     *
     * @memberof Chartist.Line
     * @param {String} event Name of the event. Check the examples for supported events.
     * @param {Function} handler The handler function that will be called when an event with the given name was emitted. This function will receive a data argument which contains event data. See the example for more details.
     */
    function on(event, handler) {
      eventEmitter.addEventHandler(event, handler);
    }

    /**
     * Use this function to un-register event handlers. If the handler function parameter is omitted all handlers for the given event will be un-registered.
     *
     * @memberof Chartist.Line
     * @param {String} event Name of the event for which a handler should be removed
     * @param {Function} [handler] The handler function that that was previously used to register a new event handler. This handler will be removed from the event handler list. If this parameter is omitted then all event handlers for the given event are removed from the list.
     */
    function off(event, handler) {
      eventEmitter.removeEventHandler(event, handler);
    }

    // Initialization of the chart

    window.addEventListener('resize', update);

    // Obtain current options based on matching media queries (if responsive options are given)
    // This will also register a listener that is re-creating the chart based on media changes
    optionsProvider = Chartist.optionsProvider(defaultOptions, options, responsiveOptions, eventEmitter);
    // Using event loop for first draw to make it possible to register event listeners in the same call stack where
    // the chart was created.
    setTimeout(function() {
      createChart(optionsProvider.currentOptions);
    }, 0);

    // Public members of the module (revealing module pattern style)
    var api = {
      version: Chartist.version,
      update: update,
      on: on,
      off: off,
      detach: detach
    };

    container.chartist = api;
    return api;
  };

}(window, document, Chartist));
