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
import { SAMPLES, firstSamples, onSample } from './samples';

// The bars are as wide as one sample, so they touch.
let step = 0;
const container = document.querySelector<HTMLElement>('#chart')!;

const live = chart(container, {
  data: firstSamples,
  axes: cartesianAxes([
    {
      id: 'time',
      side: 'bottom',
      type: stepAxis(),
      showGrid: false,
      showLabel: false
    },
    { id: 'mbps', side: 'left', type: autoScaleAxis(), low: 0, high: 140 }
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

onSample(data => live.update({ data }));
