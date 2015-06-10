new Chartist.Line('.ct-chart',
  {
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
    series: [
      {
        data: [
          1, 52, 85, 150, 189, 455, 589, 851, 1157, 1189, 1288, 1390, 1441
        ]
      }
    ]
    /*series: [
      {
        data: [
          null, null, null, null, null, null, null, null, 1157, 1189, 1288, 1390, 1441
        ]
      },
      {
        data: [
          null, null, null, null, 189, 455, 589, 851, 1157
        ]
      },
      {
        data: [
          1, 52, 85, 150, 189
        ]
      }
    ]*/
  },
  {
    allowVariableDataLengths: true,
    showPoint: true,
    lineSmooth: true,
    showLine: true,
    breakLine: {
      enabled: true,
      limit: [512, 1024],
      exactValueChange: true
    }
  }
);