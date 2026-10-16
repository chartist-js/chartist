import 'chartist/styles.css';
import './style.css';
import { pieChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run shows the same load.
let seed = 9;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// The CPU load in percent, and the rest of the scale as a track, on a half
// ring: a total of 200 leaves the lower half empty.
let load = 35;
const series = () => [load, 100 - load];

const chart = pieChart(
  '#chart',
  { series: series() },
  {
    renderer: liveDomRenderer({ animations: smilAnimations() }),
    donut: true,
    donutWidth: 40,
    startAngle: 270,
    total: 200,
    showLabel: false
  }
);

setInterval(() => {
  load = Math.round(Math.min(95, Math.max(5, load + (random() - 0.5) * 50)));
  chart.update({ data: { series: series() } });
}, 1200);
