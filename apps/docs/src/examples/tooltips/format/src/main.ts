import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import { barChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

const orders = new Intl.NumberFormat('en-US');

barChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [{ name: 'Orders', data: [1830, 2410, 0, 2950] }]
  },
  {
    plugins: [
      tooltips({
        // Text with a line break; no tooltip for a quarter without orders.
        format: item =>
          item.value === 0
            ? null
            : `${item.label}\n${orders.format(Number(item.value))} orders`
      })
    ]
  }
);
