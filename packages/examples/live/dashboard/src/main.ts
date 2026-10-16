import 'chartist/styles.css';
import './style.css';
import { barChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run shows the same numbers.
let seed = 7;
const next = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const labels = ['North', 'East', 'South', 'West'];
const random = () => labels.map(() => Math.round(next() * 9) + 1);

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
