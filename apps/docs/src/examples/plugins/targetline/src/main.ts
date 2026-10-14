import 'chartist/styles.css';
import './style.css';

const { lineChart, fromLegacyPlugin, plugins } = Chartist;

lineChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [[620, 780, 940, 1050, 990, 1210]]
  },
  {
    // The plugin places the line by the axis maximum, so start at zero.
    low: 0,
    plugins: [fromLegacyPlugin(plugins.ctTargetLine({ value: 1000 }))]
  }
);
