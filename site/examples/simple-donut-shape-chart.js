new Chartist.Pie('.ct-chart', {
  series: [20, 10, 30, 40]
}, {
  donut: true,
  donutHoleFraction: .3,
  startAngle: 270,
  showLabel: true
});