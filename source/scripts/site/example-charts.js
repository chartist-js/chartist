(function (window, document, jQuery, undefined) {
  'use strict';

  var Examples = window.Examples = {};

  Examples.data = {
    // Smoothed line chart with four series and label interpolation responsive demo
    'example-gallery-one': {
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'],
        series: [
          [12, 9, 7, 8, 6, 4, 3, 2, 0],
          [2, 1, 3.5, 7, 9, 8, 7.7, 4, 7],
          [1, 3, 4, 5, 6, 8, 9, 10, 11],
          [11, 7.5, 5.5, 5.5, 4, 3.5, 2, 1, 0]
        ]
      },
      options: {
        axisX: {
          offset: 15
        },
        axisY: {
          offset: 15
        }
      }
    },

    // Bar chart small example with two series
    'example-gallery-two': {
      data: {
        labels: ['1938', '1939', '1940', '1941', '1942', '1943'],
        series: [
          [12000, 9000, 7000, 8000, 12000, 10000],
          [2000, 1000, 3500, 7000, 5000, 9000]
        ]
      },
      options: {
        seriesBarDistance: 5,
        axisX: {
          offset: 15
        },
        axisY: {
          offset: 15
        }
      }
    },

    // Simple pie chart
    'example-gallery-three': {
      data: {
        labels: ['Day one', 'Day two', 'Day three', 'Day four'],
        series: [20, 15, 40, 10]
      },
      options: {
        labelInterpolationFnc: function(value) {
          return value.split(/\s+/).reduce(function(str, elem) {
            return str + elem[0] + '.';
          }, '');
        }
      },
      responsiveOptions: [
        [
          Foundation.media_queries.medium,
          {
            chartPadding: 30,
            labelOffset: 50,
            labelDirection: 'explode',
            labelInterpolationFnc: function(value) {
              return value;
            }
          }
        ],
        [
          Foundation.media_queries.large,
          {
            labelOffset: 80
          }
        ],
        [
          Foundation.media_queries.xlarge,
          {
            labelOffset: 100
          }
        ]
      ]
    },

    // Pie as donut
    'example-gallery-four': {
      data: {
        series: [60, 20]
      },
      options: {
        donut: true,
        donutWidth: 40,
        total: 100,
        labelInterpolationFnc: function(value) {
          return value + '%';
        }
      },
      responsiveOptions: [
        [
          Foundation.media_queries.medium,
          {
            labelOffset: 30,
            chartPadding: 10,
            labelDirection: 'explode'
          }
        ],
        [
          Foundation.media_queries.large,
          {
            labelOffset: -30,
            chartPadding: 0,
            labelDirection: 'implode'
          }
        ]
      ]
    },

    // Simple line chart demo with month view on x axis and label interpolation that only shows ever second month's label on mobile
    'example-line-months-interpolation': {
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        series: [
          [1, 2, 2.7, 0, 3, 5, 3, 4, 8, 10, 12, 7],
          [0, 1.2, 2, 7, 2.5, 9, 5, 8, 9, 11, 14, 4],
          [10, 9, 8, 6.5, 6.8, 6, 5.4, 5.3, 4.5, 4.4, 3, 2.8]
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
          [1, 2, 3, 5, 8, 13]
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
          [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
          [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
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
    },

    // Simple settings override
    'simple-configuration-chart': {
      data: {
        labels: ['1', '2', '3', '4', '5', '6'],
        series: [
          [5, 4, 3, 7, 5, 10],
          [3, 2, 9, 5, 4, 6],
          [2, 1, 2.8, 4, 3, 5]
        ]
      },
      options: {
        showPoint: false,
        lineSmooth: false,
        axisX: {
          showGrid: false,
          showLabel: false
        },
        axisY: {
          offset: 40,
          labelInterpolationFnc: function(value) {
            return '£' + value + 'm';
          }
        }
      },
      responsiveOptions: []
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