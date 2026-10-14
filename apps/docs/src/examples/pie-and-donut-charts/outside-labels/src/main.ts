import 'chartist/styles.css';
import { pieChart } from 'chartist';

pieChart(
  '#chart',
  {
    labels: ['Agenda', 'Small talk', 'Decisions', 'Coffee'],
    series: [10, 25, 5, 20]
  },
  {
    labelPosition: 'outside',
    labelOffset: 16,
    labelDirection: 'explode',
    chartPadding: 30
  }
);
