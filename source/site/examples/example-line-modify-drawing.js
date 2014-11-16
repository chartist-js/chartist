var chart = new Chartist.Line('.ct-chart', {
  labels: [1, 2, 3, 4, 5],
  series: [
    [12, 9, 7, 8, 5]
  ]
});

// Listening for draw events that get emitted by the Chartist chart
chart.on('draw', function(data) {
  // If the draw event was triggered from drawing a point on the line chart
  if(data.type === 'point') {
    // We are creating a new path SVG element that draws a triangle around the point coordinates
    var triangle = new Chartist.Svg('path', {
      d: ['M',
        data.x,
        data.y - 15,
        'L',
        data.x - 15,
        data.y + 8,
        'L',
        data.x + 15,
        data.y + 8,
        'z'].join(' '),
      style: 'fill-opacity: 1'
    }, 'ct-area');

    // With data.element we get the Chartist SVG wrapper and we can replace the original point drawn by Chartist with our newly created triangle
    data.element.replace(triangle);
  }
});
