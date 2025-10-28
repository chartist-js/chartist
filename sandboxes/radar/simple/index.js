import { RadarChart } from '/dist/index.js';

new RadarChart(
  '#chart',
  {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    series: [
      [12, 9, 7, 8, 5],
      [2, 1, 3.5, 7, 3],
      [1, 3, 4, 5, 6]
    ]
  },
  {
    fullWidth: true,
    chartPadding: {
      right: 40
    }
  }
);
