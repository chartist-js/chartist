new Chartist.Candle('.ct-chart', {
  labels: ['22:48', '22:49', '22:50', '22:51', '22:52', '22:53', '22:54', '22:55', '22:56', '22:57', '22:58', '22:59'],
  series: [
    [240, 262, 220, 220],
    [220, 220, 209, 213],
    [213, 214, 211, 212],
    [212, 212, 209, 209],
    [209, 217, 207, 208],
    [208, 211, 207, 207],
    [207, 207, 202, 206],
    [206, 206, 206, 206],
    [206, 206, 206, 206],
    [208, 208, 208, 208],
    [211, 211, 211, 211],
    [208, 208, 208, 208]
  ]
}, {
  axisX: {
    labelOffset: {
      x: -14,
      y: 0
    }
  },
  axisY: {
    showGrid: false,
    labelInterpolationFnc: function (value) {
      // Let's add 12000 to this y-axis labels
      return value + 12000;
    }
  }
}).on('draw', function (data) {
  if (data.type === 'candle') {
    data.element.attr({
      style: 'stroke: black; stroke-width: 1px;'
    });
  }
});
