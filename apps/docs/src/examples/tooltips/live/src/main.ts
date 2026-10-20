import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import { lineChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { tooltips } from '@chartist-js/tooltips';

let visitors = [12, 15, 14, 18, 21, 19, 23, 22];

// Hover a point: the tooltip stays on it while the chart updates, and
// moves with the update animation.
const chart = lineChart(
  '#chart',
  { series: [{ name: 'Visitors', data: visitors }] },
  {
    low: 0,
    renderer: liveDomRenderer({ animations: smilAnimations() }),
    plugins: [tooltips()]
  }
);

setInterval(() => {
  const last = visitors[visitors.length - 1];
  const next = Math.max(0, last + Math.round(Math.random() * 8 - 4));
  visitors = [...visitors.slice(1), next];
  chart.update({ data: { series: [{ name: 'Visitors', data: visitors }] } });
}, 1500);
