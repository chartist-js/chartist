import { noop } from '../utils/functional';

/** The 1.x `BarChart` default options. */
export const barDefaults = {
  axisX: {
    offset: 30,
    position: 'end' as const,
    labelOffset: { x: 0, y: 0 },
    showLabel: true,
    showGrid: true,
    labelInterpolationFnc: noop,
    scaleMinSpace: 30,
    onlyInteger: false
  },
  axisY: {
    offset: 40,
    position: 'start' as const,
    labelOffset: { x: 0, y: 0 },
    showLabel: true,
    showGrid: true,
    labelInterpolationFnc: noop,
    scaleMinSpace: 20,
    onlyInteger: false
  },
  width: undefined,
  height: undefined,
  high: undefined,
  low: undefined,
  referenceValue: 0,
  chartPadding: { top: 15, right: 15, bottom: 5, left: 10 },
  seriesBarDistance: 15,
  stackBars: false,
  stackMode: 'accumulate' as const,
  horizontalBars: false,
  distributeSeries: false,
  reverseData: false,
  showGridBackground: false,
  classNames: {
    chart: 'ct-chart-bar',
    horizontalBars: 'ct-horizontal-bars',
    label: 'ct-label',
    labelGroup: 'ct-labels',
    series: 'ct-series',
    bar: 'ct-bar',
    grid: 'ct-grid',
    gridGroup: 'ct-grids',
    gridBackground: 'ct-grid-background',
    vertical: 'ct-vertical',
    horizontal: 'ct-horizontal',
    start: 'ct-start',
    end: 'ct-end'
  }
};
