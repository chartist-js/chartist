import 'chartist/styles.css';
import './style.css';
import { barChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

const labels = ['North', 'East', 'South', 'West'];
const random = () => labels.map(() => Math.round(Math.random() * 9) + 1);

const chart = barChart(
  '#chart',
  {
    labels,
    series: [
      [5, 4, 3, 7],
      [3, 2, 9, 5]
    ]
  },
  // How long the animations take is up to style.css.
  { renderer: liveDomRenderer({ animations: smilAnimations() }) }
);

// New numbers every two seconds.
setInterval(() => {
  chart.update({ data: { labels, series: [random(), random()] } });
}, 2000);
