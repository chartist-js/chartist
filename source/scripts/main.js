'use strict';

var optionsChartistGuy = {
  chartPadding: 10,
  axisX: {
    labelOffset: 10
  }
};

var chartistGuyData = {
  labels: ['One', 'Two', 'Three', 'Four'],
  series: [
    {
      className: 'series-a',
      data: [1283000, 3250000, 5706000, 3950000]
    }
  ]
};

var examples = [
  {
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
          labelSampling: 2,
          axisX: {
            labelOffset: 20
          }
        }
      ]
    ]
  }
];

var charts = [];

// Create new snap object from SVG
var chartistGuySnap = Snap('#chartist-guy');
// Load Chartist guy SVG
Snap.load($('#chartist-guy').data('svgSrc'), function (fragment) {
  chartistGuySnap.append(fragment);

  // Add line chart to canvas of Chartist guy :-)
  charts.push(window.Chartist('#chart-canvas', chartistGuyData, optionsChartistGuy));
});

// Initialize test line chart with override settings for small breakpoint
charts.push(window.Chartist('#chart-one', examples[0].data, examples[0].options, examples[0].responsiveOptions));
// On window resize trigger reflow
$(window).on('resize', function () {
  console.log('Resize');

  charts.forEach(function(e) {
    e.update();
  });
});

