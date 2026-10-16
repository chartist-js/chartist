import 'chartist/styles.css';
import { barChart, type ChartPlugin } from 'chartist';

const values = [3, 6, 9, 12, 9, 6, 3, 6, 9, 12, 9, 6];
const min = Math.min(...values);
const max = Math.max(...values);

// Colors each bar by its value: mustard yellow for low, red for high.
const heat: ChartPlugin = {
  name: 'heat',
  install(chart) {
    chart.on('compose', node => {
      if (node.role !== 'bar') {
        return;
      }
      // Bar values are { x, y } (or a hole).
      const { value } = node.ctx;
      const y =
        value && typeof value === 'object' && 'y' in value ? value.y : min;
      const share = (y - min) / (max - min);
      const red = Math.round(share * 100);
      return node.attr({
        style: `stroke: color-mix(in oklab, #c8102e ${red}%, #f4c63d)`
      });
    });
  }
};

barChart(
  '#chart',
  { series: [values] },
  { axisX: { showLabel: false }, plugins: [heat] }
);
