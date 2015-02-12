var chart = new Chartist.Line('.ct-chart', {
  labels: [1, 2, 3, 4, 5],
  series: [
    [1, 5, 10, 0, 1, 2],
    [10, 15, 0, 1, 2, 3]
  ]
}, {
  // Remove this configuration to see that chart rendered with cardinal spline interpolation
  // Sometimes, on large jumps in data values, it's better to use simple smoothing.
  lineSmooth: Chartist.Interpolation.simple({
    divisor: 2
  }),
  fullWidth: true,
  low: 0
});
