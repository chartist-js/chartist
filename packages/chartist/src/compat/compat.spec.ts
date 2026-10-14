import { BarChart } from '../charts/BarChart/BarChart';
import { LineChart } from '../charts/LineChart/LineChart';
import { PieChart } from '../charts/PieChart/PieChart';
import { chart } from '../chart/chart';
import { barChart } from '../presets/barChart';
import { lineChart } from '../presets/lineChart';
import { pieChart } from '../presets/pieChart';
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

  it('elements of draw events animate with the chart by default (#1489)', () => {
    vi.useFakeTimers();
    try {
      const chart = lineChart(
        sized(),
        { series: [[1, 2]] },
        { plugins: [compat] }
      );
      const begin = vi.fn();
      const end = vi.fn();
      chart.on('animationBegin', begin).on('animationEnd', end);
      chart.on('draw', event => {
        if (event.type === 'line') {
          event.element.animate({ d: { dur: 100, from: 'M0,0', to: 'M1,1' } });
        }
      });
      chart.on('created', event => {
        // Elements created later inside the chart animate with it too.
        event.svg
          .elem('g')
          .elem('rect')
          .animate({ x: { dur: 100, from: 0, to: 10 } });
      });
      chart.update({});
      const [line, rect] = Array.from(document.querySelectorAll('animate'));
      line.dispatchEvent(new Event('beginEvent'));
      line.dispatchEvent(new Event('endEvent'));
      rect.dispatchEvent(new Event('beginEvent'));
      expect(begin).toHaveBeenCalledTimes(2);
      expect(begin.mock.calls[0][0]).toMatchObject({
        animate: line,
        params: { dur: 100, from: 'M0,0', to: 'M1,1' }
      });
      expect(begin.mock.calls[0][0].element).toBeInstanceOf(Svg);
      expect(end).toHaveBeenCalledTimes(1);
      vi.runAllTimers();
    } finally {
      vi.useRealTimers();
    }
  });

  it('elements of a 1.x class animate with the chart by default', async () => {
    const chart = new LineChart(
      sized(),
      { series: [[1, 2]] },
      { plugins: [compat] }
    );
    const begin = vi.fn();
    chart.on('animationBegin', begin);
    chart.on('draw', (event: { type: string; element: Svg }) => {
      if (event.type === 'point') {
        event.element.animate({ y1: { dur: 100, from: 0, to: 10 } }, false);
      }
    });
    await created(chart);
    document
      .querySelectorAll('animate')
      .forEach(animate => animate.dispatchEvent(new Event('beginEvent')));
    expect(begin).toHaveBeenCalledTimes(2);
  });

  it('without compat, animations report to no chart', () => {
    const element = sized();
    lineChart(element, { series: [[1]] });
    const point = new Svg(element.querySelector('.ct-point')!);
    point.animate({ y1: { dur: 100, from: 0, to: 10 } }, false);
    expect(() =>
      element.querySelector('animate')!.dispatchEvent(new Event('beginEvent'))
    ).not.toThrow();
  });

  it('off(name) on a 1.x class removes its listeners, not those of plugins', async () => {
    const pluginDraws = vi.fn();
    const plugin = (chart: LineChart) => void chart.on('draw', pluginDraws);
    const chart = new LineChart(
      sized(),
      { series: [[1, 2]] },
      { plugins: [compat, plugin as never] }
    );
    const draws = vi.fn();
    chart.on('draw', draws);
    await created(chart);
    expect(draws).toHaveBeenCalled();
    const before = pluginDraws.mock.calls.length;
    draws.mockClear();
    chart.off('draw');
    chart.update();
    expect(draws).not.toHaveBeenCalled();
    expect(pluginDraws.mock.calls.length).toBe(before * 2);
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

describe('compat: the chart object of converted plugins', () => {
  type Seen = Record<string, unknown>;
  /** Converts a plugin that records its chart object at install. */
  function recorder(read: (chart: Seen) => void = () => undefined) {
    const seen: { chart?: Seen } = {};
    const plugin = fromLegacyPlugin((chart: Seen) => {
      seen.chart = chart;
      read(chart);
    });
    return { seen, plugin };
  }

  it('is an instance of the 1.x class of its preset', () => {
    const line = recorder();
    lineChart(sized(), { series: [[1, 2]] }, { plugins: [line.plugin] });
    expect(line.seen.chart).toBeInstanceOf(LineChart);
    expect(line.seen.chart).not.toBeInstanceOf(BarChart);

    const bar = recorder();
    barChart(sized(), { series: [[1, 2]] }, { plugins: [bar.plugin] });
    expect(bar.seen.chart).toBeInstanceOf(BarChart);
    expect(bar.seen.chart).not.toBeInstanceOf(LineChart);

    const pie = recorder();
    pieChart(sized(), { series: [1, 2] }, { plugins: [pie.plugin] });
    expect(pie.seen.chart).toBeInstanceOf(PieChart);
  });

  it('is a plain object for chart() compositions', () => {
    const { seen, plugin } = recorder();
    chart(sized(), { data: { series: [[1]] }, layers: [], plugins: [plugin] });
    expect(Object.getPrototypeOf(seen.chart)).toBe(Object.prototype);
    expect(seen.chart!.container).toBeInstanceOf(Element);
  });

  it('has the data and the options with the 1.x defaults at install', () => {
    const data = { series: [[1, 2]] };
    let atInstall: { series?: unknown; className?: string } = {};
    const { plugin } = recorder(chartObject => {
      atInstall = {
        series: (chartObject.data as typeof data).series,
        className: (chartObject.options as { classNames: { series: string } })
          .classNames.series
      };
    });
    lineChart(sized(), data, { plugins: [plugin] });
    expect(atInstall).toEqual({ series: [[1, 2]], className: 'ct-series' });
  });

  it('getCurrentOptions() gives the options after the responsive options', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === 'print',
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    }));
    const { seen, plugin } = recorder();
    lineChart(
      sized(),
      { series: [[1]] },
      { showPoint: true, plugins: [plugin] },
      [['print', { showPoint: false }]]
    );
    const provider = seen.chart!.optionsProvider as {
      getCurrentOptions(): { showPoint: boolean };
    };
    expect(provider.getCurrentOptions().showPoint).toBe(false);
  });

  it('keeps the 1.x fields and methods as its own', () => {
    const { seen, plugin } = recorder();
    lineChart(sized(), { series: [[1]] }, { plugins: [plugin] });
    for (const key of [
      'container',
      'data',
      'options',
      'svg',
      'eventEmitter',
      'optionsProvider',
      'on',
      'off',
      'update',
      'detach'
    ]) {
      expect(Object.hasOwn(seen.chart!, key), key).toBe(true);
    }
  });

  it('the 1.x classes give plugins an options provider too', async () => {
    let current: unknown;
    const plugin = (chartObject: {
      optionsProvider: { getCurrentOptions(): unknown };
      on(event: string, listener: () => void): unknown;
    }) =>
      chartObject.on('created', () => {
        current = chartObject.optionsProvider.getCurrentOptions();
      });
    const lineChartClass = new LineChart(
      sized(),
      { series: [[1]] },
      { showArea: true, plugins: [compat, plugin as never] }
    );
    await created(lineChartClass);
    expect(current).toMatchObject({ showArea: true, showPoint: true });
  });
});

