new Chartist.Candle('.ct-chart', {
  labels: [],
  series: [
    [800000, 1400000, 600000, 900000],
    [900000, 900000, 900000, 900000],
    [900000, 2000000, 900000, 1500000],
    [1500000, 1500000, 1300000, 1400000]
  ]
}, {
  axisY: {
    labelInterpolationFnc: function(value) {
      return (value / 1000) + 'k';
    }
  }
}).on('draw', function(data) {
  if(data.type === 'candle') {
    data.element.attr({
      style: 'stroke-width: 30px'
    });
  }
});
