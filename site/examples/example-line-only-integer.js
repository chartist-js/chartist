new Chartist.Line('.ct-chart', {
  labels: [1, 2, 3, 4, 5, 6, 7, 8],
  series: [
    [1, 2, 3, 1, -2, 0, 1, 0],
    [-2, -1, -2, -1, -3, -1, -2, -1],
    [0, 0, 0, 1, 2, 3, 2, 1],
    [3, 2, 1, 0.5, 1, 0, -1, -3]
  ]
}, {
  high: 3,
  low: -3,
  fullWidth: true,
  // As this is axis specific we need to tell Chartist to use whole numbers only on the concerned axis
  axisY: {
    onlyInteger: true,
    offset: 20
  }
});
