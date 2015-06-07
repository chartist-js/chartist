var data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
    [1, 2, 2.7, 0, 3, 5, 3, 4, 8, 10, 12, 7],
    [0, 1.2, 2, 7, 2.5, 9, 5, 8, 9, 11, 14, 4],
    [10, 9, 8, 6.5, 6.8, 6, 5.4, 5.3, 4.5, 4.4, 3, 2.8]
  ]
};

var responsiveOptions = [
  [
    Foundation.media_queries.small,
    {
      axisX: {
        labelInterpolationFnc: function (value, index) {
          // Interpolation function causes only every 2nd label to be displayed
          if (index % 2 !== 0) {
            return false;
          } else {
            return value;
          }
        }
      }
    }
  ]
];

new Chartist.Line('.ct-chart', data, {
  chartPadding: {
    top: 30
  }
}, responsiveOptions);
