import '@chartist-js/terminal/styles.css';
import './style.css';
import { lineChart } from '@chartist-js/terminal';
import { targetLine } from './target-line';

// The same plugin works on lineChart() from chartist, in SVG.
const art = document.querySelector('#art');
if (art) {
  art.innerHTML = lineChart(
    {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [[620, 780, 940, 1050, 990, 1210]]
    },
    {
      low: 0,
      plugins: [targetLine(1000)],
      columns: 34,
      rows: 16,
      format: 'html'
    }
  );
}
