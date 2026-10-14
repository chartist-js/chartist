import 'chartist/styles.css';
import { fixedScaleAxis, lineChart } from 'chartist';

// Temperature readings, taken whenever someone remembered to.
lineChart(
  '#chart',
  {
    series: [
      [
        { x: 1, y: 9 },
        { x: 4, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 11 },
        { x: 9, y: 13 },
        { x: 12, y: 18 },
        { x: 15, y: 21 },
        { x: 16, y: 20 },
        { x: 20, y: 15 },
        { x: 23, y: 11 }
      ]
    ]
  },
  {
    showLine: false,
    axisX: {
      type: fixedScaleAxis(),
      low: 0,
      high: 24,
      ticks: [0, 6, 12, 18, 24]
    }
  }
);
