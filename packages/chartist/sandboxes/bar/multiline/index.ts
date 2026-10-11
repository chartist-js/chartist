import 'chartist/dist/index.css';
import { BarChart } from 'chartist';

new BarChart(
  '#chart',
  {
    labels: [
      'First quarter of the year',
      'Second quarter of the year',
      'Third quarter of the year',
      'Fourth quarter of the year'
    ],
    series: [
      [60000, 40000, 80000, 70000],
      [40000, 30000, 70000, 65000],
      [8000, 3000, 10000, 6000]
    ]
  },
  {
    seriesBarDistance: 10,
    axisX: {
      offset: 60
    },
    axisY: {
      offset: 80,
      labelInterpolationFnc: value => value + ' CHF',
      scaleMinSpace: 15
    }
  }
);
