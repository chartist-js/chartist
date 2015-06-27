new Chartist.Line('.ct-chart', {
  labels: ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'],
  series: [[1, 3, 7, 12, 1, 2, 1, 0]]
}, {
  chartPadding: {
    top: 20,
    right: 0,
    bottom: 30,
    left: 0
  },
  axisY: {
    onlyInteger: true
  },
  plugins: [
    Chartist.plugins.ctAxisTitle({
      axisX: {
        axisTitle: 'Time (mins)',
        axisClass: 'ct-axis-title',
        offset: {
          x: 0,
          y: 50
        },
        textAnchor: 'middle'
      },
      axisY: {
        axisTitle: 'Goals',
        axisClass: 'ct-axis-title',
        offset: {
          x: 0,
          y: 0
        },
        textAnchor: 'middle',
        flipTitle: false
      }
    })
  ]
});
