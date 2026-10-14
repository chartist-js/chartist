import 'chartist/styles.css';
import './style.css';
import { lineChart, node, type ChartPlugin } from 'chartist';

// Replaces every point with a triangle around the point's coordinates.
const triangles: ChartPlugin = {
  name: 'triangles',
  install(chart) {
    // Every element passes through `compose`; returning a node replaces it.
    chart.on('compose', element => {
      if (element.role !== 'point') {
        return;
      }
      const { x, y } = element.ctx as { x: number; y: number };
      // Its color comes from CSS (style.css), like every other element.
      return node(
        'path',
        { d: `M ${x} ${y - 15} L ${x - 15} ${y + 8} L ${x + 15} ${y + 8} z` },
        'ct-triangle'
      );
    });
  }
};

lineChart(
  '#chart',
  {
    labels: [1, 2, 3, 4, 5],
    series: [[12, 9, 7, 8, 5]]
  },
  { plugins: [triangles] }
);
