import 'chartist/styles.css';
import './style.css';
import { domRenderer, lineChartConfig, toScene } from 'chartist';
import { renderToString } from 'chartist/server';

// The same code runs on a server: no DOM needed up to here.
const scene = toScene(
  lineChartConfig(
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3]
      ]
    },
    { viewBox: { width: 400, height: 250 } }
  ),
  { width: 400, height: 250 }
);

// On a server, the scene becomes SVG markup: a string for a response or
// a file.
const markup = renderToString(scene);

// In the browser, the DOM renderer draws the same scene without parsing
// markup, so the page needs no innerHTML (which a strict Content Security
// Policy can block). The string is shown as text below the chart.
const container = document.querySelector('#chart');
if (container) {
  domRenderer().render(scene, container);
}
const source = document.querySelector('#markup');
if (source) {
  source.textContent = markup;
}
