(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Chartist.plugins.ctThreshold'] = factory();
  }
}(this, function () {

  /**
   * Chartist.js plugin to display a data label on top of the points in a line chart.
   *
   */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
      threshold: 0,
      classNames: {
        aboveThreshold: 'ct-threshold-above',
        belowThreshold: 'ct-threshold-below'
      },
      maskNames: {
        aboveThreshold: 'ct-threshold-mask-above',
        belowThreshold: 'ct-threshold-mask-below'
      }
    };

    function createMasks(data, options) {
      // Select the defs element within the chart or create a new one
      var defs = data.svg.querySelector('defs') || data.svg.elem('defs');
      // Project the threshold value on the chart Y axis
      var projectedThreshold = data.chartRect.height() - data.axisY.projectValue(options.threshold) + data.chartRect.y2;
      var width = data.svg.width();
      var height = data.svg.height();

      // Create mask for upper part above threshold
      defs
        .elem('mask', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          id: options.maskNames.aboveThreshold
        })
        .elem('rect', {
          x: 0,
          y: 0,
          width: width,
          height: projectedThreshold,
          fill: 'white'
        });

      // Create mask for lower part below threshold
      defs
        .elem('mask', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          id: options.maskNames.belowThreshold
        })
        .elem('rect', {
          x: 0,
          y: projectedThreshold,
          width: width,
          height: height - projectedThreshold,
          fill: 'white'
        });

      return defs;
    }

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctThreshold = function (options) {

      options = Chartist.extend({}, defaultOptions, options);

      return function ctThreshold(chart) {
        if (chart instanceof Chartist.Line || chart instanceof Chartist.Bar) {
          chart.on('draw', function (data) {
            if (data.type === 'point') {
              // For points we can just use the data value and compare against the threshold in order to determine
              // the appropriate class
              data.element.addClass(
                data.value.y >= options.threshold ? options.classNames.aboveThreshold : options.classNames.belowThreshold
              );
            } else if (data.type === 'line' || data.type === 'bar' || data.type === 'area') {
              // Cloning the original line path, mask it with the upper mask rect above the threshold and add the
              // class for above threshold
              data.element
                .parent()
                .elem(data.element._node.cloneNode(true))
                .attr({
                  mask: 'url(#' + options.maskNames.aboveThreshold + ')'
                })
                .addClass(options.classNames.aboveThreshold);

              // Use the original line path, mask it with the lower mask rect below the threshold and add the class
              // for blow threshold
              data.element
                .attr({
                  mask: 'url(#' + options.maskNames.belowThreshold + ')'
                })
                .addClass(options.classNames.belowThreshold);
            }
          });

          // On the created event, create the two mask definitions used to mask the line graphs
          chart.on('created', function (data) {
            createMasks(data, options);
          });
        }
      };
    }
  }(window, document, Chartist));

  return Chartist.plugins.ctThreshold;

}));
