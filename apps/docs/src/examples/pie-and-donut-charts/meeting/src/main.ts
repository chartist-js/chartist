import 'chartist/styles.css';
import { pieChart } from 'chartist';

// Where the minutes of a one-hour meeting go.
pieChart('#chart', {
  labels: ['Agenda', 'Small talk', 'Decisions', 'Coffee'],
  series: [10, 25, 5, 20]
});
