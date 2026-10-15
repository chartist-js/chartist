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
    layers: {
      above: [
        targetLine({
          lines: [
            { value: 1000, label: 'Goal' },
            { value: 800, label: 'Minimum', className: 'ct-series-b' }
          ]
        })
      ]
    }
  }
);
