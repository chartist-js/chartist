// Chartist line chart
(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Line = Chartist.Line || function (query, data, options, responsiveOptions) {

    var defaultOptions = {
        axisX: {
          offset: 0,
          showLabel: true,
          showGrid: true,
          labelInterpolationFnc: Chartist.noop
        },
        axisY: {
          offset: 5,
          showLabel: true,
          showGrid: true,
          labelAlign: 'right',
          labelInterpolationFnc: Chartist.noop,
          scaleMinSpace: 20
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
      dataArray = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length),
      i;

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

      // Create X-Axis
      Chartist.interpolateData(data.labels, options.axisX.labelInterpolationFnc, function (data, index, interpolatedValue) {
        var pos = chartRect.x1 + chartRect.width() / data.length * index;

        if (options.axisX.showGrid) {
          var line = paper.line(pos, chartRect.y1, pos, chartRect.y2);
          line.node.setAttribute('class', [options.classNames.grid, options.classNames.horizontal].join(' '));
          grid.add(line);
        }

        if (options.axisX.showLabel) {
          // Use config offset for setting labels of
          var label = paper.text(pos + 2, 0, '' + interpolatedValue);
          label.node.setAttribute('class', [options.classNames.label, options.classNames.horizontal].join(' '));

          // TODO: should use 'alignment-baseline': 'hanging' but not supported in firefox. Instead using calculated height to offset y pos
          label.attr({
            y: chartRect.y1 + Chartist.getHeight(label.node) + options.axisX.offset
          });

          labels.add(label);
        }
      });

      // Create Y-Axis
      Chartist.interpolateData(bounds.values, options.axisY.labelInterpolationFnc, function (data, index, interpolatedValue) {
        var pos = chartRect.y1 - chartRect.height() / data.length * index;

        if (options.axisY.showGrid) {
          var line = paper.line(chartRect.x1, pos, chartRect.x2, pos);
          line.node.setAttribute('class', options.classNames.grid + ' ' + options.classNames.vertical);
          grid.add(line);
        }

        if (options.axisY.showLabel) {
          // Position later
          //TODO: make padding of 2px configurable
          var label = paper.text(options.axisY.labelAlign === 'right' ? yAxisOffset - options.axisY.offset + options.chartPadding : options.chartPadding,
            pos - 2, '' + interpolatedValue);
          label.node.setAttribute('class', options.classNames.label + ' ' + options.classNames.vertical);

          // Set text-anchor based on alignment
          label.attr({
            'text-anchor': options.axisY.labelAlign === 'right' ? 'end' : 'start'
          });

          labels.add(label);
        }
      });

      function createSeries(data, seriesGroup, projectPointFnc) {
        var p = projectPointFnc(data, 0),
          path = 'M' + p.x + ',' + p.y + ' ' + (options.lineSmooth ? 'R' : 'L'),
          point;

        // First dot we need to add before loop
        if (options.showPoint) {
          point = paper.line(p.x, p.y, p.x, p.y);
          point.node.setAttribute('class', options.classNames.point);
          seriesGroup.append(point);
        }

        // First point is created, continue with rest
        for (var i = 1; i < data.length; i++) {
          p = projectPointFnc(data, i);
          path += ' ' + p.x + ',' + p.y;

          //If we should show points we need to create them now to avoid secondary loop
          if (options.showPoint) {
            point = paper.line(p.x, p.y, p.x, p.y);
            point.node.setAttribute('class', options.classNames.point);
            seriesGroup.append(point);
          }
        }

        if (options.showLine) {
          var snapPath = paper.path(path);
          snapPath.node.setAttribute('class', options.classNames.line);
          seriesGroup.prepend(snapPath);
        }
      }

      function projectPoint(data, index) {
        return {
          x: chartRect.x1 + chartRect.width() / data.length * index,
          y: chartRect.y1 - data[index] / bounds.range * chartRect.height() + (bounds.min / bounds.range * chartRect.height())
        };
      }

      // Draw the series
      // initialize series groups
      for (i = 0; i < data.series.length; i++) {
        seriesGroups[i] = paper.g();
        // Use series class from series data or if not set generate one
        seriesGroups[i].node.setAttribute('class', options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        createSeries(data.series[i].data, seriesGroups[i], projectPoint);

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