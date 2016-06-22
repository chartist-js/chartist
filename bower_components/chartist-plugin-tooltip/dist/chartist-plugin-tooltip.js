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
    root['Chartist.plugins.tooltips'] = factory();
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
          currency: undefined,
          tooltipOffset: {
              x: 0,
              y: -20
          }
          // showTooltips: true,
          // tooltipEvents: ['mousemove', 'touchstart', 'touchmove'],
          // labelClass: 'ct-label',
          // labelOffset: {
          //   x: 0,
          //   y: -10
          // },
          // textAnchor: 'middle'
      };

      Chartist.plugins = Chartist.plugins || {};
      Chartist.plugins.tooltip = function (options) {

          options = Chartist.extend({}, defaultOptions, options);

          return function tooltip(chart) {
              var tooltipSelector = 'ct-point';
              if (chart instanceof Chartist.Bar) {
                  tooltipSelector = 'ct-bar';
              } else if (chart instanceof Chartist.Pie) {
                  // Added support for donut graph
                  if (chart.options.donut) {
                      tooltipSelector = 'ct-slice-donut';
                  } else {
                      tooltipSelector = 'ct-slice-pie';
                  }
              }

              var $chart = chart.container;
              var $toolTip = $chart.querySelector('.chartist-tooltip');
              if (!$toolTip) {
                  $toolTip = document.createElement('div');
                  $toolTip.className = 'chartist-tooltip';
                  $chart.appendChild($toolTip);
              }
              var height = $toolTip.offsetHeight;
              var width = $toolTip.offsetWidth;

              hide($toolTip);

              function on(event, selector, callback) {
                  $chart.addEventListener(event, function (e) {
                      if (!selector || hasClass(e.target, selector))
                          callback(e);
                  });
              }

              on('mouseover', tooltipSelector, function (event) {
                  var $point = event.target;
                  var tooltipText = '';

                  var meta = $point.getAttribute('ct:meta') || '';
                  var value = $point.getAttribute('ct:value');

                  if (options.tooltipFnc) {
                      tooltipText = options.tooltipFnc(meta, value);
                  } else {
                      if (meta) {
                          tooltipText += meta + '<br>';
                      } else {
                          // For Pie Charts also take the labels into account
                          // Could add support for more charts here as well!
                          if (chart instanceof Chartist.Pie) {
                              var label = next($point, 'ct-label');
                              if (label.length > 0) {
                                  tooltipText += text(label) + '<br>';
                              }
                          }
                      }

                      if (options.currency) {
                          value = options.currency + value.replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
                      }
                      tooltipText += value;
                  }

                  $toolTip.innerHTML = tooltipText;
                  setPosition(event);
                  show($toolTip);

                  // Remember height and width to avoid wrong position in IE
                  height = $toolTip.offsetHeight;
                  width = $toolTip.offsetWidth;
              });

              on('mouseout', tooltipSelector, function () {
                  hide($toolTip);
              });

              on('mousemove', null, function (event) {
                  setPosition(event);
              });

              function setPosition(event) {
                  // For some reasons, on FF, we can't rely on event.offsetX and event.offsetY,
                  // that's why we prioritize event.layerX and event.layerY
                  // see https://github.com/gionkunz/chartist-js/issues/381
                  height = height || $toolTip.offsetHeight;
                  width = width || $toolTip.offsetWidth;
                  $toolTip.style.top = (event.layerY || event.offsetY) - height + options.tooltipOffset.y + 'px';
                  $toolTip.style.left = (event.layerX || event.offsetX) - width / 2 + options.tooltipOffset.x + 'px';
              }
          }
      };

      function show(element) {
          element.style.display = 'block';
      }

      function hide(element) {
          element.style.display = 'none';
      }

      function hasClass(element, className) {
          return (' ' + element.getAttribute('class') + ' ').indexOf(' ' + className + ' ') > -1;
      }

      function next(element, className) {
          do {
              element = element.nextSibling;
          } while (element && !hasClass(element, className));
          return element;
      }

      function text(element) {
          return element.innerText || element.textContent;
      }

  } (window, document, Chartist));

  return Chartist.plugins.tooltips;

}));
