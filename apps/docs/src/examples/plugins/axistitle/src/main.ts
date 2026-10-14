import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';

// Plugin scripts register on the global `Chartist`.
const { plugins } = Chartist;

lineChart(
  '#chart',
  {
    labels: [0, 15, 30, 45, 60, 75, 90],
    series: [[0, 1, 1, 2, 2, 3, 4]]
  },
  {
    // Room for the titles.
    chartPadding: { top: 20, right: 10, bottom: 30, left: 20 },
    axisY: { onlyInteger: true },
    plugins: [
      fromLegacyPlugin(
        plugins.ctAxisTitle({
          axisX: {
            axisTitle: 'Time (mins)',
            axisClass: 'ct-axis-title',
            offset: { x: 0, y: 50 },
            textAnchor: 'middle'
          },
          axisY: {
            axisTitle: 'Goals',
            axisClass: 'ct-axis-title',
            offset: { x: 0, y: -1 },
            flipTitle: false
          }
        })
      )
    ]
  }
);
