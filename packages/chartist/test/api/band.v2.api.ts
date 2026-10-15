import {
  autoScaleAxis,
  band,
  cartesianAxes,
  chart,
  line,
  stepAxis
} from 'chartist';
import { container } from './fixture.ts';

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function banded(el: Element) {
  return chart(el, {
    data: {
      labels,
      series: [
        { name: 'low', data: [2, 3, 2, 3, 2] },
        { name: 'high', data: [6, 7, 8, 7, 6] },
        { name: 'values', data: [1, 4, 5, 9, 4] }
      ]
    },
    axes: cartesianAxes([
      { id: 'day', side: 'bottom', type: stepAxis(), ticks: labels },
      { id: 'count', side: 'left', type: autoScaleAxis() }
    ]),
    layers: [band({ low: 'low', high: 'high' }), line({ series: ['values'] })],
    width: 600,
    height: 300
  });
}

describe('band layer (v2)', () => {
  test('fills between two series behind the line', () => {
    const el = container();
    banded(el);
    const svg = el.querySelector('svg');
    expect(svg?.classList.contains('ct-chart-line')).toBe(true);
    expect(el.querySelectorAll('g.ct-band path.ct-band-area')).toHaveLength(1);
    expect(svg?.firstElementChild?.classList.contains('ct-band')).toBe(true);
  });
});
