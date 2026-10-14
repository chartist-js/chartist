import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    labels: ['Agenda', 'Small talk', 'Decisions', 'Coffee'],
    series: [10, 25, 5, 20]
  },
  {
    donut: true,
    donutWidth: 40
  }
);
