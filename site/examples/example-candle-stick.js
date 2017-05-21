new Chartist.Candle('.ct-chart', {
  labels: [],
  series: [
    [800000, 1400000, 600000, 900000],
    [900000, 900000, 900000, 900000],
    [900000, 2000000, 900000, 1500000],
    [1500000, 1500000, 1300000, 1400000],
    [1400000, 1500000, 50000, 500000]
  ]
}, {
  low: 0,
  axisY: {
    labelInterpolationFnc: function(value) {
      return (value / 1000) + 'k';
    }
  }
});
