import {
  autoScaleAxis,
  cartesianAxes,
  chart,
  line,
  stepAxis,
  trendLine
} from 'chartist';
import { container } from './fixture.ts';

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

describe('trend line layer (v2)', () => {
  test('draws a dashed line per series in its series group', () => {
    const el = container();
    chart(el, {
      data: {
        labels,
        series: [
          { name: 'visits', data: [1, 2, 4, 3, 5] },
          { name: 'sales', data: [5, 4, 4, 2, 1] }
        ]
      },
      axes: cartesianAxes([
        { id: 'day', side: 'bottom', type: stepAxis(), ticks: labels },
        { id: 'count', side: 'left', type: autoScaleAxis() }
      ]),
      layers: [line(), trendLine({ series: ['sales'] })],
      width: 600,
      height: 300
    });
    const trends = el.querySelectorAll('g.ct-series line.ct-trend-line');
    expect(trends).toHaveLength(1);
    expect(trends[0].parentElement?.classList.contains('ct-series-b')).toBe(
      true
    );
    expect(el.querySelector('svg')?.classList.contains('ct-chart-line')).toBe(
      true
    );
  });
});
