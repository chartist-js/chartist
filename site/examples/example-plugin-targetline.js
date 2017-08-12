new Chartist.Line('.ct-chart', {
  labels: ['M', 'T', 'W', 'T', 'F'],
  series: [
    [5, 11, 2, 5, 7]
  ]
}, {
  plugins: [
    Chartist.plugins.ctTargetLine({
      value: 6
    })
  ]
});
