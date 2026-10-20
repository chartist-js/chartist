import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import './style.css';
import { barChart } from 'chartist';
import { valueLabels } from '@chartist-js/essentials';

// Hours per work order on three machines, stacked: each segment says
// which order it is, from the value's meta.
const order = (value: number, meta: string) => ({ value, meta });

barChart(
  '#chart',
  {
    labels: ['Press', 'Lathe', 'Mill'],
    series: [
      [order(14, 'WO 4182'), order(9, 'WO 4190'), order(11, 'WO 4201')],
      [order(8, 'WO 4185'), order(12, 'WO 4193'), order(6, 'WO 4204')],
      [order(5, 'WO 4187'), order(7, 'WO 4198'), order(10, 'WO 4207')]
    ]
  },
  {
    horizontalBars: true,
    stackBars: true,
    axisY: { offset: 60 },
    layers: {
      above: [
        valueLabels({
          format: item => `${String(item.meta)}\n${String(item.value)} h`
        })
      ]
    }
  }
);
