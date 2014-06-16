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
      paper,
      dataArray = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

    function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds;

      // Create new paper the stage
      paper = Chartist.createPaper(query, options.width, options.height);

      // initialize bounds
      bounds = Chartist.getBounds(paper, dataArray, options);

      xAxisOffset = options.axisX.offset;
      if (options.axisX.showLabel) {
        xAxisOffset += Chartist.calculateLabelOffset(
          paper,
          data.labels,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisX.labelInterpolationFnc,
          Chartist.getHeight
        );
      }

      yAxisOffset = options.axisY.offset;
      if (options.axisY.showLabel) {
        yAxisOffset += Chartist.calculateLabelOffset(
          paper,
          bounds.values,
          [options.classNames.label, options.classNames.horizontal].join(' '),
          options.axisY.labelInterpolationFnc,
          Chartist.getWidth
        );
      }

      var chartRect = Chartist.createChartRect(paper, options, xAxisOffset, yAxisOffset);
      // Start drawing
      var labels = paper.g(),
        grid = paper.g();

      Chartist.createXAxis(paper, chartRect, data, grid, labels, options);
      Chartist.createYAxis(paper, chartRect, bounds, grid, labels, yAxisOffset, options);

      // Draw the series
      // initialize series groups
      for (var i = 0; i < data.series.length; i++) {
        seriesGroups[i] = paper.g();
        // Use series class from series data or if not set generate one
        seriesGroups[i].node.setAttribute('class', options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        var p = Chartist.projectPoint(chartRect, bounds, data.series[i].data, 0),
          path = 'M' + p.x + ',' + p.y + ' ' + (options.lineSmooth ? 'R' : 'L'),
          point;

        // First dot we need to add before loop
        if (options.showPoint) {
          // Small offset for Firefox to render squares correctly
          point = paper.line(p.x, p.y, p.x + 0.01, p.y);
          point.node.setAttribute('class', options.classNames.point);
          seriesGroups[i].append(point);
        }

        // First point is created, continue with rest
        for (var j = 1; j < data.series[i].data.length; j++) {
          p = Chartist.projectPoint(chartRect, bounds, data.series[i].data, j);
          path += ' ' + p.x + ',' + p.y;

          //If we should show points we need to create them now to avoid secondary loop
          // Small offset for Firefox to render squares correctly
          if (options.showPoint) {
            point = paper.line(p.x, p.y, p.x  + 0.01, p.y);
            point.node.setAttribute('class', options.classNames.point);
            seriesGroups[i].append(point);
          }
        }

        if (options.showLine) {
          var snapPath = paper.path(path);
          snapPath.node.setAttribute('class', options.classNames.line);
          seriesGroups[i].prepend(snapPath);
        }

        paper.add(seriesGroups[i]);
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