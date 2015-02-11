new Chartist.Line('.ct-chart', {
  labels: ['M', 'T', 'W', 'T', 'F'],
  series: [
    [12, 9, 7, 8, 5]
  ]
}, {
  plugins: [
    Chartist.plugins.ctPointLabels({
      textAnchor: 'middle'
    })
  ]
});
