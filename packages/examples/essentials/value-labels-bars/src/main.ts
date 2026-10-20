import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import './style.css';
import { barChart } from 'chartist';
import { valueLabels } from '@chartist-js/essentials';

// Profit per quarter in thousands: labels past the end of each bar, below
// it for a loss. `high` leaves room above the highest bar for its label.
barChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'],
    series: [[12, -4, 8, 15, -2, 9]]
  },
  {
    high: 18,
    layers: {
      above: [
        valueLabels({
          locale: 'en-US',
          numberFormat: { signDisplay: 'exceptZero' }
        })
      ]
    }
  }
);
