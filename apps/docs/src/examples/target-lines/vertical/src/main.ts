import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import { barChart } from 'chartist';
import { targetLine } from '@chartist-js/essentials';

const minutes = [34, 52, 41, 27, 48];
const average = minutes.reduce((sum, value) => sum + value, 0) / minutes.length;

// Minutes per visit on horizontal bars: the values are on the X axis, so
// the average is a vertical line there.
barChart(
  '#chart',
  {
    labels: ['Home', 'Docs', 'Examples', 'Plugins', 'Playground'],
    series: [minutes]
  },
  {
    horizontalBars: true,
    reverseData: true,
    axisY: { offset: 80 },
    low: 0,
    layers: {
      above: [targetLine({ axis: 'x', value: average, label: 'Average' })]
    }
  }
);
