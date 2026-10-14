import 'chartist/styles.css';
import { lineChart, autoScaleAxis } from 'chartist';

lineChart(
  '#chart',
  {
    series: [
      [
        { x: 1, y: 100 },
        { x: 2, y: 50 },
        { x: 3, y: 25 },
        { x: 5, y: 12.5 },
        { x: 8, y: 6.25 }
      ]
    ]
  },
  {
    axisX: {
      type: autoScaleAxis(),
      onlyInteger: true
    }
  }
);
