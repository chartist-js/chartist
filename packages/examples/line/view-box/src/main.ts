import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    series: [
      [12, 9, 7, 8, 5],
      [2, 1, 3.5, 7, 3],
      [1, 3, 4, 5, 6]
    ]
  },
  {
    fullWidth: true,
    chartPadding: {
      right: 40
    },
    viewBox: {
      width: 800,
      height: 400
    }
  },
  [
    [
      'screen and (max-width: 575px)',
      {
        viewBox: {
          width: 400,
          height: 300
        }
      }
    ]
  ]
);
