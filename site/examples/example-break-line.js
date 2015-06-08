new Chartist.Line('.ct-chart',
  {
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
    series: [
      {
        data: [
          null, null, null, null, null, null, null, 455, 589, 850, 1150, 1200, 1300, 1400, 1500
        ]
      },
      {
        data: [
          1, 52, 52, 69, 104, 232, 301, 455
        ]
      }
    ]
  },
  {
    allowVariableDataLengths: true,
    showPoint: true,
    lineSmooth: true,
    showLine: true,
    breakLine: {
      enabled: true,
      limit: 1024
    }
  }
);