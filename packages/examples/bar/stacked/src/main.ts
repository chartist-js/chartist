import 'chartist/styles.css';
import './style.css';
import { barChart } from 'chartist';

barChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      [800000, 1200000, 1400000, 1300000],
      [200000, 400000, 500000, 300000],
      [100000, 200000, 400000, 600000]
    ]
  },
  {
    stackBars: true,
    axisY: {
      labelTransform: value => +value / 1000 + 'k'
    }
  }
);
