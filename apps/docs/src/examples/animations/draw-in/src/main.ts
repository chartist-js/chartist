import 'chartist/styles.css';
import './style.css';
import { lineChart, type ChartPlugin } from 'chartist';

// pathLength="1" makes every line one unit long, whatever its real length.
// --i numbers the points, so CSS can stagger them.
const drawIn: ChartPlugin = {
  name: 'draw-in',
  install(chart) {
    chart.on('compose', node => {
      if (node.role === 'line') {
        return node.attr({ pathLength: 1 });
      }
      if (node.role === 'point') {
        return node.attr({ style: `--i: ${node.ctx.valueIndex}` });
      }
    });
  }
};

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      [12, 9, 7, 8, 5],
      [2, 1, 3.5, 7, 3]
    ]
  },
  { plugins: [drawIn] }
);
