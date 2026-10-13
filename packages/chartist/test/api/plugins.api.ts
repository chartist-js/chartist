import { BarChart, LineChart, type PointDrawEvent } from 'chartist';
import { container, created, withCompat } from './fixture.ts';

describe('1.x plugins', () => {
  test('a plugin function receives the chart before the first render', async () => {
    const seen: string[] = [];
    const plugin = vi.fn((chart: LineChart) => {
      chart.on('data', () => seen.push('data'));
    });
    const chart = new LineChart(
      container(),
      { series: [[1]] },
      withCompat({ plugins: [plugin] })
    );
    await created(chart);
    expect(plugin).toHaveBeenCalledTimes(1);
    expect(plugin).toHaveBeenCalledWith(chart);
    expect(seen).toEqual(['data']);
  });

  test('a plugin given as [plugin, options] receives the options', async () => {
    const plugin = vi.fn();
    const chart = new BarChart(
      container(),
      { series: [[1]] },
      { plugins: [[plugin, { position: 'top' }]] }
    );
    await created(chart);
    expect(plugin).toHaveBeenCalledWith(chart, { position: 'top' });
  });

  test('a plugin can change the output through draw events', async () => {
    const el = container();
    const addClass = (className: string) => (chart: LineChart) => {
      chart.on('draw', (event: PointDrawEvent) => {
        if (event.type === 'point') {
          event.element.addClass(className);
        }
      });
    };
    await created(
      new LineChart(
        el,
        { series: [[1, 2]] },
        withCompat({ plugins: [addClass('marked')] })
      )
    );
    expect(el.querySelectorAll('.ct-point.marked')).toHaveLength(2);
  });

  test('plugins run once, not again on update', async () => {
    const plugin = vi.fn();
    const chart = new LineChart(
      container(),
      { series: [[1]] },
      withCompat({ plugins: [plugin] })
    );
    await created(chart);
    const next = created(chart);
    chart.update({ series: [[2]] });
    await next;
    expect(plugin).toHaveBeenCalledTimes(1);
  });
});
