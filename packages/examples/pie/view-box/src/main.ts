import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    series: [5, 3, 4]
  },
  {
    chartPadding: 10,
    viewBox: {
      width: 350,
      height: 350
    }
  },
  [
    [
      'screen and (max-width: 575px)',
      {
        viewBox: {
          width: 250,
          height: 250
        }
      }
    ]
  ]
);
