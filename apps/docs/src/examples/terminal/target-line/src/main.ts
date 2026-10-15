import '@chartist-js/terminal/styles.css';
import './style.css';
import { targetLine } from 'chartist';
import { lineChart } from '@chartist-js/terminal';
import { reached } from './reached';

// The same layer and plugin work on lineChart() from chartist, in SVG.
const art = document.querySelector('#art');
if (art) {
  art.innerHTML = lineChart(
    {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [[620, 780, 940, 1050, 990, 1210]]
    },
    {
      low: 0,
      layers: {
        above: [
          targetLine({ value: 1000, label: 'target', labelPosition: 'start' })
        ]
      },
      plugins: [reached(1000)],
      columns: 34,
      rows: 16,
      format: 'html'
    }
  );
}
