import { LineChart } from '../charts/LineChart/LineChart';
import { lineChart } from '../presets/lineChart';
import { Svg } from '../svg/Svg';
import { compat, fromLegacyPlugin } from '.';

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

const created = (chart: LineChart) =>
  new Promise(resolve => chart.on('created', resolve));

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('compat: data', () => {
  it('data handlers mutate a copy; the change renders and persists', async () => {
    const element = sized();
    const data = { series: [[1, 2]] };
    const chart = new LineChart(element, data, { plugins: [compat] }).on(
      'data',
      (event: { data: { series: number[][] } }) => event.data.series[0].push(3)
    );
    await created(chart);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(3);
    expect(data.series[0]).toEqual([1, 2]);

    // An option-only update emits no data event and keeps the mutation.
    const listener = vi.fn();
    chart.on('data', listener);
    chart.update(undefined, { showLine: false }, true);
    expect(listener).not.toHaveBeenCalled();
    expect(element.querySelectorAll('.ct-point')).toHaveLength(3);
  });

  it('update(data) emits a data event of type update', async () => {
    const chart = new LineChart(
      sized(),
      { series: [[1]] },
      { plugins: [compat] }
    );
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

describe('compat: optionsChanged', () => {
  it('is emitted when a media query switches the options', async () => {
    const listeners: (() => void)[] = [];
    let matches = false;
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: () => undefined
    }));
    const chart = new LineChart(
      sized(),
      { series: [[1]] },
      { plugins: [compat] },
      [['print', { showPoint: false }]]
    );
    await created(chart);
    const changed = vi.fn();
    chart.on('optionsChanged', changed);
    matches = true;
    listeners.forEach(fn => fn());
    expect(changed).toHaveBeenCalledWith({
      previousOptions: expect.objectContaining({ showPoint: true }),
      currentOptions: expect.objectContaining({ showPoint: false })
    });
  });
});

describe('compat: draw and created', () => {
  it('draw handlers get live Svg wrappers and their changes stay', async () => {
    const element = sized();
    const chart = new LineChart(
      element,
      { series: [[1, 2]] },
      { plugins: [compat] }
    );
    chart.on('draw', (event: { type: string; element: Svg }) => {
      expect(event.element).toBeInstanceOf(Svg);
      expect(event.element.getNode().isConnected).toBe(true);
      if (event.type === 'point') {
        event.element.replace(new Svg('circle', {}, 'dot'));
      }
    });
    await created(chart);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(0);
    expect(element.querySelectorAll('circle.dot')).toHaveLength(2);
  });

  it('animate with the chart eventEmitter emits animation events', async () => {
    const chart = new LineChart(
      sized(),
      { series: [[1, 2]] },
      { plugins: [compat] }
    );
    const begin = vi.fn();
    chart.on('animationBegin', begin);
    chart.on('draw', (event: { type: string; element: Svg }) => {
      if (event.type === 'line') {
        event.element.animate(
          { d: { dur: 100, from: 'M0,0', to: 'M1,1' } },
          false,
          (chart as unknown as { eventEmitter: never }).eventEmitter
        );
      }
    });
    await created(chart);
    const animate = document.querySelector('animate')!;
    animate.dispatchEvent(new Event('beginEvent'));
    expect(begin).toHaveBeenCalledTimes(1);
  });

  it('throws with a non-DOM renderer', async () => {
    const { chart } = await import('../chart/chart');
    expect(() =>
      chart(sized(), {
        data: { series: [] },
        layers: [],
        renderer: { render: () => ({}) },
        plugins: [compat]
      })
    ).toThrow('the compat plugin requires the DOM renderer');
  });
});

describe('compat: 1.x plugins', () => {
  it('the class runs 1.x plugin functions with itself when compat is listed', async () => {
    const element = sized();
    let received: unknown;
    const tooltip = vi.fn((chart: LineChart, options: { cls: string }) => {
      received = chart;
      const tip = document.createElement('div');
      tip.className = options.cls;
      (chart as unknown as { container: Element }).container.appendChild(tip);
      chart.on('draw', () => undefined);
    });
    const chart = new LineChart(
      element,
      { series: [[1]] },
      {
        plugins: [compat, [tooltip, { cls: 'tip' }] as never]
      }
    );
    await created(chart);
    expect(received).toBe(chart);
    expect(element.querySelector('.tip')).not.toBeNull();
  });

  it('the class skips 1.x plugin functions without compat, with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const plugin = vi.fn();
    const chart = new LineChart(
      sized(),
      { series: [[1]] },
      { plugins: [plugin] }
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(plugin).not.toHaveBeenCalled();
    expect(warn.mock.calls.some(([m]) => String(m).includes('compat'))).toBe(
      true
    );
    chart.detach();
  });

  it('fromLegacyPlugin gives 1.x plugins a chart object on lineChart', () => {
    const element = sized();
    const draws: string[] = [];
    let chartObject: Record<string, unknown> | undefined;
    const plugin = (
      chart: Record<string, unknown> & {
        on(e: string, l: (d: { type: string }) => void): unknown;
      }
    ) => {
      chartObject = chart;
      chart.on('draw', data => void draws.push(data.type));
    };
    lineChart(
      element,
      { series: [[1, 2]] },
      { plugins: [fromLegacyPlugin(plugin)] }
    );
    expect(chartObject!.container).toBe(element);
    expect(chartObject!.svg).toBeInstanceOf(Svg);
    expect((chartObject!.options as { showPoint: boolean }).showPoint).toBe(
      true
    );
    expect(draws).toContain('point');
    expect(draws).toContain('line');
  });

  it('the chart object updates and detaches like 1.x', () => {
    const element = sized();
    let chartObject:
      | { update(d?: unknown, o?: unknown, override?: boolean): unknown }
      | undefined;
    lineChart(
      element,
      { series: [[1, 2]] },
      {
        plugins: [fromLegacyPlugin(chart => void (chartObject = chart))]
      }
    );
    chartObject!.update(undefined, { showPoint: false });
    expect(element.querySelectorAll('.ct-point')).toHaveLength(0);
  });

  it('several converted plugins turn the 1.x events on once', () => {
    const draws = vi.fn();
    const a = (chart: { on(e: string, l: () => void): unknown }) =>
      void chart.on('created', draws);
    const b = () => undefined;
    lineChart(
      sized(),
      { series: [[1]] },
      {
        plugins: [compat, fromLegacyPlugin(a), fromLegacyPlugin(b)]
      }
    );
    expect(draws).toHaveBeenCalledTimes(1);
  });
});
