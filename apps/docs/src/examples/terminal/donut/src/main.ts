import '@chartist-js/terminal/styles.css';
import './style.css';
import { pieChart } from '@chartist-js/terminal';

const art = document.querySelector('#art');
if (art) {
  art.replaceChildren(
    pieChart(
      { labels: ['Bananas', 'Apples', 'Kiwis'], series: [20, 10, 30] },
      { donut: true, columns: 34, rows: 16, format: 'element' }
    )
  );
}
