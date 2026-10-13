import {
  BarChart,
  EventEmitter,
  LineChart,
  PieChart,
  Svg,
  type DataEvent,
  type PointDrawEvent
} from 'chartist';
import { container, created, recordEvents } from './fixture.ts';

/** Event names, with draw events as `draw:<type>`, consecutive repeats collapsed. */
function sequence(events: { name: string; data: any }[]) {
  return events
    .map(({ name, data }) => (name === 'draw' ? `draw:${data.type}` : name))
    .filter((name, i, names) => name !== names[i - 1]);
}

const keys = (payload: object) => Object.keys(payload).sort();

describe('event order', () => {
  test('LineChart: data, grids and labels per axis step, points, line, area, created', async () => {
    const chart = new LineChart(
      container(),
      { labels: ['A', 'B'], series: [[1, 2]] },
      { showArea: true, axisY: { onlyInteger: true } }
    );
    const events = recordEvents(chart);
    await created(chart);
    expect(sequence(events)).toEqual([
      'data',
      ...Array(4).fill(['draw:grid', 'draw:label']).flat(),
      'draw:point',
      'draw:line',
      'draw:area',
      'created'
    ]);
  });

  test('BarChart: data, grids and labels, bars, created', async () => {
    const chart = new BarChart(
      container(),
      { labels: ['A', 'B'], series: [[1, 2]] },
      { axisY: { onlyInteger: true } }
    );
    const events = recordEvents(chart);
    await created(chart);
    expect(sequence(events)).toEqual([
      'data',
      ...Array(5).fill(['draw:grid', 'draw:label']).flat(),
      'draw:bar',
      'created'
    ]);
  });

  test('PieChart: data, a slice and its label per value, created', async () => {
    const chart = new PieChart(container(), {
      labels: ['A', 'B'],
      series: [1, 3]
    });
    const events = recordEvents(chart);
    await created(chart);
    expect(sequence(events)).toEqual([
      'data',
      'draw:slice',
      'draw:label',
      'draw:slice',
      'draw:label',
      'created'
    ]);
  });
});

describe('event payloads', () => {
  async function lineEvents() {
    const chart = new LineChart(container(), {
      labels: ['A', 'B'],
      series: [{ name: 's', data: [1, { value: 2, meta: 'm' }] }]
    });
    const events = recordEvents(chart);
    await created(chart);
    return events;
  }

  test('data event carries the chart data', async () => {
    const data = { labels: ['A'], series: [[1]] };
    const chart = new LineChart(container(), data);
    const events = recordEvents(chart);
    await created(chart);
    expect(events[0]).toEqual({
      name: 'data',
      data: { type: 'initial', data }
    });
  });

  test('point, label and created payload fields', async () => {
    const events = await lineEvents();
    const draws = events.filter(e => e.name === 'draw').map(e => e.data);
    const points = draws.filter(d => d.type === 'point');
    expect(keys(points[1])).toEqual([
      'axisX',
      'axisY',
      'chartRect',
      'element',
      'group',
      'index',
      'meta',
      'series',
      'seriesIndex',
      'type',
      'value',
      'x',
      'y'
    ]);
    expect(points[1]).toMatchObject({
      index: 1,
      seriesIndex: 0,
      meta: 'm',
      value: { y: 2 }
    });
    expect(points[1].element).toBeInstanceOf(Svg);
    expect(points[1].element.getNode().isConnected).toBe(true);
    expect(points[1].group.getNode().getAttribute('class')).toBe(
      'ct-series ct-series-a'
    );

    expect(keys(draws.find(d => d.type === 'label'))).toEqual([
      'axis',
      'element',
      'group',
      'height',
      'index',
      'text',
      'type',
      'width',
      'x',
      'y'
    ]);
    expect(keys(events.at(-1)!.data)).toEqual([
      'axisX',
      'axisY',
      'chartRect',
      'options',
      'svg'
    ]);
    expect(events.at(-1)!.data.svg).toBeInstanceOf(Svg);
  });

  test('bar and slice payload fields', async () => {
    const bar = new BarChart(container(), { series: [[1]] });
    const pie = new PieChart(container(), { series: [1] });
    const barEvents = recordEvents(bar);
    const pieEvents = recordEvents(pie);
    await Promise.all([created(bar), created(pie)]);
    expect(keys(barEvents.find(e => e.data?.type === 'bar')!.data)).toEqual([
      'axisX',
      'axisY',
      'chartRect',
      'element',
      'group',
      'index',
      'meta',
      'series',
      'seriesIndex',
      'type',
      'value',
      'x1',
      'x2',
      'y1',
      'y2'
    ]);
    expect(keys(pieEvents.find(e => e.data?.type === 'slice')!.data)).toEqual([
      'center',
      'chartRect',
      'element',
      'endAngle',
      'group',
      'index',
      'meta',
      'path',
      'radius',
      'series',
      'startAngle',
      'totalDataSum',
      'type',
      'value'
    ]);
  });
});

