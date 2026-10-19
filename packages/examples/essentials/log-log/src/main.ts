import 'chartist/styles.css';
import {
  axisGrid,
  axisLabels,
  cartesianAxes,
  chart,
  line,
  trendLine
} from 'chartist';
import { logAxis } from '@chartist-js/essentials';

// Body mass (kg) and resting metabolic rate (W) from a mouse to an
// elephant. The rate grows with the mass to the power of about 3/4
// (Kleiber's law): on two log axes that's a straight line, and the trend
// line fitted to the logarithms finds it.
const animals = [
  { x: 0.02, y: 0.17, meta: 'Mouse' },
  { x: 0.3, y: 1.45, meta: 'Rat' },
  { x: 4, y: 9.1, meta: 'Cat' },
  { x: 30, y: 46, meta: 'Dog' },
  { x: 70, y: 80, meta: 'Human' },
  { x: 600, y: 395, meta: 'Horse' },
  { x: 4000, y: 1800, meta: 'Elephant' }
];

chart('#chart', {
  data: { series: [animals] },
  axes: cartesianAxes([
    { id: 'mass', side: 'bottom', type: logAxis({ minorTicks: true }) },
    { id: 'rate', side: 'left', type: logAxis({ minorTicks: true }) }
  ]),
  layers: [axisGrid(), trendLine(), line({ showLine: false }), axisLabels()],
  // Room for the last X label, which starts at its tick.
  padding: { right: 32 }
});
