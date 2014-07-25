// Chartist Bar chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Bar = Chartist.Bar || function (query, data, options, responsiveOptions) {

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
      draw;

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds,
        normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

      // Create new SVG.js draw
      draw = Chartist.createDraw(query, options.width, options.height);

      // initialize bounds
      bounds = Chartist.getBounds(draw, normalizedData, options, null, 0);

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
        // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
        var biPol = i - (data.series.length - 1) / 2,
        // Half of the period with between vertical grid lines used to position bars
          periodHalfWidth = chartRect.width() / normalizedData[i].length / 2;

        seriesGroups[i] = draw.group();
        // Use series class from series data or if not set generate one
        seriesGroups[i].addClass(options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        for(var j = 0; j < normalizedData[i].length; j++) {
          var p = Chartist.projectPoint(chartRect, bounds, normalizedData[i], j),
            bar;

          // Offset to center bar between grid lines and using bi-polar offset for multiple series
          // TODO: Check if we should really be able to add classes to the series. Should be handles with SASS and semantic / specific selectors
          p.x += periodHalfWidth + (biPol * options.seriesBarDistance);

          bar = seriesGroups[i].line(p.x, chartRect.y1, p.x, p.y);
          bar.addClass(options.classNames.bar + (data.series[i].barClasses ? ' ' + data.series[i].barClasses : ''));
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