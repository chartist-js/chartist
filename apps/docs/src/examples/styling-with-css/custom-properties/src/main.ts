import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';

lineChart('#chart', {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
});
