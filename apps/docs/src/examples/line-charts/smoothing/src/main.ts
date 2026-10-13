import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart(
  '#chart',
  {
    labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    series: [
      { name: 'smooth', data: [11, 15, 21, 23, 18, 14] },
      { name: 'straight', data: [6, 9, 14, 15, 11, 8] }
    ]
  },
  {
    series: {
      straight: { lineSmooth: false }
    }
  }
);