describe('compat: chart.svg', () => {
  const data = {
    series: [
      [1, 2],
      [3, 4]
    ]
  };
  interface SvgChart {
    svg: Svg;
    on(event: string, listener: () => void): unknown;
  }
  const seriesCount = (svg: Svg) =>
    (svg.querySelectorAll('.ct-series') as unknown as { svgElements: Svg[] })
      .svgElements.length;
  /** A plugin that counts the series groups from `draw` and `created`. */
  function counting() {
    const counts = { draw: [] as number[], created: [] as number[] };
    const plugin = (chartObject: SvgChart) => {
      for (const event of ['draw', 'created'] as const) {
        chartObject.on(event, () =>
          counts[event].push(seriesCount(chartObject.svg))
        );
      }
    };
    return { counts, plugin };
  }

  it('is the root as Svg before the first draw event (functional API)', () => {
    const { counts, plugin } = counting();
    lineChart(sized(), data, { plugins: [fromLegacyPlugin(plugin)] });
    expect(counts.draw.length).toBeGreaterThan(0);
    expect(new Set(counts.draw)).toEqual(new Set([2]));
    expect(counts.created).toEqual([2]);
  });

  it('is the root as Svg before the first draw event (1.x classes)', async () => {
    const { counts, plugin } = counting();
    const lineChartClass = new LineChart(sized(), data, {
      plugins: [compat, plugin as never]
    });
    await created(lineChartClass);
    expect(counts.draw.length).toBeGreaterThan(0);
    expect(new Set(counts.draw)).toEqual(new Set([2]));
    expect(counts.created).toEqual([2]);
  });
});

describe('compat: bounds in created', () => {
  interface Created {
    bounds: { min: number; max: number; step: number; values: number[] };
    axisX: { bounds?: unknown };
    axisY: { bounds?: unknown };
    chartRect: { y1: number; height(): number };
  }
  function createdOf(make: (plugins: never) => void) {
    let payload: Created | undefined;
    make([
      fromLegacyPlugin(
        (chartObject: { on(e: string, l: (p: Created) => void): unknown }) =>
          chartObject.on('created', p => void (payload = p))
      )
    ] as never);
    return payload!;
  }

  it('has the 0.x bounds of the Y axis on line charts', () => {
    const payload = createdOf(plugins =>
      lineChart(sized(), { series: [[0, 4, 8]] }, { plugins })
    );
    expect(payload.bounds).toMatchObject({ min: 0, max: 8, range: 8 });
    expect(payload.bounds.step).toEqual(expect.any(Number));
    expect(payload.bounds.values).toContain(8);
    expect(payload.bounds).toBe(payload.axisY.bounds);

    // 0.x plugins project values with it, such as a target line at 4.
    const { chartRect, bounds } = payload;
    const y = chartRect.y1 - (chartRect.height() / bounds.max) * 4;
    expect(y).toBeCloseTo(chartRect.y1 - chartRect.height() / 2);
  });

  it('has the value axis bounds on horizontal bar charts', () => {
    const payload = createdOf(plugins =>
      barChart(sized(), { series: [[1, 5]] }, { horizontalBars: true, plugins })
    );
    expect(payload.bounds).toBe(payload.axisX.bounds);
    expect(payload.bounds).toMatchObject({ min: 0, max: 5 });
  });
});
