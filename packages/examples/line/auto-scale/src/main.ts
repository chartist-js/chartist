import 'chartist/styles.css';
import { LineChart, AutoScaleAxis } from 'chartist';

new LineChart(
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
      type: AutoScaleAxis,
      onlyInteger: true
    },
    axisY: {
      type: AutoScaleAxis,
      onlyInteger: true
    }
  }
);
