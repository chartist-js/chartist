import 'chartist/styles.css';
import { pieChart } from 'chartist';

// Story points of a sprint: done, in progress, to do. The total is
// twice their sum, so together they fill half the circle.
pieChart(
  '#chart',
  { series: [12, 5, 3] },
  {
    donut: true,
    donutWidth: 40,
    startAngle: 270,
    total: 40,
    showLabel: false
  }
);
