import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
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
import { axisTitle } from '@chartist-js/essentials';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Revenue in EUR as bars on the left axis, ad spend in USD as a line on the
// right one, and a title for each axis, by its id.
chart('#chart', {
  data: {
    labels: months,
    series: [
      { name: 'revenue', data: [42, 48, 51, 47, 58, 63] },
      { name: 'ads', data: [6.2, 7.1, 6.8, 5.9, 8.4, 9.0] }
    ]
  },
  axes: cartesianAxes([
    { id: 'month', side: 'bottom', type: stepAxis() },
    {
      id: 'eur',
      side: 'left',
      type: autoScaleAxis(),
      referenceValue: 0,
      labelTransform: value => `${value}k`
    },
    {
      id: 'usd',
      side: 'right',
      type: autoScaleAxis(),
      low: 0,
      labelTransform: value => `${value}k`
    }
  ]),
  layers: [
    axisGrid({ axes: ['month', 'eur'] }),
    bar({ series: ['revenue'], x: 'month', y: 'eur' }),
    line({ series: ['ads'], x: 'month', y: 'usd', align: 'center' }),
    axisLabels(),
    axisTitle({ axis: 'month', text: '2026', align: 'end' }),
    axisTitle({ axis: 'eur', text: 'Revenue (EUR)' }),
    // Turned to read from top to bottom, toward the chart.
    axisTitle({ axis: 'usd', text: 'Ad spend (USD)', flip: true })
  ]
});
