import 'chartist/styles.css';
import { autoScaleAxis, barChart } from 'chartist';

barChart(
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
