import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    labels: [
      'Big Slice',
      11231231,
      'Test the string',
      new Date(2014, 8, 26),
      124124124
    ],
    series: [96, 1, 1, 1, 1]
  },
  {
    preventOverlappingLabelOffset: 12
  }
);
