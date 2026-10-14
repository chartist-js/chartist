import 'chartist/styles.css';
import { BarChart } from 'chartist';
import { compat } from 'chartist/compat';

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
    // 1.x draw events come from the compat plugin in v2.
    plugins: [compat],
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
