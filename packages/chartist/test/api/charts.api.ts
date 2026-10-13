import {
  BarChart,
  BaseChart,
  LineChart,
  PieChart,
  type LineChartOptions
} from 'chartist';
import { classesOf, container, created, withCompat } from './fixture.ts';

const CT_NS = 'http://gionkunz.github.com/chartist-js/ct';

describe('chart creation', () => {
  test('accepts a selector or an element as target', async () => {
    const byElement = container();
    await created(new LineChart(byElement, { series: [[1]] }, withCompat()));
    expect(byElement.querySelector('svg')).not.toBeNull();

    container('by-selector');
    await created(
      new LineChart('.by-selector', { series: [[1]] }, withCompat())
    );
    expect(document.querySelector('.by-selector svg')).not.toBeNull();
  });

  test('all chart types extend BaseChart', () => {
    for (const Chart of [LineChart, BarChart, PieChart]) {
      // v2 wrappers may have a shared base in between (PresetChart).
      expect(Chart.prototype).toBeInstanceOf(BaseChart);
    }
  });

  test('throws when the selector matches nothing', () => {
    // 1.5 schedules the first render before the constructor throws, and that
    // render then fails without a container. Fake timers keep it from firing.
    vi.useFakeTimers();
    try {
      expect(
        () => new LineChart('#nope', { series: [] }, withCompat())
      ).toThrow('Target element "#nope" is not found');
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  test('renders asynchronously, so listeners can be added after construction', async () => {
    const el = container();
    const chart = new LineChart(el, { series: [[1]] }, withCompat());
    expect(el.querySelector('svg')).toBeNull();
    await created(chart);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  test('replaces an earlier chart in the same container', async () => {
    const el = container();
    await created(new LineChart(el, { series: [[1]] }, withCompat()));
    await created(new BarChart(el, { series: [[1]] }, withCompat()));
    expect(classesOf(el, 'svg')).toEqual(['ct-chart-bar']);
  });

  test('sets the svg size from the width and height options', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[1]] },
        withCompat({ width: '400px', height: '20rem' })
      )
    );
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('400px');
    expect(svg.getAttribute('height')).toBe('20rem');
    expect(svg.getAttribute('style')).toBe('width: 400px; height: 20rem;');
  });
});

describe('LineChart output', () => {
  async function render() {
    const el = container();
    await created(
      new LineChart(
        el,
        {
          labels: ['A', 'B'],
          series: [{ name: 'one', data: [1, { value: 2, meta: 'm' }] }, [3, 4]]
        },
        withCompat()
      )
    );
    return el;
  }

  test('svg root with the ct namespace and chart class', async () => {
    const svg = (await render()).querySelector('svg')!;
    expect(svg.getAttribute('class')).toBe('ct-chart-line');
    expect(svg.getAttribute('xmlns:ct')).toBe(CT_NS);
  });

  test('grid, series and label groups in order', async () => {
    const svg = (await render()).querySelector('svg')!;
    expect(
      Array.from(svg.children, child => child.getAttribute('class'))
    ).toEqual(['ct-grids', null, 'ct-labels']);
  });

  test('one group per series with letter classes and series name', async () => {
    const el = await render();
    expect(classesOf(el, '.ct-series')).toEqual([
      'ct-series ct-series-a',
      'ct-series ct-series-b'
    ]);
    expect(
      el.querySelector('.ct-series-a')!.getAttributeNS(CT_NS, 'series-name')
    ).toBe('one');
  });

  test('a line and one point per value with ct:value and ct:meta', async () => {
    const series = (await render()).querySelector('.ct-series-a')!;
    expect(series.querySelectorAll('path.ct-line')).toHaveLength(1);
    const points = Array.from(series.querySelectorAll('line.ct-point'));
    expect(points.map(p => p.getAttributeNS(CT_NS, 'value'))).toEqual([
      '1',
      '2'
    ]);
    expect(points[1].getAttributeNS(CT_NS, 'meta')).toBe('m');
  });

  test('labels as HTML spans in foreignObject', async () => {
    const el = await render();
    const labels = el.querySelectorAll('.ct-labels > foreignObject > span');
    expect(
      Array.from(labels)
        .filter(label => label.classList.contains('ct-horizontal'))
        .map(label => label.textContent)
    ).toEqual(['A', 'B']);
    expect(classesOf(el, '.ct-label.ct-horizontal')[0]).toBe(
      'ct-label ct-horizontal ct-end'
    );
  });

  test('showArea, showLine and showPoint control the elements', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[1, 2]] },
        withCompat({ showArea: true, showLine: false, showPoint: false })
      )
    );
    expect(el.querySelectorAll('.ct-area')).toHaveLength(1);
    expect(el.querySelectorAll('.ct-line')).toHaveLength(0);
    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
  });

  test('custom class names', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[1, 2]] },
        withCompat({ classNames: { chart: 'my-chart', point: 'my-point' } })
      )
    );
    expect(el.querySelector('svg')!.getAttribute('class')).toBe('my-chart');
    expect(el.querySelectorAll('.my-point')).toHaveLength(2);
  });
});

