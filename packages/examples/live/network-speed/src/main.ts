import 'chartist/styles.css';
import './style.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  bar,
  cartesianAxes,
  chart,
  line,
  stepAxis
} from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run measures the same speeds.
let seed = 11;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// The last 60 speed samples, four per second, and their running average.
const SAMPLES = 60;
let sample = 0;
let speed = 80;
const measure = () => {
  // Wanders around 80 Mbit/s, with a dip now and then.
  speed += (80 - speed) * 0.2 + (random() - 0.5) * 30;
  if (random() < 0.04) {
    speed *= 0.3;
  }
  sample += 1;
  return { label: sample, mbps: Math.max(1, Math.round(speed)) };
};
let samples = Array.from({ length: SAMPLES }, measure);

const dataOf = () => {
  const speeds = samples.map(s => s.mbps);
  const average = speeds.map((_, i) => {
    const recent = speeds.slice(Math.max(0, i - 7), i + 1);
    return recent.reduce((sum, value) => sum + value, 0) / recent.length;
  });
  return {
    labels: samples.map(s => s.label),
    series: [
      { name: 'speed', data: speeds },
      { name: 'average', data: average }
    ]
  };
};

// The bars are as wide as one sample, so they touch.
let step = 0;
const container = document.querySelector<HTMLElement>('#chart')!;

const live = chart(container, {
  data: dataOf(),
  axes: cartesianAxes([
    {
      id: 'time',
      side: 'bottom',
      type: stepAxis(),
      showGrid: false,
      showLabel: false
    },
    {
      id: 'mbps',
      side: 'left',
      type: autoScaleAxis(),
      low: 0,
      high: 140,
      labelTransform: value => `${value}`
    }
  ]),
  layers: [
    axisGrid({ axes: ['mbps'] }),
    bar({ series: ['speed'], x: 'time', y: 'mbps' }),
    line({
      series: ['average'],
      x: 'time',
      y: 'mbps',
      align: 'center',
      showPoint: false
    }),
    axisLabels()
  ],
  // Samples are known by their number, so they slide to the left.
  renderer: liveDomRenderer({ key: 'label', animations: smilAnimations() }),
  on: {
    layout: ({ area }) => void (step = area.width / SAMPLES),
    mount: () => container.style.setProperty('--ct-bar-width', `${step}px`)
  }
});

setInterval(() => {
  samples = [...samples.slice(1), measure()];
  live.update({ data: dataOf() });
}, 250);
