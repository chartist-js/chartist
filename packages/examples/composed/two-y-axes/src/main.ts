import 'chartist/styles.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  cartesianAxes,
  chart,
  line,
  stepAxis
} from 'chartist';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Two quantities with different units, each on its own Y axis.
chart('#chart', {
  data: {
    labels: months,
    series: [
      { name: 'temperature', data: [2, 4, 9, 14, 18, 22] },
      { name: 'rain', data: [64, 52, 58, 46, 72, 81] }
    ]
  },
  axes: cartesianAxes([
    { id: 'months', side: 'bottom', type: stepAxis(), ticks: months },
    {
      id: 'temperature',
      side: 'left',
      type: autoScaleAxis(),
      labelInterpolationFnc: value => `${value} °C`,
      offset: 60
    },
    {
      id: 'rain',
      side: 'right',
      type: autoScaleAxis(),
      low: 0,
      labelInterpolationFnc: value => `${value} mm`,
      offset: 60
    }
  ]),
  layers: [
    axisGrid({ axes: ['months', 'temperature'] }),
    line({ series: ['temperature'], x: 'months', y: 'temperature' }),
    line({
      series: ['rain'],
      x: 'months',
      y: 'rain',
      showArea: true,
      showPoint: false
    }),
    axisLabels()
  ]
});
