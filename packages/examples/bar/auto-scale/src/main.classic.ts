import 'chartist/styles.css';
import { BarChart, AutoScaleAxis } from 'chartist';

new BarChart(
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
