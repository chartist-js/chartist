import {
  StepAxis,
  autoScaleAxis,
  bar,
  barChart,
  cartesianAxes,
  chart,
  stepAxis
} from 'chartist';
import { container } from './fixture.ts';

const SIZE = { width: 400, height: 200 };

describe('barChart (v2 preset)', () => {
  test('horizontal bars: values on X, labels on Y', () => {
    const el = container();
    barChart(
      el,
      { labels: ['a', 'b'], series: [[1, 2]] },
      { ...SIZE, horizontalBars: true }
    );
    expect(el.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-bar ct-horizontal-bars'
    );
    const bars = Array.from(el.querySelectorAll('line.ct-bar'));
    expect(bars.every(b => b.getAttribute('y1') === b.getAttribute('y2'))).toBe(
      true
    );
    expect(
      Array.from(
        el.querySelectorAll('.ct-label.ct-vertical'),
        l => l.textContent
      )
    ).toEqual(['a', 'b']);
  });

  test('the default label axis, a step factory and the 1.x StepAxis class center bars alike', () => {
    const render = (type?: unknown) => {
      const el = container();
      barChart(
        el,
        { labels: ['a', 'b', 'c'], series: [[1, 2, 3]] },
        {
          ...SIZE,
          axisX: type ? { type: type as never, ticks: ['a', 'b', 'c'] } : {}
        }
      );
      return Array.from(el.querySelectorAll('line.ct-bar'), b =>
        b.getAttribute('x1')
      );
    };
    const centered = render();
    expect(render(StepAxis)).toEqual(centered);
    expect(render(stepAxis())).toEqual(centered);
  });

  test('stacked bars use the summed bounds', () => {
    const el = container();
    barChart(
      el,
      { labels: ['a'], series: [[2], [3]] },
      {
        ...SIZE,
        stackBars: true,
        axisY: { onlyInteger: true }
      }
    );
    const labels = Array.from(el.querySelectorAll('.ct-label.ct-vertical'), l =>
      Number(l.textContent)
    );
    expect(Math.max(...labels)).toBe(5);
  });
});

describe('composing a bar chart from parts', () => {
  test('chart() with cartesianAxes and the bar layer', () => {
    const el = container();
    chart(el, {
      data: { labels: ['a', 'b'], series: [[1, 2]] },
      axes: cartesianAxes({
        x: { type: stepAxis(), ticks: ['a', 'b'] },
        y: { type: autoScaleAxis(), referenceValue: 0 }
      }),
      layers: [bar({ seriesBarDistance: 10 })],
      ...SIZE
    });
    expect(el.querySelectorAll('.ct-series-a line.ct-bar')).toHaveLength(2);
  });
});
