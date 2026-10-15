import { noop } from '../utils/functional';

/** The 1.x `PieChart` default options. */
export const pieDefaults = {
  width: undefined,
  height: undefined,
  chartPadding: { top: 5, right: 5, bottom: 5, left: 5 },
  classNames: {
    chartPie: 'ct-chart-pie',
    chartDonut: 'ct-chart-donut',
    series: 'ct-series',
    slicePie: 'ct-slice-pie',
    sliceDonut: 'ct-slice-donut',
    label: 'ct-label'
  },
  startAngle: 0,
  total: undefined,
  donut: false,
  showLabel: true,
  labelOffset: 0,
  labelPosition: 'inside' as const,
  labelInterpolationFnc: noop,
  labelDirection: 'neutral' as const,
  ignoreEmptyValues: false,
  preventOverlappingLabelOffset: 0
};
