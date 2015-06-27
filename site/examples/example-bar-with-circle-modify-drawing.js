// Create a simple bi-polar bar chart
var chart = new Chartist.Bar('.ct-chart', {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
  series: [
    [1, 2, 4, 8, 6, -2, -1, -4, -6, -2]
  ]
}, {
  high: 10,
  low: -10,
  axisX: {
    labelInterpolationFnc: function(value, index) {
      return index % 2 === 0 ? value : null;
    }
  }
});

// Listen for draw events on the bar chart
chart.on('draw', function(data) {
  // If this draw event is of type bar we can use the data to create additional content
  if(data.type === 'bar') {
    // We use the group element of the current series to append a simple circle with the bar peek coordinates and a circle radius that is depending on the value
    data.group.append(new Chartist.Svg('circle', {
      cx: data.x2,
      cy: data.y2,
      r: Math.abs(Chartist.getMultiValue(data.value)) * 2 + 5
    }, 'ct-slice-pie'));
  }
});
