import 'chartist/styles.css';
import { barChart } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';
import ChartistPluginTooltip from '@stklcode/chartist-plugin-tooltips';

barChart(
  '#chart',
  {
    labels: ['North', 'East', 'South', 'West'],
    series: [
      [
        { meta: 'North', value: 320 },
        { meta: 'East', value: 450 },
        { meta: 'South', value: 280 },
        { meta: 'West', value: 390 }
      ]
    ]
  },
  {
    plugins: [
      fromLegacyPlugin(ChartistPluginTooltip, {
        transformTooltipTextFnc: (value: string) => `${value} visitors`
      })
    ]
  }
);
