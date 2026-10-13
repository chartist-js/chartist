import 'chartist/styles.css';
import { barChart } from 'chartist';

// The same chart as the HTML-label example, with SVG text labels.
barChart(
  '#chart',
  {
    labels: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ],
    series: [
      [5, 4, 3, 7, 5, 10, 3],
      [3, 2, 9, 5, 4, 6, 4]
    ]
  },
  {
    labels: 'svg',
    seriesBarDistance: 10,
    reverseData: true,
    horizontalBars: true,
    axisY: {
      offset: 70
    }
  }
);
