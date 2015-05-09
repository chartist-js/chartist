(function(){
  'use strict';

  // Chartist guy data chart data and options
  var optionsChartistGuy = {
    width: 195,
    height: 137,
    chartPadding: {
      top: 15,
      right: 10,
      bottom: 10,
      left: 10
    },
    axisX: {
      offset: 15,
      showLabel: true,
      showGrid: true,
      labelInterpolationFnc: function(n) {
        return n;
      }
    },
    axisY: {
      offset: 25,
      showLabel: true,
      labelOffset: {
        y: 5
      },
      showGrid: true,
      scaleMinSpace: 15,
      labelInterpolationFnc: function(n) {
        return Math.round(n / 100000) / 10 + 'm.';
      }
    }
  };

  var chartistGuyData = {
    labels: ['1st', '2nd', '3rd'],
    series: [
      {
        name: 'Workers',
        data: [1283000, 1500000, 5706000]
      },
      {
        name: 'Nobles',
        data: [1883000, 2050000, 3706000]
      }
    ]
  };

  var $chartistGuyElement = $('#chartist-guy');
  if($chartistGuyElement.length > 0) {

    // Create new snap object from SVG
    var chartistGuySnap = Snap($chartistGuyElement.get(0));
    // Load Chartist guy SVG
    Snap.load($chartistGuyElement.data('svgSrc'), function (fragment) {
      chartistGuySnap.append(fragment);

      // Add line chart to canvas of Chartist guy :-)
      window.Chartist.Line($chartistGuyElement.find('#chart-canvas').get(0), chartistGuyData, optionsChartistGuy);
    });
  }
}());
