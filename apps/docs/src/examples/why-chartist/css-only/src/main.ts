import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';

// Cups of coffee, Monday to Sunday. No colors or sizes in here.
lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [[3, 4, 2, 5, 6, 2, 1]]
  },
  { showArea: true }
);
