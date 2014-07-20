// Chartist line chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Line = Chartist.Line || function (query, data, options, responsiveOptions) {

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
        chartPadding: 5,
        classNames: {
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
      draw;

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new draw object
      draw = Chartist.createDraw(query, options.width, options.height);

      // initialize bounds
      bounds = Chartist.getBounds(draw, normalizedData, options);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          draw,
          data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          Chartist.getHeight
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          draw,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          Chartist.getWidth
        );
      }

      var chartRect = Chartist.createChartRect(draw, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = draw.group(),
        grid = draw.group();

      Chartist.createXAxis(chartRect, data, grid, labels, options);
      Chartist.createYAxis(chartRect, bounds, grid, labels, yAxisOffset, options);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        seriesGroups[i] = draw.group();
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass(options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], 0),
          pathCoordinates = [p.x, p.y],
          point;

        // First dot we need to add before loop
        if (options.showPoint) {
          // Small offset for Firefox to render squares correctly
          point = seriesGroups[i].line(p.x, p.y, p.x + 0.01, p.y);
          point.addClass(options.classNames.point);
        }

        // First point is created, continue with rest
        for (var j = 1; j < normalizedData[i].length; j++) {
          p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j);
          pathCoordinates.push(p.x, p.y);

          //If we should show points we need to create them now to avoid secondary loop
          // Small offset for Firefox to render squares correctly
          if (options.showPoint) {
            point = seriesGroups[i].line(p.x, p.y, p.x + 0.01, p.y);
            point.addClass(options.classNames.point);
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

          var path = seriesGroups[i].path(svgPathString);
          path.addClass(options.classNames.line);
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
}(document, window, window.Chartist));