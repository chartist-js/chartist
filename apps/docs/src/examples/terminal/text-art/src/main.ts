import '@chartist-js/terminal/styles.css';
import './style.css';
import { lineChart } from '@chartist-js/terminal';

const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
};

// The options of Chartist's lineChart(), plus a size in characters, as an
// element of text art instead of terminal escape codes.
const art = document.querySelector('#art');
if (art) {
  art.replaceChildren(
    lineChart(data, {
      low: 0,
      showArea: true,
      lineSmooth: true,
      columns: 34,
      rows: 16,
      format: 'element'
    })
  );
}
