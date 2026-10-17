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

// The bar-and-line example with SVG text labels, which also work where
// foreignObject doesn't (image converters, PDF, email).
chart('#chart', {
  data: {
    labels: quarters,
    series: [
      // Salmon bars and a red line.
      { name: 'revenue', className: 'ct-series-b', data: [120, 150, 170, 210] },
      { name: 'margin', className: 'ct-series-a', data: [12, 18, 15, 22] }
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
  labels: 'svg',
  layers: [
    axisGrid({ axes: ['quarters', 'revenue'] }),
    bar({ series: ['revenue'], x: 'quarters', y: 'revenue' }),
    line({ series: ['margin'], x: 'quarters', y: 'margin', align: 'center' }),
    axisLabels()
  ]
});
