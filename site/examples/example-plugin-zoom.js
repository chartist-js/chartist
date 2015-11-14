var data = {
  series: [[
    { x: 1, y: 100 },
    { x: 2, y: 50 },
    { x: 3, y: 25 },
    { x: 4, y: 66 },
    { x: 5, y: 30 },
    { x: 6, y: 22 }
  ]]
};

var options = {
  axisX: {
    type: Chartist.AutoScaleAxis
  },
  axisY: {
    type: Chartist.AutoScaleAxis
  },
  plugins: [
    Chartist.plugins.zoom({ onZoom: onZoom })
  ]
};

var chart = Chartist.Line('.ct-chart', data, options);
var resetFnc;
function onZoom(chart, reset) {
  resetFnc = reset;
}

var btn = document.createElement('button');
btn.id = 'reset-zoom-btn';
btn.innerHTML = 'Reset Zoom';
btn.style.float = 'right';
btn.addEventListener('click', function() {
  console.log(resetFnc);
  resetFnc && resetFnc();
});
var parent = document.querySelector('#example-plugin-zoom .chart');
!parent.querySelector('#reset-zoom-btn') && parent.appendChild(btn);
