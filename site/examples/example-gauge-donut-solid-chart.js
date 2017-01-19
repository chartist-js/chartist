new Chartist.Pie('.ct-chart', {
  series: [20, 10, 30, 40]
}, {
  donut: true,
  donutWidth: 60,
  donutSolid: true,
  startAngle: 270,
  total: 200,
  showLabel: true
});
