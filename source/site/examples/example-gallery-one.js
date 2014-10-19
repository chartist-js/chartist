var data = {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'],
    series: [
    [12, 9, 7, 8, 6, 4, 3, 2, 0],
    [2, 1, 3.5, 7, 9, 8, 7.7, 4, 7],
    [1, 3, 4, 5, 6, 8, 9, 10, 11],
    [11, 7.5, 5.5, 5.5, 4, 3.5, 2, 1, 0]
  ]
};

var options = {
  axisX: {
    offset: 15
  },
  axisY: {
    offset: 15
  }
};

new Chartist.Line('.ct-chart', data, options);