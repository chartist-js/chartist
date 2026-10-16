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
import { salesData } from './sales';

// The same bars, grouped or stacked: only the layer's option differs.
const layers = (stackBars: boolean) => [
  axisGrid(),
  bar({ stackBars }),
  axisLabels()
];

let stacked = false;
const live = chart('#chart', {
  data: salesData(),
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
  live.update({ data: salesData(), layers: layers(stacked) });
}, 2500);
