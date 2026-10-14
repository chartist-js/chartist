import 'chartist/styles.css';
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
      return node(
        'path',
        {
          d: `M ${x} ${y - 15} L ${x - 15} ${y + 8} L ${x + 15} ${y + 8} z`,
          style: 'fill-opacity: 1'
        },
        'ct-area'
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
