import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';

// Plugin scripts register on the global `Chartist`.
const { plugins } = Chartist;

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [[2, 5, 3, 7, 4, 8, 6]]
  },
  {
    showArea: true,
    plugins: [fromLegacyPlugin(plugins.ctThreshold({ threshold: 4 }))]
  }
);
