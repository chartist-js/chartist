// Experimental: container() conditions need Element.matchContainer(), which
// browsers don't ship yet. The polyfill provides it.
import 'match-container';
import 'chartist/styles.css';
import './style.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  bar,
  cartesianAxes,
  chart,
  container,
  line,
  responsive,
  stepAxis
} from 'chartist';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const quarterAxis = {
  id: 'quarters',
  side: 'bottom',
  type: stepAxis(),
  ticks: quarters
} as const;
const revenueAxis = {
  id: 'revenue',
  side: 'left',
  type: autoScaleAxis(),
  referenceValue: 0
} as const;
const revenueBars = bar({ series: ['revenue'], x: 'quarters', y: 'revenue' });

// One config for both cells. By the size of its own container, the narrow
// one shows only the revenue bars: no margin line, axis or grid.
for (const cell of document.querySelectorAll('.cell')) {
  chart(cell, {
    data: {
      labels: quarters,
      series: [
        { name: 'revenue', data: [120, 150, 170, 210] },
        { name: 'margin', data: [12, 18, 15, 22] }
      ]
    },
    axes: cartesianAxes([
      quarterAxis,
      revenueAxis,
      {
        id: 'margin',
        side: 'right',
        type: autoScaleAxis(),
        low: 0,
        onlyInteger: true,
        labelInterpolationFnc: value => `${value}%`
      }
    ]),
    layers: [
      axisGrid({ axes: ['quarters', 'revenue'] }),
      revenueBars,
      line({ series: ['margin'], x: 'quarters', y: 'margin', align: 'center' }),
      axisLabels()
    ],
    responsive: responsive([
      [
        container('(width < 400px)'),
        {
          axes: cartesianAxes([quarterAxis, revenueAxis]),
          layers: [revenueBars, axisLabels()]
        }
      ]
    ])
  });
}
