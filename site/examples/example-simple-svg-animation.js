var chart = new Chartist.Line('.ct-chart', {
  labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  series: [
    [12, 4, 2, 8, 5, 4, 6, 2, 3, 3, 4, 6],
    [4, 8, 9, 3, 7, 2, 10, 5, 8, 1, 7, 10]
  ]
}, {
  low: 0,
  showLine: false,
  axisX: {
    showLabel: false,
    offset: 0
  },
  axisY: {
    showLabel: false,
    offset: 0
  }
});

// Let's put a sequence number aside so we can use it in the event callbacks
var seq = 0;

// Once the chart is fully created we reset the sequence
chart.on('created', function() {
  seq = 0;
});

// On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
chart.on('draw', function(data) {
  if(data.type === 'point') {
    // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
    data.element.animate({
      opacity: {
        // The delay when we like to start the animation
        begin: seq++ * 80,
        // Duration of the animation
        dur: 500,
        // The value where the animation should start
        from: 0,
        // The value where it should end
        to: 1
      },
      x1: {
        begin: seq++ * 80,
        dur: 500,
        from: data.x - 100,
        to: data.x,
        // You can specify an easing function name or use easing functions from Chartist.Svg.Easing directly
        easing: Chartist.Svg.Easing.easeOutQuart
      }
    });
  }
});

// For the sake of the example we update the chart every time it's created with a delay of 8 seconds
chart.on('created', function() {
  if(window.__exampleAnimateTimeout) {
    clearTimeout(window.__exampleAnimateTimeout);
    window.__exampleAnimateTimeout = null;
  }
  window.__exampleAnimateTimeout = setTimeout(chart.update.bind(chart), 8000);
});

