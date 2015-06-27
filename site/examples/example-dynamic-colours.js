var count = 45;
var max = 100;

// Creating a bar chart with no labels and a series array with one series. For the series we generate random data with `count` elements and random data ranging from 0 to `max`.
var chart = new Chartist.Bar('.ct-chart', {
  labels: Chartist.times(count),
  series: [
    Chartist.times(count).map(Math.random).map(Chartist.mapMultiply(max))
  ]
}, {
  axisX: {
    showLabel: false
  },
  axisY: {
    onlyInteger: true
  }
});

// This is the bit we are actually interested in. By registering a callback for `draw` events, we can actually intercept the drawing process of each element on the chart.
chart.on('draw', function(context) {
  // First we want to make sure that only do something when the draw event is for bars. Draw events do get fired for labels and grids too.
  if(context.type === 'bar') {
    // With the Chartist.Svg API we can easily set an attribute on our bar that just got drawn
    context.element.attr({
      // Now we set the style attribute on our bar to override the default color of the bar. By using a HSL colour we can easily set the hue of the colour dynamically while keeping the same saturation and lightness. From the context we can also get the current value of the bar. We use that value to calculate a hue between 0 and 100 degree. This will make our bars appear green when close to the maximum and red when close to zero.
      style: 'stroke: hsl(' + Math.floor(Chartist.getMultiValue(context.value) / max * 100) + ', 50%, 50%);'
    });
  }
});
