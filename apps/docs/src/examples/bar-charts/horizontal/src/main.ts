import 'chartist/styles.css';
import { barChart } from 'chartist';

barChart(
  '#chart',
  {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    series: [
      [5, 4, 3, 7, 5],
      [3, 2, 9, 5, 4]
    ]
  },
  {
    horizontalBars: true,
    // The labels are on the Y axis now: give them room.
    axisY: { offset: 70 }
  }
);
