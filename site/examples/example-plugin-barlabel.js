new Chartist.Bar('.ct-chart', {
  labels: [1, 2, 3, 4, 5, 6, 7],
  series: [
    [1, 5, 3, 4, 6, 2, 3],
    [2, 4, 2, 5, 4, 3, 6]
  ]
}, {
  plugins: [
    ctBarLabels({
      labelClass: 'ct-bar-label',
      textAnchor: 'middle'
    })
  ]
});
