resetChart()

var chart = new Chartist.Line('.ct-chart', {
labels: ['A', 'B', 'C', 'D', 'E'],
  series: [
    {
      name: 'line',
      data: [
        {value: 12, meta: {id: 1, title: "First point"}},
        {value: 9, meta: {id: 2, title: "Second point"}},
        {value: 7, meta: {id: 3, title: "Third point"}},
        {value: 9, meta: {id: 4, title: "Fourth point"}},
        {value:5, meta: {id: 5, title: "Fifth point"}}
      ]
    }
  ]}, {
    fullWidth: true,
    chartPadding: {
      right: 40
    },
    plugins: [
      Chartist.plugins.crosshairCursor({
        wrapperName: '.ct-golden-section',
        type: 'full', // 'x' 'y' or 'full'
        clickToFreeze: true, // true or false
        sendDataOn: 'hover' // 'hover' or 'click'
      })
    ]
  }
);

chart.on('crosshairCursor:frozen', function(isFrozen) {
  $('.crosshairCursor-frozenStatus').text("Frozen: " + isFrozen);
}, false);

chart.on('crosshairCursor:hovered', function(highlightedPoints) {
  $('.crosshairCursor-hoveredInfo').text("Highlighted points: " + JSON.stringify(highlightedPoints));
}, false);





// Create logging area below the chart for displaying available meta data

function createLoggingArea(id, text) {
  var container = document.createElement('div');
  container.className = "crosshairCursor-" + id;
  container.innerText = text;
  var chartWrapper = $('.crosshairCursor-wrapper');
  chartWrapper.after(container);
}

chart.on('created', function() {
  $('.crosshairCursor-hoveredInfo').remove()
  $('.crosshairCursor-frozenStatus').remove()
  createLoggingArea('hoveredInfo', "Highlighted points: []");
  createLoggingArea('frozenStatus', "Frozen: false");
})

function resetChart() {
  var ctChart = $('#example-plugin-crosshairCursor.edit-mode .ct-chart')
  ctChart.unwrap()
  $('#crosshairCursor-x').remove()
  $('#crosshairCursor-y').remove()
  $('.crosshairCursor-hoveredInfo').remove()
  $('.crosshairCursor-frozenStatus').remove()
}