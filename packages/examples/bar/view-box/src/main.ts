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
    },
    viewBox: {
      width: 800,
      height: 300
    }
  },
  [
    [
      'screen and (max-width: 575px)',
      {
        viewBox: {
          width: 400,
          height: 150
        }
      }
    ]
  ]
);
