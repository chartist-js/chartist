import 'chartist/styles.css';
import './style.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  bar,
  cartesianAxes,
  chart,
  stepAxis
} from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run shows the same numbers.
let seed = 21;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const sales = () => months.map(() => Math.round(2 + random() * 8));
const data = () => ({ labels: months, series: [sales(), sales(), sales()] });

// The same bars, grouped or stacked: only the layer's option differs.
const layers = (stackBars: boolean) => [
  axisGrid(),
  bar({ stackBars }),
  axisLabels()
];

let stacked = false;
const live = chart('#chart', {
  data: data(),
  axes: cartesianAxes([
    { id: 'months', side: 'bottom', type: stepAxis() },
    { id: 'sales', side: 'left', type: autoScaleAxis(), low: 0 }
  ]),
  layers: layers(stacked),
  renderer: liveDomRenderer({ animations: smilAnimations() })
});

// New numbers and the other layout, in one update: every bar moves from
// where it was to where it goes.
setInterval(() => {
  stacked = !stacked;
  live.update({ data: data(), layers: layers(stacked) });
}, 2500);
