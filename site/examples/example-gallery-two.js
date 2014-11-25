var data = {
  labels: ['1938', '1939', '1940', '1941', '1942', '1943'],
    series: [
    [12000, 9000, 7000, 8000, 12000, 10000],
    [2000, 1000, 3500, 7000, 5000, 9000]
  ]
};

var options = {
  seriesBarDistance: 5
};

new Chartist.Bar('.ct-chart', data, options);