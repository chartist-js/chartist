import 'chartist/styles.css';
import { barChart, type ChartPlugin } from 'chartist';

const values = [3, 6, 9, 12, 9, 6, 3, 6, 9, 12, 9, 6];
const min = Math.min(...values);
const max = Math.max(...values);

// Colors each bar by its value: red for low, green for high.
const heat: ChartPlugin = {
  name: 'heat',
  install(chart) {
    chart.on('compose', node => {
      if (node.role !== 'bar') {
        return;
      }
      const value = node.ctx?.value as { y?: number } | undefined;
      const share = ((value?.y ?? min) - min) / (max - min);
      const hue = Math.round(share * 120);
      return node.attr({ style: `stroke: hsl(${hue} 70% 45%)` });
    });
  }
};

barChart(
  '#chart',
  { series: [values] },
  { axisX: { showLabel: false }, plugins: [heat] }
);
