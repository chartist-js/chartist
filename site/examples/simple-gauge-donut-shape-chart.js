new Chartist.Pie('.ct-chart', {
  series: [20, 10, 30, 40]
}, {
  donut: true,
  donutHoleFraction: .7,
  startAngle: 270,
  total: 200,
  showLabel: true
});