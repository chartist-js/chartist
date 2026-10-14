import 'chartist/styles.css';
import { lineChart, autoScaleAxis } from 'chartist';

lineChart(
  '#chart',
  {
    series: [
      [
        { x: 1, y: 1 },
        { x: 3, y: 5 }
      ]
    ]
  },
  {
    axisX: {
      type: autoScaleAxis(),
      onlyInteger: true
    },
    axisY: {
      type: autoScaleAxis(),
      onlyInteger: true
    }
  }
);
