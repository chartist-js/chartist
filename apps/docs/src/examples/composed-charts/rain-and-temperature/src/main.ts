import 'chartist/styles.css';
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

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

chart('#chart', {
  data: {
    labels: months,
    series: [
      { name: 'rain', data: [64, 58, 70, 82, 104, 120] },
      // A palette color that stands apart from the bars.
      {
        name: 'temperature',
        className: 'ct-series-e',
        data: [1, 3, 8, 12, 16, 20]
      }
    ]
  },
  axes: cartesianAxes([
    { id: 'month', side: 'bottom', type: stepAxis() },
    { id: 'mm', side: 'left', type: autoScaleAxis(), low: 0 },
    { id: 'celsius', side: 'right', type: autoScaleAxis(), low: 0 }
  ]),
  layers: [
    axisGrid({ axes: ['month', 'mm'] }),
    bar({ series: ['rain'], x: 'month', y: 'mm' }),
    line({
      series: ['temperature'],
      x: 'month',
      y: 'celsius',
      align: 'center'
    }),
    axisLabels()
  ]
});
