/**
 * Chartist.js plugin that generates visually hidden tables for better accessibility. It's also possible to initialize a Chart with data from an existing table.
 *
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    caption: 'A graphical chart',
    seriesHeader: 'Series name',
    tableId: 'ct-table-' + (+new Date()),
    valueTransform: Chartist.noop,
    summary: undefined
  };

  /*
  *
   <table>
   <caption>Shelly's Daughters</caption>
   <tbody><tr>
   <th scope="col">Name</th>
   <th scope="col">Age</th>
   <th scope="col">Birthday</th>
   </tr>
   <tr>
   <th scope="row">Jackie</th>
   <td>5</td>
   <td>April 5</td>
   </tr>
   <tr>
   <th scope="row">Beth</th>
   <td>8</td>
   <td>January 14</td>
   </tr>
   </tbody></table>
  * */


  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.ctAccessibility = function(options) {

    options = Chartist.extend({}, defaultOptions, options);

    return function ctAccessibility(chart) {
      var table;

      chart.on('created', function(data) {
        if(table) {
          table.parentNode.removeChild(table);
        }

        data.svg.attr({
          'aria-hidden': 'true'
        });

        var tableHtml = [
          '<div style="position: absolute; width: 1px; height: 1px; overflow: hidden; margin-left: -1px">',
          '<table id="',
          options.tableId,
          '" ',
          options.summary ? 'summary="' + options.summary + '" ' : '',
          '">',
          '<caption>',
          options.caption,
          '</caption>',
          '<tbody>',
          '<tr>',
          '<th scope="col">',
          options.seriesHeader,
          '</th>'
        ];

        Array.prototype.push.apply(tableHtml, chart.data.labels.map(function(label) {
          return [
            '<th scope="col">',
            label,
            '</th>'
          ].join('');
        }));

        Array.prototype.push.apply(tableHtml, [
          '</tr>'
        ]);

        var normalizedData = Chartist.normalizeDataArray(Chartist.getDataArray(chart.data, chart.optionsProvider.currentOptions.reverseData), chart.data.labels.length);

        Array.prototype.push.apply(tableHtml, chart.data.series.map(function(series, index) {
          var seriesName = series.name || [index + 1, '. Series'].join('');
          var row = [
            '<tr>',
            '<th scope="row">',
            seriesName,
            '</th>'
          ];

          Array.prototype.push.apply(row, normalizedData[index].map(function(dataValue) {
            return [
              '<td>',
              options.valueTransform(dataValue),
              '</td>'
            ].join('');
          }));

          Array.prototype.push.apply(row, [
            '</tr>'
          ]);

          return row.join('');
        }));

        Array.prototype.push.apply(tableHtml, [
          '</table>',
          '</div>'
        ]);

        chart.container.innerHTML += tableHtml.join('');
        table = chart.container.querySelector('#' + options.tableId);
      });
    };
  };

}(window, document, Chartist));
