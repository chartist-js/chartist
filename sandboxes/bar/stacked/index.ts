import 'chartist/dist/index.css';
import { BarChart } from 'chartist';

new BarChart(
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
    stackBars: true,
    axisY: {
      labelInterpolationFnc: value => +value / 1000 + 'k'
    }
  }
).on('draw', data => {
  if (data.type === 'bar') {
    data.element.attr({
      style: 'stroke-width: 30px'
    });
  }
});
