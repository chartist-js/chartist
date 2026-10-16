import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run records the same quakes.
let seed = 5;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// The last 150 readings of a seismometer, two more every 80 ms.
const READINGS = 150;
let time = 0;
let quake = 0;
const read = () => {
  time += 1;
  // Now and then a quake starts, then fades out.
  if (quake < 0.05 && random() < 0.01) {
    quake = 3 + random() * 5;
  }
  quake *= 0.96;
  const value = Math.sin(time * 0.9) * quake + (random() - 0.5) * 0.6;
  return { label: time, value: Math.round(value * 100) / 100 };
};
let readings = Array.from({ length: READINGS }, read);

const dataOf = () => ({
  labels: readings.map(reading => reading.label),
  series: [readings.map(reading => reading.value)]
});

const chart = lineChart('#chart', dataOf(), {
  // Readings are known by their time, so the trace scrolls.
  renderer: liveDomRenderer({ key: 'label', animations: smilAnimations() }),
  low: -8,
  high: 8,
  showPoint: false,
  lineSmooth: false,
  axisX: { showGrid: false, showLabel: false },
  axisY: { onlyInteger: true }
});

setInterval(() => {
  readings = [...readings.slice(2), read(), read()];
  chart.update({ data: dataOf() });
}, 80);
