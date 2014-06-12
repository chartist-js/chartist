/**
 * @author: Gion Kunz
 * @name: Chartist - Bar Chart
 * @param document
 * @param window
 * @param Chartist
 * @param undefined
 */
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
      paper,
      dataArray = Chartist.normalizeDataArray(Chartist.getDataArray(data), data.labels.length);

     function createChart(options) {
      var xAxisOffset,
        yAxisOffset,
        seriesGroups = [],
        bounds;

        /**
         * @description Create new paper the stage
         */
      paper = Chartist.createPaper(query, options.width, options.height);

        /**
         * @description initialize bounds
         */
      bounds = Chartist.getBounds(paper, dataArray, options, null, 0);

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

        /**
         * @description Start drawing
         */
      var labels = paper.g(),
        grid = paper.g();

      Chartist.createXAxis(paper, chartRect, data, grid, labels, options);
      Chartist.createYAxis(paper, chartRect, bounds, grid, labels, yAxisOffset, options);

        /**
         * @description Draw the series
         * @description initialize series groups
         */
      for (var i = 0; i < data.series.length; i++) {
          /**
           * @description Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
           * @type {number}
           */
        var biPol = i - (data.series.length - 1) / 2,
              /**
               * @description Half of the period with between vertical grid lines used to position bars
               * @type {number}
               */
          periodHalfWidth = chartRect.width() / data.series[i].data.length / 2;

        seriesGroups[i] = paper.g();
          /**
           * @description Use series class from series data or if not set generate one
           */
        seriesGroups[i].node.setAttribute('class', options.classNames.series + ' ' +
          (data.series[i].className || options.classNames.series + '-' + Chartist.alphaNumerate(i)));

        for(var j = 0; j < data.series[i].data.length; j++) {
          var p = Chartist.projectPoint(chartRect, bounds, data.series[i].data, j),
            bar;

            /**
             * @description Offset to center bar between grid lines and using bi-polar offset for multiple series
             * @type {number}
             */
          // TODO: Check if we should really be able to add classes to the series. Should be handles with SASS and semantic / specific selectors
          p.x += periodHalfWidth + (biPol * options.seriesBarDistance);

          bar = paper.line(p.x, chartRect.y1, p.x, p.y);
          bar.node.setAttribute('class', options.classNames.bar + (data.series[i].barClasses ? ' ' + data.series[i].barClasses : ''));
          seriesGroups[i].prepend(bar);
        }

        paper.add(seriesGroups[i]);
      }
    }

      /**
       * @description Obtain current options based on matching media queries (if responsive options are given
       * @description This will also register a listener that is re-creating the chart based on media changes
       */
    currentOptions = Chartist.optionsProvider(defaultOptions, options, responsiveOptions, function (changedOptions) {
      currentOptions = changedOptions;
      createChart(currentOptions);
    });

    // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
      /**
       * @description This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
       * @description work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
       * @description See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
       * @description Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
       * @description The problem is with the label offsets that can't be converted into percentage and affecting the chart container
       */
    window.addEventListener('resize', function () {
      createChart(currentOptions);
    });

      /**
       * @description Public members
       */
    return {
      version: Chartist.version,
      update: function () {
        createChart(currentOptions);
      }
    };
  };
}(document, window, window.Chartist));