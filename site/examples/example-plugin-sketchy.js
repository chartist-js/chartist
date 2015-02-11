new Chartist.Bar('.ct-chart', {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    [800000, 1200000, 1400000, 1300000],
    [200000, 400000, 500000, 300000],
    [100000, 200000, 400000, 600000]
  ]
}, {
  plugins: [
    Chartist.plugins.ctSketchy({
      overrides: {
        grid: {
          baseFrequency: 0.2,
          scale: 5,
          numOctaves: 1
        },
        bar: {
          baseFrequency: 0.02,
          scale: 10
        },
        label: false
      }
    })
  ],
  stackBars: true,
  axisY: {
    labelInterpolationFnc: function(value) {
      return (value / 1000) + 'k';
    }
  }
}).on('draw', function(data) {
  if(data.type === 'bar') {
    data.element.attr({
      style: 'stroke-width: 30px'
    });
  }
});
