import '@chartist-js/terminal/styles.css';
import './style.css';
import { Interpolation } from 'chartist';
import { lineChart } from '@chartist-js/terminal';

const art = document.querySelector('#art');
if (art) {
  art.replaceChildren(
    lineChart(
      {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [
          [3, 5, 2, 6, 4],
          [1, 2, 1, 3, 2]
        ]
      },
      {
        // Options of Chartist's lineChart(): a step for each value.
        lineSmooth: Interpolation.step(),
        showArea: true,
        showPoint: false,
        low: 0,
        axisY: { onlyInteger: true },
        columns: 34,
        rows: 16,
        format: 'element'
      }
    )
  );
}
