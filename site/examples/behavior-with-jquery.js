new Chartist.Line('.ct-chart', {
  labels: ['1', '2', '3', '4', '5', '6'],
  series: [
    {
      name: 'Fibonacci sequence',
      data: [1, 2, 3, 5, 8, 13]
    },
    {
      name: 'Golden section',
      data: [1, 1.618, 2.618, 4.236, 6.854, 11.09]
    }
  ]
});

var easeOutQuad = function (x, t, b, c, d) {
  return -c * (t /= d) * (t - 2) + b;
};

var $chart = $('.ct-chart');

var $toolTip = $chart
  .append('<div class="tooltip"></div>')
  .find('.tooltip')
  .hide();

$chart.on('mouseenter', '.ct-point', function() {
  var $point = $(this),
    value = $point.attr('ct:value'),
    seriesName = $point.parent().attr('ct:series-name');

  $point.animate({'stroke-width': '50px'}, 300, easeOutQuad);
  $toolTip.html(seriesName + '<br>' + value).show();
});

$chart.on('mouseleave', '.ct-point', function() {
  var $point = $(this);

  $point.animate({'stroke-width': '20px'}, 300, easeOutQuad);
  $toolTip.hide();
});

$chart.on('mousemove', function(event) {
  $toolTip.css({
    left: (event.offsetX || event.originalEvent.layerX) - $toolTip.width() / 2 - 10,
    top: (event.offsetY || event.originalEvent.layerY) - $toolTip.height() - 40
  });
});
