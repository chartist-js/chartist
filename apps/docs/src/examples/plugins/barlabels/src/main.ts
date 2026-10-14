import 'chartist/styles.css';
import { barChart } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';

// Plugin scripts register on the global `Chartist`.
const { plugins } = Chartist;

barChart(
  '#chart',
  {
    labels: ['Apples', 'Pears', 'Plums', 'Cherries'],
    series: [[42, 28, 35, 51]]
  },
  {
    chartPadding: { top: 25 },
    plugins: [fromLegacyPlugin(plugins.ctBarLabels())]
  }
);
