import 'chartist/styles.css';
import { barChart, getMultiValue, node, type ChartPlugin } from 'chartist';

// Adds a circle at the peak of every bar, its radius depending on the value.
const peakCircles: ChartPlugin = {
  name: 'peak-circles',
  install(chart) {
    // A series comes through `compose` after its bars, so we rebuild its
    // children with a circle after each bar.
    chart.on('compose', series => {
      if (series.role !== 'series') {
        return;
      }
      return series.children.reduce((result, child) => {
        const withChild = result.append(child);
        if (child.role !== 'bar') {
          return withChild;
        }
        // The circle sits at the bar peak's coordinates
        const { x2, y2 } = child.attrs as { x2: number; y2: number };
        return withChild.append(
          node(
            'circle',
            {
              cx: x2,
              cy: y2,
              r: Math.abs(Number(getMultiValue(child.ctx?.value))) * 2 + 5
            },
            'ct-slice-pie'
          )
        );
      }, series.empty());
    });
  }
};

// Create a simple bi-polar bar chart
barChart(
  '#chart',
  {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
    series: [[1, 2, 4, 8, 6, -2, -1, -4, -6, -2]]
  },
  {
    plugins: [peakCircles],
    high: 10,
    low: -10,
    axisX: {
      labelInterpolationFnc: (value, index) => (index % 2 === 0 ? value : null)
    }
  }
);
