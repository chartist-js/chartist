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

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

// Revenue as bars on the left axis, the margin as a line on the right axis.
chart('#chart', {
  data: {
    labels: quarters,
    series: [
      { name: 'revenue', data: [120, 150, 170, 210] },
      { name: 'margin', data: [12, 18, 15, 22] }
    ]
  },
  axes: cartesianAxes([
    { id: 'quarters', side: 'bottom', type: stepAxis() },
    { id: 'revenue', side: 'left', type: autoScaleAxis(), referenceValue: 0 },
    {
      id: 'margin',
      side: 'right',
      type: autoScaleAxis(),
      low: 0,
      onlyInteger: true,
      labelTransform: value => `${value}%`
    }
  ]),
  layers: [
    axisGrid({ axes: ['quarters', 'revenue'] }),
    bar({ series: ['revenue'], x: 'quarters', y: 'revenue' }),
    line({ series: ['margin'], x: 'quarters', y: 'margin', align: 'center' }),
    axisLabels()
  ]
});
