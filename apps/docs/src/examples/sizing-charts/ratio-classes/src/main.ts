import 'chartist/styles.css';
import { barChart } from 'chartist';

barChart('#chart', {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    [5, 4, 3, 7],
    [3, 2, 9, 5]
  ]
});
