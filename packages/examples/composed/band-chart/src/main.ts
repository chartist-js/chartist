import 'chartist/styles.css';
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  band,
  cartesianAxes,
  chart,
  line,
  stepAxis
} from 'chartist';

const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

// Weekly sales of six stores, in thousands.
const stores = [
  { name: 'Basel', data: [42, 45, 40, 38, 44, 47, 50, 52] },
  { name: 'Bern', data: [36, 38, 33, 28, 30, 41, 49, 55] },
  { name: 'Chur', data: [25, 27, 30, 29, 31, 30, 33, 34] },
  { name: 'Geneva', data: [50, 53, 55, 51, 49, 54, 58, 60] },
  { name: 'Lucerne', data: [31, 30, 34, 36, 35, 37, 36, 40] },
  { name: 'Zurich', data: [46, 44, 49, 52, 50, 48, 53, 57] }
];
const average = weeks.map(
  (_, week) =>
    stores.reduce((sum, store) => sum + store.data[week], 0) / stores.length
);

// The band spans the lowest to the highest store each week. On top: the
// average, and one store to compare.
chart('#chart', {
  data: {
    labels: weeks,
    series: [
      ...stores,
      { name: 'average', className: 'ct-series-e', data: average }
    ]
  },
  axes: cartesianAxes({
    x: { type: stepAxis() },
    y: { type: autoScaleAxis(), low: 0 }
  }),
  layers: [
    axisGrid(),
    band({ series: stores.map(store => store.name), lineSmooth: false }),
    line({ series: ['average'], lineSmooth: false, showPoint: false }),
    line({ series: ['Bern'], lineSmooth: false }),
    axisLabels()
  ]
});
