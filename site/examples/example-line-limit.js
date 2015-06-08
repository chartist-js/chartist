new Chartist.Line('.ct-chart',
  {
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
    series: [
      {
        data: [
          232, 44, 101, 32, 69, 565, 83, 301, 222, 455, 34, 22, 129, 82, 487, 20
        ]
      },
      {
        data: [
          88, 43, 5, 72, 500, 401, 350, 420, 77, 320, 520, 255, 401, 99
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
      limit: 1024,
      smartAlign: true
    },
    showLimitLine: {
      enabled: true,
      limit: 1024
    }
  }
);