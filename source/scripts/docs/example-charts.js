(function (window, document, jQuery, undefined) {
  'use strict';

  var Examples = window.Examples = {};

  Examples.data = {
    // Smoothed line chart with four series and label interpolation responsive demo
    'example-line-four-series': {
      data: {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        series: [
          {
            data: [12, 9, 7, 8, 6, 4, 3, 2, 0]
          },
          {
            data: [2, 1, 4, 7, 9, 8, 7, 4, 7]
          },
          {
            data: [1, 2, 4, 5, 6, 8, 9, 10, 11]
          },
          {
            data: [11, 7.5, 5.5, 5, 4, 3.5, 2, 1, 0]
          }
        ]
      },
      options: {
        axisX: {
          offset: 40,
          labelInterpolationFnc: function (value) {
            return 'Week ' + value;
          }
        },
        axisY: {
          offset: 40
        }
      },
      responsiveOptions: [
        [
          Foundation.media_queries.small,
          {
            axisX: {
              offset: 5,
              labelInterpolationFnc: function (value, index) {
                // Interpolation function causes only every 2nd label to be displayed
                if (index % 2 !== 0) {
                  return false;
                } else {
                  return 'W' + value;
                }
              }
            },
            axisY: {
              offset: 5
            }
          }
        ]
      ]
    },

    // Simple line chart demo with month view on x axis and label interpolation that only shows ever second month's label on mobile
    'example-line-months-interpolation': {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        series: [
          {
            data: [1, 2, 2.7, 0, 3, 5, 3, 4, 8, 10, 12, 7]
          },
          {
            data: [0, 1.2, 2, 7, 2.5, 9, 5, 8, 9, 11, 14, 4]
          },
          {
            data: [10, 9, 8, 6.5, 6.8, 6, 5.4, 5.3, 4.5, 4.4, 3, 2.8]
          }
        ]
      },
      options: {
      },
      responsiveOptions: [
        [
          Foundation.media_queries.small,
          {
            axisX: {
              labelInterpolationFnc: function (value, index) {
                // Interpolation function causes only every 2nd label to be displayed
                if (index % 2 !== 0) {
                  return false;
                } else {
                  return value;
                }
              }
            }
          }
        ]
      ]
    },

    // This line chart example is focusing on responsive options
    'example-line-simple-responsive': {
      data: {
        labels: ['1', '2', '3', '4', '5', '6'],
        series: [
          {
            data: [1, 2, 3, 5, 8, 13]
          }
        ]
      },
      options: {
        axisX: {
          labelInterpolationFnc: function (value) {
            return 'Calendar Week ' + value;
          }
        }
      },
      responsiveOptions: [
        ['screen and (min-width: 641px) and (max-width: 1024px)', {
          showPoint: false,
          axisX: {
            labelInterpolationFnc: function (value) {
              return 'Week ' + value;
            }
          }
        }],
        ['screen and (max-width: 640px)', {
          showLine: false,
          axisX: {
            labelInterpolationFnc: function (value) {
              return 'W' + value;
            }
          }
        }]
      ]
    },

    // This line chart example is focusing on responsive options
    'example-simple-bar': {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        series: [
          {
            data: [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8]
          },
          {
            data: [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
          }
        ]
      },
      options: {
        seriesBarDistance: 15
      },
      responsiveOptions: [
        ['screen and (min-width: 641px) and (max-width: 1024px)', {
          seriesBarDistance: 10,
          axisX: {
            labelInterpolationFnc: function (value) {
              return value;
            }
          }
        }],
        ['screen and (max-width: 640px)', {
          seriesBarDistance: 5,
          axisX: {
            labelInterpolationFnc: function (value) {
              return value[0];
            }
          }
        }]
      ]
    }
  };

  Examples.charts = [];

  // Handler for initializing example charts with data attributes
  $('[data-chartist-example]').each(function () {
    var $chartContainer = $(this),
      type = $chartContainer.data('chartistExample'),
      id = $chartContainer.attr('id'),
      args,
      example = Examples.data[id];

    // Fill required arguments for Chartist constructor call
    args = [
      $chartContainer.get(0),
      example.data
    ];

    if (example.options) {
      args.push(example.options);

      // Nested because there can't be responsive options if there is no options arg
      if (example.responsiveOptions) {
        args.push(example.responsiveOptions);
      }
    }

    // Call constructor of given chart type (Line, Bar etc) with arguments constructed earlier
    Examples.charts[id] = window.Chartist[type].apply(undefined, args);
  });

}(window, document, jQuery));