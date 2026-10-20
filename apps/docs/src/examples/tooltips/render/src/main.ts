import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [{ name: 'Visitors', data: [1200, 1500, 1350, 1600, 1100] }]
  },
  {
    low: 0,
    plugins: [
      tooltips({
        // Your own markup: the value, and the change since the day before,
        // read from the chart's data.
        render(content, item, data) {
          const values = data.series[item.seriesIndex ?? 0].values as number[];
          const value = Number(item.value);
          const before = values[(item.valueIndex ?? 0) - 1];
          const title = document.createElement('strong');
          title.textContent = `${item.label}: ${value} visitors`;
          content.append(title);
          if (before !== undefined) {
            const change = Math.round(((value - before) / before) * 100);
            const trend = document.createElement('span');
            trend.className = change < 0 ? 'down' : 'up';
            trend.textContent = `${change < 0 ? '' : '+'}${change}% since ${
              data.labels[(item.valueIndex ?? 0) - 1]
            }`;
            content.append(trend);
          }
        }
      })
    ]
  }
);
