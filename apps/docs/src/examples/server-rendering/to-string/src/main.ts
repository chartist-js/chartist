import 'chartist/styles.css';
import './style.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  cartesianAxes,
  line,
  renderToString,
  stepAxis,
  toScene
} from 'chartist';

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// The same code runs on a server: no DOM needed up to here.
const scene = toScene(
  {
    data: {
      labels,
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3]
      ]
    },
    axes: cartesianAxes([
      { id: 'x', side: 'bottom', type: stepAxis(), ticks: labels },
      { id: 'y', side: 'left', type: autoScaleAxis() }
    ]),
    layers: [axisGrid(), line(), axisLabels()],
    className: 'ct-chart-line',
    viewBox: { width: 400, height: 250 }
  },
  { width: 400, height: 250 }
);
const svg = renderToString(scene);

// In the browser, the string goes into the page like any other markup.
const container = document.querySelector('#chart');
if (container) {
  container.innerHTML = svg;
}
