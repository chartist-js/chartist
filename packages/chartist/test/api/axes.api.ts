import {
  AutoScaleAxis,
  Axis,
  BarChart,
  FixedScaleAxis,
  LineChart,
  StepAxis
} from 'chartist';
import { container, created, withCompat } from './fixture.ts';

function labels(el: Element, direction: 'horizontal' | 'vertical') {
  return Array.from(
    el.querySelectorAll(`.ct-label.ct-${direction}`),
    label => label.textContent
  );
}

const grids = (el: Element, direction: 'horizontal' | 'vertical') =>
  el.querySelectorAll(`.ct-grid.ct-${direction}`).length;

describe('axis classes as options', () => {
  test('default: StepAxis on X with the data labels, AutoScaleAxis on Y', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { labels: ['Mon', 'Tue', 'Wed'], series: [[0, 5, 10]] },
        withCompat({ axisY: { onlyInteger: true } })
      )
    );
    expect(labels(el, 'horizontal')).toEqual(['Mon', 'Tue', 'Wed']);
    expect(grids(el, 'horizontal')).toBe(3);
    const y = labels(el, 'vertical').map(Number);
    expect(y[0]).toBe(0);
    expect(y.at(-1)).toBe(10);
    expect(y.every(Number.isInteger)).toBe(true);
  });

  test('FixedScaleAxis with explicit ticks', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        {
          series: [
            [
              { x: 1, y: 1 },
              { x: 9, y: 3 }
            ]
          ]
        },
        withCompat({
          axisX: { type: FixedScaleAxis, ticks: [0, 5, 10], low: 0, high: 10 },
          axisY: { type: AutoScaleAxis, onlyInteger: true }
        })
      )
    );
    expect(labels(el, 'horizontal')).toEqual(['0', '5', '10']);
    expect(grids(el, 'horizontal')).toBe(3);
  });

  test('FixedScaleAxis with a divisor (the number of steps)', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        {
          series: [
            [
              { x: 0, y: 0 },
              { x: 100, y: 1 }
            ]
          ]
        },
        withCompat({ axisX: { type: FixedScaleAxis, divisor: 4 } })
      )
    );
    // 1.x left out the tick at high; v2 has one at both ends (#1022).
    expect(labels(el, 'horizontal')).toEqual(
      process.env.CHARTIST_API_TARGET === 'v1'
        ? ['0', '25', '50', '75']
        : ['0', '25', '50', '75', '100']
    );
  });

  test('a next tick at the axis start sizes the label before it (#1471)', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        {
          series: [
            [
              { x: 10, y: 1 },
              { x: 20, y: 3 },
              { x: 30, y: 2 }
            ]
          ]
        },
        withCompat({ axisX: { type: FixedScaleAxis, ticks: [0, 10, 20, 30] } })
      )
    );
    const widths = Array.from(
      el.querySelectorAll('.ct-label.ct-horizontal'),
      label => Number(label.closest('foreignObject')!.getAttribute('width'))
    );
    expect(widths).toHaveLength(4);
    // 1.x took the next tick at position 0 for a missing one, and gave the
    // label "0" the rest of the axis.
    if (process.env.CHARTIST_API_TARGET === 'v1') {
      expect(widths[0]).toBeGreaterThan(widths[1]);
    } else {
      expect(widths[0]).toBeCloseTo(widths[1]);
    }
  });

  test('chart-level low and high apply to the default Y axis', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[2, 3]] },
        withCompat({ low: 0, high: 4, axisY: { onlyInteger: true } })
      )
    );
    expect(labels(el, 'vertical')).toEqual(['0', '1', '2', '3', '4']);
  });

  test('an explicit AutoScaleAxis takes low and high from its own options', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[2, 3]] },
        withCompat({
          low: 0,
          high: 4,
          axisY: { type: AutoScaleAxis, onlyInteger: true, low: 1, high: 5 }
        })
      )
    );
    expect(labels(el, 'vertical')).toEqual(['1', '2', '3', '4', '5']);
  });

  test('StepAxis with explicit ticks and stretch', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[1, 2, 3]] },
        withCompat({
          axisX: { type: StepAxis, ticks: ['a', 'b', 'c'], stretch: true }
        })
      )
    );
    expect(labels(el, 'horizontal')).toEqual(['a', 'b', 'c']);
  });

  test('labelInterpolationFnc, showLabel and showGrid', async () => {
    const el = container();
    await created(
      new BarChart(
        el,
        { labels: ['a', 'b'], series: [[1, 2]] },
        withCompat({
          axisX: { labelInterpolationFnc: (value: unknown) => `#${value}` },
          axisY: { showLabel: false, showGrid: false }
        })
      )
    );
    expect(labels(el, 'horizontal')).toEqual(['#a', '#b']);
    expect(labels(el, 'vertical')).toEqual([]);
    expect(grids(el, 'vertical')).toBe(0);
  });

  test('axis classes extend Axis, and created events carry the axes', async () => {
    const chart = new LineChart(container(), { series: [[1]] }, withCompat());
    const event = await created<{ axisX: Axis; axisY: Axis }>(chart);
    expect(event.axisX).toBeInstanceOf(StepAxis);
    expect(event.axisY).toBeInstanceOf(AutoScaleAxis);
    expect(event.axisY).toBeInstanceOf(Axis);
    expect(Object.getPrototypeOf(FixedScaleAxis.prototype)).toBe(
      Axis.prototype
    );
  });
});