describe('BarChart output', () => {
  test('one bar line per value with ct:value', async () => {
    const el = container();
    await created(
      new BarChart(
        el,
        {
          labels: ['A', 'B'],
          series: [
            [1, 2],
            [3, 4]
          ]
        },
        withCompat()
      )
    );
    expect(el.querySelector('svg')!.getAttribute('class')).toBe('ct-chart-bar');
    expect(
      Array.from(el.querySelectorAll('.ct-series-b line.ct-bar'), bar =>
        bar.getAttributeNS(CT_NS, 'value')
      )
    ).toEqual(['3', '4']);
  });

  test('stacked and horizontal bars', async () => {
    const el = container();
    await created(
      new BarChart(
        el,
        {
          series: [
            [1, 2],
            [3, 4]
          ]
        },
        withCompat({ stackBars: true, horizontalBars: true })
      )
    );
    expect(el.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-bar ct-horizontal-bars'
    );
    expect(el.querySelectorAll('.ct-bar')).toHaveLength(4);
  });
});

describe('PieChart output', () => {
  test('one slice path per value and SVG text labels', async () => {
    const el = container();
    await created(new PieChart(el, { labels: ['A', 'B'], series: [1, 3] }));
    expect(el.querySelector('svg')!.getAttribute('class')).toBe('ct-chart-pie');
    expect(classesOf(el, 'path')).toEqual(['ct-slice-pie', 'ct-slice-pie']);
    expect(
      Array.from(
        el.querySelectorAll('text.ct-label'),
        label => label.textContent
      )
    ).toEqual(['A', 'B']);
  });

  test('donut slices', async () => {
    const el = container();
    await created(new PieChart(el, { series: [1, 3] }, { donut: true }));
    expect(el.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-donut'
    );
    expect(classesOf(el, 'path')).toEqual(['ct-slice-donut', 'ct-slice-donut']);
  });
});

describe('update and detach', () => {
  test('update with new data re-renders', async () => {
    const el = container();
    const chart = new LineChart(el, { series: [[1, 2]] }, withCompat());
    await created(chart);
    const next = created(chart);
    chart.update({ series: [[1, 2, 3]] });
    await next;
    expect(el.querySelectorAll('.ct-point')).toHaveLength(3);
  });

  // 1.5 semantics (see the update() JSDoc): new options extend the chart
  // defaults, unless override is true, then they extend the current options.
  test('update options extend the defaults, or the current options with override', async () => {
    const el = container();
    const chart = new LineChart(
      el,
      { series: [[1, 2]] },
      withCompat({ showPoint: false })
    );
    await created(chart);

    // update() types its options as the base Options in 1.5 (see
    // charts.test-d.ts), so chart options go through a typed variable.
    const hideLine: LineChartOptions = { showLine: false };
    const showArea: LineChartOptions = { showArea: true };

    let next = created(chart);
    chart.update(undefined, hideLine, true);
    await next;
    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
    expect(el.querySelectorAll('.ct-line')).toHaveLength(0);

    next = created(chart);
    chart.update(undefined, showArea);
    await next;
    expect(el.querySelectorAll('.ct-point')).toHaveLength(2);
    expect(el.querySelectorAll('.ct-line')).toHaveLength(1);
    expect(el.querySelectorAll('.ct-area')).toHaveLength(1);
  });

  test('re-renders on window resize until detached', async () => {
    const el = container();
    const chart = new LineChart(el, { series: [[1]] }, withCompat());
    await created(chart);
    const listener = vi.fn();
    chart.on('created', listener);

    window.dispatchEvent(new Event('resize'));
    expect(listener).toHaveBeenCalledTimes(1);

    chart.detach();
    window.dispatchEvent(new Event('resize'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
