new Chartist.Line('.ct-chart',
  {
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
    series: [
      {
        data: [
          1, 52, 85, 150, 223, 351, 589, 714, 981, 1189, 1288, 1390, 1441
        ]
      }
    ]
  },
  {
    allowVariableDataLengths: true,
    showPoint: true,
    lineSmooth: false,
    showLine: true,
    breakLine: {
      enabled: true,
      limit: [500, 900],
      //limit: 500,
      exactValueMode: true
    }
  }
);