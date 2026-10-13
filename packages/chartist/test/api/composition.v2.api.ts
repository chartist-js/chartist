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
import { container } from './fixture.ts';

const SIZE = { width: 600, height: 300 };
const data = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: 'revenue', data: [120, 150, 170, 210] },
    { name: 'margin', data: [0.12, 0.18, 0.15, 0.22] }
  ]
};

function composed(el: Element, align: 'start' | 'center' = 'center') {
  return chart(el, {
    data,
    axes: cartesianAxes([
      { id: 'quarters', side: 'bottom', type: stepAxis(), ticks: data.labels },
      { id: 'revenue', side: 'left', type: autoScaleAxis(), referenceValue: 0 },
      { id: 'margin', side: 'right', type: autoScaleAxis() }
    ]),
    layers: [
      axisGrid({ axes: ['quarters', 'revenue'] }),
      bar({ series: ['revenue'], x: 'quarters', y: 'revenue' }),
      line({ series: ['margin'], x: 'quarters', y: 'margin', align }),
      axisLabels()
    ],
    ...SIZE
  });
}

describe('composed charts (v2)', () => {
  test('bars and a line from one data set', () => {
    const el = container();
    composed(el);
    expect(el.querySelectorAll('g.ct-series-a line.ct-bar')).toHaveLength(4);
    expect(el.querySelectorAll('g.ct-series-a .ct-point')).toHaveLength(0);
    expect(el.querySelectorAll('g.ct-series-b .ct-point')).toHaveLength(4);
    expect(el.querySelectorAll('g.ct-series-b path.ct-line')).toHaveLength(1);
  });

  test('left and right Y axes each cover their own series', () => {
    const el = container();
    composed(el);
    const values = (cls: string) =>
      Array.from(el.querySelectorAll(`.ct-label.ct-vertical.${cls}`), l =>
        Number(l.textContent)
      );
    expect(Math.max(...values('ct-start'))).toBeGreaterThanOrEqual(210);
    expect(Math.max(...values('ct-end'))).toBeLessThan(1);
  });

  test('grid only for the named axes', () => {
    const el = container();
    composed(el);
    const horizontal = el.querySelectorAll(
      '.ct-grids .ct-grid.ct-horizontal'
    ).length;
    const vertical = el.querySelectorAll(
      '.ct-grids .ct-grid.ct-vertical'
    ).length;
    const leftLabels = el.querySelectorAll(
      '.ct-label.ct-vertical.ct-start'
    ).length;
    expect(horizontal).toBe(4);
    expect(vertical).toBe(leftLabels);
  });

  test('centered line points line up with the bars', () => {
    const el = container();
    composed(el, 'center');
    const bars = Array.from(el.querySelectorAll('line.ct-bar'), b =>
      b.getAttribute('x1')
    );
    const points = Array.from(el.querySelectorAll('line.ct-point'), p =>
      p.getAttribute('x1')
    );
    expect(points).toEqual(bars);
  });

  test('two axes on one side stack outward', () => {
    const el = container();
    chart(el, {
      data: {
        labels: ['a', 'b'],
        series: [
          [1, 2],
          [10, 20]
        ]
      },
      axes: cartesianAxes([
        { id: 'x', side: 'bottom', type: stepAxis(), ticks: ['a', 'b'] },
        { id: 'small', side: 'left', type: autoScaleAxis(), offset: 40 },
        { id: 'large', side: 'left', type: autoScaleAxis(), offset: 30 }
      ]),
      layers: [
        line({ series: [0], y: 'small' }),
        line({ series: [1], y: 'large' }),
        axisLabels({ axes: ['small', 'large'] })
      ],
      ...SIZE
    });
    const x = (n: number) =>
      Number(
        el.querySelectorAll('.ct-labels foreignObject')[n].getAttribute('x')
      );
    const smallCount =
      Array.from(el.querySelectorAll('.ct-labels foreignObject')).length / 2;
    expect(x(smallCount)).toBeLessThan(x(0));
  });
});
