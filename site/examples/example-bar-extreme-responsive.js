new Chartist.Bar('.ct-chart', {
  labels: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
  series: [
    [5, 4, 3, 7],
    [3, 2, 9, 5],
    [1, 5, 8, 4],
    [2, 3, 4, 6],
    [4, 1, 2, 1]
  ]
}, {
  // Default mobile configuration
  stackBars: true,
  axisX: {
    labelInterpolationFnc: function(value) {
      return value.split(/\s+/).map(function(word) {
        return word[0];
      }).join('');
    }
  },
  axisY: {
    offset: 20
  }
}, [
  // Options override for media > 400px
  ['screen and (min-width: 400px)', {
    reverseData: true,
    horizontalBars: true,
    axisX: {
      labelInterpolationFnc: Chartist.noop
    },
    axisY: {
      offset: 60
    }
  }],
  // Options override for media > 800px
  ['screen and (min-width: 800px)', {
    stackBars: false,
    seriesBarDistance: 10
  }],
  // Options override for media > 1000px
  ['screen and (min-width: 1000px)', {
    reverseData: false,
    horizontalBars: false,
    seriesBarDistance: 15
  }]
]);
