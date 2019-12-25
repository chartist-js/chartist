(function (root, factory) {
  if (root === undefined && window !== undefined) root = window;
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["chartist"], function (a0) {
      return (root['Chartist.plugins.tooltip'] = factory(a0));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("chartist"));
  } else {
    root['Chartist.plugins.tooltip'] = factory(root["Chartist"]);
  }
}(this, function (Chartist) {

/**
 * Chartist.js plugin to display a data label on top of the points in a line chart.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    currency: undefined,
    currencyFormatCallback: undefined,
    tooltipOffset: {
      x: 0,
      y: -20,
    },
    anchorToPoint: false,
    appendToBody: true,
    class: undefined,
    pointClass: 'ct-point',
  };

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.tooltip = function (options) {

    options = Chartist.extend({}, defaultOptions, options);

    return function tooltip(chart) {
      // Warning: If you are using npm link or yarn link, these instanceof checks will fail and you won't any tooltips
      var tooltipSelector = options.pointClass;
      if (chart instanceof Chartist.Bar) {
        tooltipSelector = 'ct-bar';
      } else if (chart instanceof Chartist.Pie) {
        // Added support for donut graph
        if (chart.options.donut) {
          // Added support for the solid donut graph
          tooltipSelector = chart.options.donutSolid ? 'ct-slice-donut-solid' : 'ct-slice-donut';
        } else {
          tooltipSelector = 'ct-slice-pie';
        }
      }

      var $chart = chart.container;
      var $toolTipIsShown = false;
      var $tooltipOffsetParent = offsetParent($chart);
      var $toolTip;

      if (!options.appendToBody) {
        // searching for existing tooltip in the chart, because appendToBody is disabled
        $toolTip = $chart.querySelector('.chartist-tooltip');
      } else {
        // searching for existing tooltip in the body, because appendToBody is enabled
        $toolTip = document.querySelector('.chartist-tooltip');
      }
      if (!$toolTip) {
        $toolTip = document.createElement('div');
        $toolTip.className = (!options.class) ? 'chartist-tooltip' : 'chartist-tooltip ' + options.class;
        if (!options.appendToBody) {
          $chart.appendChild($toolTip);
        } else {
          document.body.appendChild($toolTip);
        }
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

        var isPieChart = (chart instanceof Chartist.Pie) ? $point : $point.parentNode;
        var seriesName = (isPieChart) ? $point.parentNode.getAttribute('ct:meta') || $point.parentNode.getAttribute('ct:series-name') : '';
        var meta = $point.getAttribute('ct:meta') || seriesName || '';
        var hasMeta = !!meta;
        var value = $point.getAttribute('ct:value');

        if (options.transformTooltipTextFnc && typeof options.transformTooltipTextFnc === 'function') {
          value = options.transformTooltipTextFnc(value);
        }

        if (options.tooltipFnc && typeof options.tooltipFnc === 'function') {
          tooltipText = options.tooltipFnc(meta, value);
        } else {
          if (options.metaIsHTML) {
            var txt = document.createElement('textarea');
            txt.innerHTML = meta;
            meta = txt.value;
          }

          meta = '<span class="chartist-tooltip-meta">' + meta + '</span>';

          if (hasMeta) {
            tooltipText += meta + '<br>';
          } else {
            // For Pie Charts also take the labels into account
            // Could add support for more charts here as well!
            if (chart instanceof Chartist.Pie) {
              var label = next($point, 'ct-label');
              if (label) {
                tooltipText += text(label) + '<br>';
              }
            }
          }

          if (value) {
            if (options.currency) {
              if (options.currencyFormatCallback != undefined) {
                value = options.currencyFormatCallback(value, options);
              } else {
                value = options.currency + value.replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, '$1,');
              }
            }
            value = '<span class="chartist-tooltip-value">' + value + '</span>';
            tooltipText += value;
          }
        }

        if (tooltipText) {
          $toolTip.innerHTML = tooltipText;

          // Calculate new width and height, as toolTip width/height may have changed with innerHTML change
          height = $toolTip.offsetHeight;
          width = $toolTip.offsetWidth;

          if (options.appendToBody !== true) {
            $tooltipOffsetParent = offsetParent($chart);
          }
          if ($toolTip.style.display !== 'absolute') {
            $toolTip.style.display = 'absolute';
          }
          setPosition(event);
          show($toolTip);

          // Remember height and width to avoid wrong position in IE
          height = $toolTip.offsetHeight;
          width = $toolTip.offsetWidth;
        }
      });

      on('mouseout', tooltipSelector, function () {
        hide($toolTip);
      });

      on('mousemove', null, function (event) {
        if (options.anchorToPoint === false && $toolTipIsShown) {
          setPosition(event);
        }
      });

      function setPosition(event) {
        height = height || $toolTip.offsetHeight;
        width = width || $toolTip.offsetWidth;
        var offsetX = -width / 2 + options.tooltipOffset.x;
        var offsetY = -height + options.tooltipOffset.y;

        var anchor = options.anchorToPoint === true && event.target.x2 && event.target.y2;

        if (options.appendToBody === true) {
          if (anchor) {
            var box = $chart.getBoundingClientRect();
            var left = event.target.x2.baseVal.value + box.left + window.pageXOffset;
            var top = event.target.y2.baseVal.value + box.top + window.pageYOffset;

            $toolTip.style.left = left + offsetX + 'px';
            $toolTip.style.top = top + offsetY + 'px';
          } else {
            $toolTip.style.left = event.pageX + offsetX + 'px';
            $toolTip.style.top = event.pageY + offsetY + 'px';
          }
        } else {
          var offsetBox = $tooltipOffsetParent.getBoundingClientRect();
          var allOffsetLeft = -offsetBox.left - window.scrollX + offsetX;
          var allOffsetTop = -offsetBox.top - window.scrollY + offsetY;

          if (anchor) {
            var box = $chart.getBoundingClientRect();
            var left = event.target.x2.baseVal.value + box.left + window.pageXOffset;
            var top = event.target.y2.baseVal.value + box.top + window.pageYOffset;

            $toolTip.style.left = left + allOffsetLeft + 'px';
            $toolTip.style.top = top + allOffsetTop + 'px';
          } else {
            $toolTip.style.left = event.pageX + allOffsetLeft + 'px';
            $toolTip.style.top = event.pageY + allOffsetTop + 'px';
          }
        }
      }

      /**
       * Shows the tooltip element, if not shown
       * @param element
       */
      function show(element) {
        $toolTipIsShown = true;
        if (!hasClass(element, 'tooltip-show')) {
          element.className = element.className + ' tooltip-show';
        }
      }

      /**
       * Hides the tooltip element
       * @param element
       */
      function hide(element) {
        $toolTipIsShown = false;
        var regex = new RegExp('tooltip-show' + '\\s*', 'gi');
        element.className = element.className.replace(regex, '').trim();
      }

    };
  };

  /**
   * Returns whether a element has a css class called className
   * @param element
   * @param className
   * @return {boolean}
   */
  function hasClass(element, className) {
    return (' ' + element.getAttribute('class') + ' ').indexOf(' ' + className + ' ') > -1;
  }

  function next(element, className) {
    do {
      element = element.nextSibling;
    } while (element && !hasClass(element, className));
    return element;
  }

  /**
   *
   * @param element
   * @return {string | string}
   */
  function text(element) {
    return element.innerText || element.textContent;
  }

  /**
   * Returns the first positioned parent of the element
   * @return HTMLElement
   */
  function offsetParent(elem) {
    if (offsetParent in elem) {
      // Using the native property if possible
      var parent = elem.offsetParent;

      if (!parent) {
        parent = document.body.parentElement;
      }

      return parent;
    }

    var parent = elem.parentNode;
    if (!parent) {
      return document.body.parentElement;
    }

    if (window.getComputedStyle(parent).position !== 'static') {
      return parent;
    } else if (parent.tagName === 'BODY') {
      return parent.parentElement;
    } else {
      return offsetParent(parent);
    }
  }

}(window, document, Chartist));

return Chartist.plugins.tooltip;

}));
