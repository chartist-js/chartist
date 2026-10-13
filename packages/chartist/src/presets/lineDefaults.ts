import { noop } from '../utils/functional';

/**
 * The 1.x `LineChart` default options. The 1.x class keeps its own copy until
 * it becomes a wrapper over `lineChart`.
 */
export const lineDefaults = {
  axisX: {
    offset: 30,
    position: 'end' as const,
    labelOffset: { x: 0, y: 0 },
    showLabel: true,
    showGrid: true,
    labelInterpolationFnc: noop,
    type: undefined
  },
  axisY: {
    offset: 40,
    position: 'start' as const,
    labelOffset: { x: 0, y: 0 },
    showLabel: true,
    showGrid: true,
    labelInterpolationFnc: noop,
    type: undefined,
    scaleMinSpace: 20,
    onlyInteger: false
  },
  width: undefined,
  height: undefined,
  showLine: true,
  showPoint: true,
  showArea: false,
  areaBase: 0,
  lineSmooth: true,
  showGridBackground: false,
  low: undefined,
  high: undefined,
  chartPadding: { top: 15, right: 15, bottom: 5, left: 10 },
  fullWidth: false,
  reverseData: false,
  classNames: {
    chart: 'ct-chart-line',
    label: 'ct-label',
    labelGroup: 'ct-labels',
    series: 'ct-series',
    line: 'ct-line',
    point: 'ct-point',
    area: 'ct-area',
    grid: 'ct-grid',
    gridGroup: 'ct-grids',
    gridBackground: 'ct-grid-background',
    vertical: 'ct-vertical',
    horizontal: 'ct-horizontal',
    start: 'ct-start',
    end: 'ct-end'
  }
};
