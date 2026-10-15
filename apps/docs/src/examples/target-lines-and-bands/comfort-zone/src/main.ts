import 'chartist/styles.css';
import './style.css';
import { band, lineChart } from 'chartist';

// Room temperature every two hours, and the range it should stay in.
lineChart(
  '#chart',
  {
    labels: [
      '0h',
      '2h',
      '4h',
      '6h',
      '8h',
      '10h',
      '12h',
      '14h',
      '16h',
      '18h',
      '20h',
      '22h'
    ],
    series: [[18, 17.5, 17, 17, 19, 21, 22.5, 24.5, 25, 23, 21, 19.5]]
  },
  {
    low: 15,
    high: 27,
    layers: { below: [band({ low: 19, high: 24, mark: true })] }
  }
);
