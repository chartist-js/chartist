import 'chartist/styles.css';
import '@chartist-js/terminal/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { lineChart as textChart } from '@chartist-js/terminal';

const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
};
const options = { low: 0, showArea: true, lineSmooth: true };

// The SVG chart, as on every other page.
lineChart('#chart', data, options);

// The same data and options as text art: 44 columns, 14 rows, as HTML.
const art = document.querySelector('#art');
if (art) {
  art.innerHTML = textChart(data, {
    ...options,
    columns: 44,
    rows: 14,
    format: 'html'
  });
}
