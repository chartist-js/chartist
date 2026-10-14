import 'chartist/styles.css';
import { barChart, type ChartPlugin } from 'chartist';

// Draws every bar 30px wide.
const wideBars: ChartPlugin = {
  name: 'wide-bars',
  install(chart) {
    chart.on('compose', element => {
      if (element.role !== 'bar') {
        return;
      }
      return element.attr({
        style: 'stroke-width: 30px'
      });
    });
  }
};

barChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      [800000, 1200000, 1400000, 1300000],
      [200000, 400000, 500000, 300000],
      [100000, 200000, 400000, 600000]
    ]
  },
  {
    plugins: [wideBars],
    stackBars: true,
    axisY: {
      labelInterpolationFnc: value => +value / 1000 + 'k'
    }
  }
);
