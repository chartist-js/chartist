import 'chartist/styles.css';
import { barChart, trendLine } from 'chartist';

// Monthly sign-ups with the trend they follow.
barChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    series: [[42, 38, 51, 47, 58, 54, 66, 63]]
  },
  {
    low: 0,
    // Centered, so the line runs through the middle of the bars.
    layers: { above: [trendLine({ align: 'center' })] }
  }
);
