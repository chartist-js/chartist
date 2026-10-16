import 'chartist/styles.css';
import './style.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  cartesianAxes,
  chart,
  stepAxis
} from 'chartist';
import { lollipop } from './lollipop';

chart('#chart', {
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [{ name: 'visits', data: [12, 9, 14, 7, 11] }]
  },
  axes: cartesianAxes({
    x: { type: stepAxis() },
    y: { type: autoScaleAxis() }
  }),
  layers: [axisGrid(), lollipop(), axisLabels()]
});
