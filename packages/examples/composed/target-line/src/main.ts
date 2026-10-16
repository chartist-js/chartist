import 'chartist/styles.css';
import { barChart, targetLine } from 'chartist';

// Monthly sales against a goal and a minimum, on the bar chart preset.
barChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [[820, 950, 1100, 760, 1240, 780]]
  },
  {
    low: 0,
    // One layer per line.
    layers: {
      above: [
        targetLine({ value: 1000, label: 'Goal' }),
        targetLine({ value: 800, label: 'Minimum', className: 'ct-series-b' })
      ]
    }
  }
);
