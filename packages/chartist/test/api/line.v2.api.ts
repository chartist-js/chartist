import {
  FixedScaleAxis,
  LineChart,
  autoScaleAxis,
  cartesianAxes,
  chart,
  fixedScaleAxis,
  line,
  lineChart,
  stepAxis,
  type PhaseEvents
} from 'chartist';
import { container, created, mockMedia, withCompat } from './fixture.ts';

// jsdom has no layout: v2 measures the container, so sizes are explicit.
const SIZE = { width: 500, height: 500 };

function labels(el: Element, direction: 'horizontal' | 'vertical') {
  return Array.from(
    el.querySelectorAll(`.ct-label.ct-${direction}`),
    label => label.textContent
  );
}

describe('lineChart (v2 preset)', () => {
  test('renders the 1.x structure synchronously with 1.x options', () => {
    const el = container();
    lineChart(
      el,
      { labels: ['Mon', 'Tue', 'Wed'], series: [[1, 5, 3]] },
      { ...SIZE, showArea: true, axisY: { onlyInteger: true } }
    );
    expect(el.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-line'
    );
    expect(labels(el, 'horizontal')).toEqual(['Mon', 'Tue', 'Wed']);
    expect(el.querySelectorAll('.ct-series-a .ct-point')).toHaveLength(3);
    expect(el.querySelectorAll('.ct-series-a .ct-area')).toHaveLength(1);
  });

  test('a v2 axis factory and the 1.x class render the same axis', () => {
    const render = (
      type: typeof FixedScaleAxis | ReturnType<typeof fixedScaleAxis>
    ) => {
      const el = container();
      lineChart(
        el,
        { series: [[1, 5, 9]] },
        {
          ...SIZE,
          axisY: { type, ticks: [0, 5, 10] }
        }
      );
      return el.innerHTML;
    };
    const fromFactory = render(fixedScaleAxis());
    expect(fromFactory).toBe(render(FixedScaleAxis));
    expect(fromFactory).toContain('>10</span>');
  });

  test('auto scale like 1.x: same Y labels and grid positions', async () => {
    const data = { series: [[1, 2, 3, 4, 5, 6, 7, 8, 9]] };
    const options = { ...SIZE, axisY: { onlyInteger: true } };

    const legacyEl = container();
    await created(new LineChart(legacyEl, data, withCompat(options)));
    const v2El = container();
    lineChart(v2El, data, options);

    expect(labels(v2El, 'vertical')).toEqual(labels(legacyEl, 'vertical'));
    const gridY = (el: Element) =>
      Array.from(el.querySelectorAll('.ct-grid.ct-vertical'), g =>
        g.getAttribute('y1')
      );
    expect(gridY(v2El)).toEqual(gridY(legacyEl));
  });

  test('compose listeners see grid and label nodes with axis and index', () => {
    const el = container();
    const chart = lineChart(el, { labels: ['a', 'b'], series: [[1, 2]] }, SIZE);
    const nodes: PhaseEvents['compose'][] = [];
    chart.on('compose', n => void nodes.push(n));
    chart.update({});
    const grids = nodes.filter(n => n.role === 'grid');
    const texts = nodes.filter(n => n.role === 'label').map(n => n.ctx?.text);
    expect(grids.length).toBeGreaterThan(0);
    expect(
      grids.every(g => typeof g.ctx?.index === 'number' && g.ctx?.axis)
    ).toBe(true);
    expect(texts.slice(0, 2)).toEqual(['a', 'b']);
  });

  test('window-mode responsive options', () => {
    const media = mockMedia();
    try {
      const el = container();
      const chart = lineChart(el, { series: [[1, 2]] }, SIZE, [
        ['(max-width: 640px)', { showPoint: false }]
      ]);
      expect(el.querySelectorAll('.ct-point')).toHaveLength(2);
      media.setMatches('(max-width: 640px)', true);
      expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
      chart.destroy();
      expect(media.listenerCount('(max-width: 640px)')).toBe(0);
    } finally {
      media.restore();
    }
  });
});

describe('composing a line chart from parts', () => {
  test('chart() with cartesianAxes and the line layer', () => {
    const el = container();
    chart(el, {
      data: { labels: ['a', 'b', 'c'], series: [[1, 3, 2]] },
      axes: cartesianAxes({
        x: { type: stepAxis(), ticks: ['a', 'b', 'c'] },
        y: { type: autoScaleAxis(), onlyInteger: true }
      }),
      layers: [line({ showArea: true })],
      ...SIZE
    });
    expect(el.querySelectorAll('.ct-series-a .ct-point')).toHaveLength(3);
    expect(el.querySelectorAll('.ct-series-a .ct-area')).toHaveLength(1);
    // No grid or label layer: those belong to the preset.
    expect(el.querySelector('.ct-grid')).toBeNull();
  });
});

// 1.5.0 applied a top-level referenceValue to bar charts only.
describe("a line chart's top-level referenceValue", () => {
  const data = { series: [[5, 8, 6]] };

  test('lineChart() includes it on the Y axis', () => {
    const el = container();
    lineChart(el, data, { ...SIZE, referenceValue: 0 });
    expect(labels(el, 'vertical')[0]).toBe('0');
  });

  test('LineChart includes it, and axisY.referenceValue wins', async () => {
    const el = container();
    await created(new LineChart(el, data, withCompat({ referenceValue: 0 })));
    expect(labels(el, 'vertical')[0]).toBe('0');

    const own = container();
    await created(
      new LineChart(
        own,
        data,
        withCompat({ referenceValue: 0, axisY: { referenceValue: 4 } })
      )
    );
    expect(labels(own, 'vertical')[0]).toBe('4');
  });
});
