import 'chartist/styles.css';
import { LineChart, easings } from 'chartist';
import { compat } from 'chartist/compat';

const chart = new LineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    series: [
      [1, 5, 2, 5, 4, 3],
      [2, 3, 4, 8, 1, 2],
      [5, 4, 3, 2, 1, 0.5]
    ]
  },
  {
    // 1.x draw events come from the compat plugin in v2.
    plugins: [compat],
    low: 0,
    showArea: true,
    showPoint: false,
    fullWidth: true
  }
);

chart.on('draw', data => {
  if (data.type === 'line' || data.type === 'area') {
    data.element.animate({
      d: {
        begin: 2000 * data.index,
        dur: 2000,
        from: data.path
          .clone()
          .scale(1, 0)
          .translate(0, data.chartRect.height())
          .stringify(),
        to: data.path.clone().stringify(),
        easing: easings.easeOutQuint
      }
    });
  }
});
