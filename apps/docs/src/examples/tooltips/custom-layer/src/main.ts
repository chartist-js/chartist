import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import './style.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  cartesianAxes,
  chart,
  stepAxis
} from 'chartist';
import { tooltips } from '@chartist-js/tooltips';
import { lollipop } from './lollipop';

// The lollipop layer gives its dots a role of its own. Listed in `roles`,
// they get tooltips. Their context follows Chartist's conventions
// (seriesIndex, valueIndex, value), so the default text knows what to show.
chart('#chart', {
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [{ name: 'Visits', data: [12, 9, 14, 7, 11] }]
  },
  axes: cartesianAxes({
    x: { type: stepAxis() },
    y: { type: autoScaleAxis() }
  }),
  layers: [axisGrid(), lollipop(), axisLabels()],
  plugins: [tooltips({ roles: ['lollipop'] })]
});