describe('listeners can change the chart', () => {
  test('mutating data in a data listener changes the output', async () => {
    const el = container();
    const chart = new LineChart(el, { series: [[1, 2]] }).on(
      'data',
      (event: DataEvent) => {
        (event.data.series[0] as number[]).push(3);
      }
    );
    await created(chart);
    expect(el.querySelectorAll('.ct-point')).toHaveLength(3);
  });

  test('a draw listener can replace an element', async () => {
    const el = container();
    const chart = new LineChart(el, { series: [[1, 2]] }).on(
      'draw',
      (event: PointDrawEvent) => {
        if (event.type === 'point') {
          event.element.replace(
            new Svg('circle', { cx: event.x, cy: event.y, r: 5 }, 'ct-dot')
          );
        }
      }
    );
    await created(chart);
    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
    expect(el.querySelectorAll('circle.ct-dot')).toHaveLength(2);
  });
});

describe('on and off', () => {
  test('off removes one listener, or all listeners of an event', async () => {
    const chart = new LineChart(container(), { series: [[1]] });
    const first = vi.fn();
    const second = vi.fn();
    chart.on('data', first).on('data', second).off('data', first);
    await created(chart);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    chart.off('data');
    const next = created(chart);
    chart.update({ series: [[2]] });
    await next;
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('"*" listeners receive every event with its name', async () => {
    const chart = new LineChart(container(), { series: [[1]] });
    const all = vi.fn();
    chart.on('*', all);
    await created(chart);
    expect(all).toHaveBeenCalledWith('data', expect.anything());
    expect(all).toHaveBeenCalledWith('created', expect.anything());
  });

  test('update emits a data event of type update', async () => {
    const chart = new LineChart(container(), { series: [[1]] });
    await created(chart);
    const listener = vi.fn();
    chart.on('data', listener);
    chart.update({ series: [[2]] });
    expect(listener).toHaveBeenCalledWith({
      type: 'update',
      data: { series: [[2]], labels: [] }
    });
  });
});

describe('animation events', () => {
  test('Svg.animate reports begin and end through an EventEmitter', () => {
    const emitter = new EventEmitter();
    const begin = vi.fn();
    const end = vi.fn();
    emitter.on('animationBegin', begin);
    emitter.on('animationEnd', end);

    const line = new Svg('svg').elem('line', { x1: 0 });
    line.animate({ x1: { dur: 100, from: 0, to: 10 } }, false, emitter);
    const animate = line.getNode().querySelector('animate')!;
    expect(animate.getAttribute('attributeName')).toBe('x1');

    // jsdom has no SMIL; dispatch the events a browser would fire.
    animate.dispatchEvent(new Event('beginEvent'));
    animate.dispatchEvent(new Event('endEvent'));
    expect(begin).toHaveBeenCalledWith(
      expect.objectContaining({ element: line, animate })
    );
    expect(end).toHaveBeenCalledTimes(1);
  });
});
