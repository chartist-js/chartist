'use strict';

var options = {
  labelOffset: 40,
  labelPadding: 5,
  labelSampling: 1,
  labelInterpolationFnc: function (l) {
    return l;
  },
  showLines: true,
  showPoint: true,
  showLabels: true,
  showVerticalGrid: true,
  showHorizontalGrid: true,
  horizontalGridMinSpace: 40,
  verticalGridSampling: 1,
  lineSmooth: true,
  chartPadding: 20,
  classNames: {
    labels: 'crt-label',
    series: 'crt-series',
    line: 'crt-line',
    point: 'crt-point',
    verticalGridLine: 'crt-vertical-grid',
    horizontalGridLine: 'crt-horizontal-grid'
  }
};

var optionsSmall = {
  labelSampling: 2,
  chartPadding: 10,
  labelOffset: 20
};

var data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    {
      name: 'Investment',
      className: 'investment',
      data: [1, 2, 2.7, 0, 3, 5, 3, 4, 8, 10, 12, 7]
    },
    {
      name: 'Income',
      className: 'income',
      data: [0, 1.2, 2, 7, 2.5, 9, 5, 8, 9, 11, 20]
    }
  ]
};

/*// Create new
var chartistGuySnap = Snap('#chartist-guy');
// Load Chartist guy SVG
Snap.load('/images/chartist-guy.svg', function(fragment) {
  fragment.select('svg').attr({
    'width': '100%',
    'height': '100%'
  });
  chartistGuySnap.append(fragment);
});*/

// Initialize test line chart with override settings for small breakpoint
var chartist = window.Chartist('#chart', data, options, [[Foundation.media_queries.small, optionsSmall]]);
// On window resize trigger reflow
window.addEventListener('resize', function() {
  chartist.reflow();
});