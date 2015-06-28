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
    root['Chartist.plugins.ctAccessibility'] = factory();
  }
}(this, function () {

  /**
   * Chartist.js plugin that generates visually hidden tables for better accessibility. It's also possible to initialize a Chart with data from an existing table.
   *
   */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    // A simple recursive DOM string builder
    function Element(name, attrs, parent) {
      return {
        elem: function (name, attrs) {
          var e = Element(name, attrs, this);
          this.children.push(e);
          return e;
        },
        children: [],
        name: name,
        _attrs: attrs || {},
        _parent: parent,
        parent: function () {
          return this._parent;
        },
        attrs: function (attrs) {
          this._attrs = attrs;
          return this;
        },
        text: function (text, after) {
          if (after) {
            this._textAfter = text;
          } else {
            this._textBefore = text;
          }
          return this;
        },
        toString: function () {
          var attrs = Object.keys(this._attrs).filter(function (attrName) {
            return this._attrs[attrName] || this._attrs[attrName] === 0;
          }.bind(this)).map(function (attrName) {
            return [attrName, '="', this._attrs[attrName], '"'].join('');
          }.bind(this)).join(' ');

          return ['<', this.name, attrs ? ' ' + attrs : '', '>', this._textBefore].concat(this.children.map(function (child) {
            return child.toString();
          })).concat([this._textAfter, '</', this.name, '>']).join('');
        }
      };
    }

    var defaultOptions = {
      caption: 'A graphical chart',
      seriesHeader: 'Series name',
      valueTransform: Chartist.noop,
      summary: undefined,
      elementId: function () {
        return 'ct-accessibility-table-' + (+new Date());
      },
      visuallyHiddenStyles: 'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;'
    };

    Chartist.plugins = Chartist.plugins || {};

    Chartist.plugins.ctAccessibility = function (options) {

      options = Chartist.extend({}, defaultOptions, options);

      return function ctAccessibility(chart) {
        var elementId = typeof options.elementId === 'function' ? options.elementId() : options.elementId;

        chart.on('created', function (data) {
          var containerElement = data.svg._node.parentNode;

          var previousElement = containerElement.querySelector('#' + elementId);
          if(previousElement) {
            containerElement.removeChild(previousElement);
          }

          // As we are now compensating the SVG graphic with the chart with an accessibility table, we hide it for ARIA
          data.svg.attr({
            'aria-hidden': 'true'
          });

          // Create wrapper element
          var element = Element('div', {
            style: options.visuallyHiddenStyles,
            id: elementId
          });

          // Create table body with caption
          var tBody = element.elem('table', {
            summary: options.summary
          }).elem('caption')
            .text(options.caption)
            .elem('tbody');

          var firstRow = tBody.elem('tr');

          if (chart instanceof Chartist.Pie) {
            // For pie charts we have only column headers and one series
            var dataArray = Chartist.getDataArray(chart.data, chart.optionsProvider.getCurrentOptions().reverseData);

            // First render the column headers with our pie chart labels
            chart.data.labels.forEach(function (text) {
              firstRow
                .elem('th', {
                  scope: 'col',
                  role: 'columnheader'
                })
                .text(text);
            });

            var row = tBody.elem('tr');

            // Add all data fields of our pie chart to the row
            dataArray.forEach(function (dataValue) {
              row.elem('td').text(options.valueTransform(dataValue));
            });

          } else {
            // For line and bar charts we have multiple series and therefore also row headers
            var normalizedData = Chartist.getDataArray(chart.data, chart.optionsProvider.getCurrentOptions().reverseData);

            // Add column headers inclusing the series column header for the row headers
            [options.seriesHeader].concat(chart.data.labels).forEach(function (text) {
              firstRow
                .elem('th', {
                  scope: 'col',
                  role: 'columnheader'
                })
                .text(text);
            });

            // Add all data rows including their row headers
            chart.data.series.forEach(function (series, index) {
              var seriesName = series.name || [index + 1, '. Series'].join('');

              var row = tBody.elem('tr');

              row.elem('th', {
                scope: 'row',
                role: 'rowheader'
              }).text(seriesName);

              normalizedData[index].forEach(function (dataValue) {
                row.elem('td').text(options.valueTransform(dataValue));
              });
            });
          }

          // Update invisible table in DOM and update table element with newly created table
          containerElement.appendChild(new DOMParser().parseFromString(element.toString(), 'text/html').getElementById(elementId));
        });
      };
    };

  }(window, document, Chartist));

  return Chartist.plugins.ctAccessibility;

}));
