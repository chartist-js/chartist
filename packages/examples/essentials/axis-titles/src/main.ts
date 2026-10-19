import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import { lineChart } from 'chartist';
import { axisTitle } from '@chartist-js/essentials';

// Visits per day, with both axes named. Each title reserves its own room.
lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [[1200, 1450, 1380, 1620, 1500, 980, 860]]
  },
  {
    low: 0,
    layers: {
      above: [
        axisTitle({ axis: 'x', text: 'Day of the week' }),
        axisTitle({ axis: 'y', text: 'Visits' })
      ]
    }
  }
);
