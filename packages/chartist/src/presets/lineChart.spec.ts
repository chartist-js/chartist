import type { Layer, PhaseEvents } from '../pipeline/types';
import { findAll } from '../scene/tree';
import { lineChart } from './lineChart';

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

/** matchMedia with controllable queries; returns a setter. */
function mockMedia() {
  const listeners = new Map<string, Set<() => void>>();
  const matching = new Set<string>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matching.has(query);
    },
    addEventListener: (_: string, fn: () => void) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(fn));
    },
    removeEventListener: (_: string, fn: () => void) => {
      listeners.get(query)?.delete(fn);
    }
  }));
  return {
    set(query: string, matches: boolean) {
      if (matches) {
        matching.add(query);
      } else {
        matching.delete(query);
      }
      listeners.get(query)?.forEach(fn => fn());
    },
    count: (query: string) => listeners.get(query)?.size ?? 0
  };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('presets/lineChart', () => {
  it('renders the 1.x structure synchronously', () => {
    const element = sized();
    lineChart(element, { labels: ['a', 'b'], series: [[1, 2]] });
    const svg = element.querySelector('svg')!;
    expect(svg.getAttribute('class')).toBe('ct-chart-line');
    expect(svg.getAttribute('style')).toBe('width: 100%; height: 100%;');
    expect(Array.from(svg.children, c => c.getAttribute('class'))).toEqual([
      'ct-grids',
      null,
      'ct-labels'
    ]);
  });

  it('accepts v2 axis factories next to 1.x classes', async () => {
    const { fixedScaleAxis } = await import('../scales/factories');
    const { FixedScaleAxis } = await import('../axes/FixedScaleAxis');
    const render = (type: unknown) => {
      const element = sized();
      lineChart(
        element,
        { series: [[1, 5, 9]] },
        {
          axisY: { type: type as never, ticks: [0, 5, 10] }
        }
      );
      return element.innerHTML;
    };
    expect(render(fixedScaleAxis())).toBe(render(FixedScaleAxis));
  });

  it('applies matching responsive options and re-renders on media changes', () => {
    const media = mockMedia();
    const element = sized();
    const chart = lineChart(element, { series: [[1, 2]] }, {}, [
      ['(max-width: 600px)', { showPoint: false }]
    ]);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(2);
    media.set('(max-width: 600px)', true);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(0);
    media.set('(max-width: 600px)', false);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(2);

    expect(media.count('(max-width: 600px)')).toBe(1);
    chart.destroy();
    expect(media.count('(max-width: 600px)')).toBe(0);
    expect(element.querySelector('svg')).toBeNull();
  });

  it('responsive options change the extra layers, list by list', async () => {
    const { node } = await import('../scene/node');
    const marker = (className: string): Layer => ({
      type: 'marker',
      coordinates: ['cartesian'],
      compose: () => [node('g', {}, className)]
    });
    const media = mockMedia();
    const element = sized();
    const children = () =>
      Array.from(
        element.querySelector('svg')!.children,
        c => c.getAttribute('class') ?? ''
      );
    lineChart(
      element,
      { series: [[1, 2]] },
      { layers: { below: [marker('band')] } },
      [['(min-width: 600px)', { layers: { above: [marker('target')] } }]]
    );
    expect(children()).toEqual(['ct-grids', 'band', '', 'ct-labels']);
    media.set('(min-width: 600px)', true);
    expect(children()).toEqual(['ct-grids', 'band', '', 'target', 'ct-labels']);
    media.set('(min-width: 600px)', false);
    expect(children()).toEqual(['ct-grids', 'band', '', 'ct-labels']);
  });

  it('handle methods return the preset handle', () => {
    const chart = lineChart(sized(), { series: [[1]] });
    const listener = vi.fn();
    expect(chart.on('scene', listener)).toBe(chart);
    expect(chart.update({})).toBe(chart);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(chart.off('scene', listener)).toBe(chart);
  });

  it('nodes in the scene have the line roles', () => {
    const element = sized();
    let scene: PhaseEvents['scene']['scene'] | undefined;
    const chart = lineChart(element, { labels: ['a', 'b'], series: [[1, 2]] });
    chart.on('scene', payload => void (scene = payload.scene));
    chart.update({});
    for (const role of ['grid', 'label', 'series', 'line', 'point'] as const) {
      expect(findAll(scene!, { role }).length, role).toBeGreaterThan(0);
    }
  });
});

describe('presets/lineChart handle', () => {
  it('setOptions extends the current options and redraws', () => {
    const element = sized();
    const chart = lineChart(
      element,
      { series: [[1, 2]] },
      { showPoint: false }
    );
    expect(element.querySelectorAll('.ct-area')).toHaveLength(0);
    expect(chart.setOptions({ showArea: true })).toBe(chart);
    expect(element.querySelectorAll('.ct-area')).toHaveLength(1);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(0);
  });

  it('setOptions with replace starts from the defaults', () => {
    const element = sized();
    const chart = lineChart(
      element,
      { series: [[1, 2]] },
      { showPoint: false }
    );
    chart.setOptions({ showArea: true }, { replace: true });
    expect(element.querySelectorAll('.ct-area')).toHaveLength(1);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(2);
  });

  it('setOptions keeps the matching responsive options on top', () => {
    const media = mockMedia();
    media.set('(max-width: 600px)', true);
    const element = sized();
    const chart = lineChart(element, { series: [[1, 2]] }, {}, [
      ['(max-width: 600px)', { showPoint: false }]
    ]);
    chart.setOptions({ showArea: true, showPoint: true });
    expect(element.querySelectorAll('.ct-area')).toHaveLength(1);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(0);
    media.set('(max-width: 600px)', false);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(2);
    expect(element.querySelectorAll('.ct-area')).toHaveLength(1);
  });

  it('keeps data given to update when a breakpoint changes (#1472)', () => {
    const media = mockMedia();
    const element = sized();
    let preset: { data: unknown } | undefined;
    const chart = lineChart(
      element,
      { series: [[1, 2, 3]] },
      {
        on: {
          resolve: ({ config }) =>
            void (preset = config.preset as typeof preset)
        }
      },
      [['(max-width: 600px)', { showLine: false }]]
    );
    const next = { series: [[5, 4, 3, 2]] };
    chart.update({ data: next });
    expect(element.querySelectorAll('.ct-point')).toHaveLength(4);
    media.set('(max-width: 600px)', true);
    expect(element.querySelectorAll('.ct-line')).toHaveLength(0);
    expect(element.querySelectorAll('.ct-point')).toHaveLength(4);
    expect(preset?.data).toBe(next);
    // And after setOptions, which rebuilds the config from the preset.
    chart.setOptions({ showArea: true });
    expect(element.querySelectorAll('.ct-point')).toHaveLength(4);
  });

  it('applies a top-level referenceValue to the default Y axis', () => {
    const lowestLabel = (options: Parameters<typeof lineChart>[2]) => {
      const element = sized();
      lineChart(element, { series: [[5, 8, 6]] }, options);
      return Number(
        element.querySelectorAll('.ct-label.ct-vertical')[0].textContent
      );
    };
    expect(lowestLabel({})).toBe(5);
    expect(lowestLabel({ referenceValue: 0 })).toBe(0);
    expect(
      lowestLabel({ referenceValue: 0, axisY: { referenceValue: 4 } })
    ).toBe(4);
  });

  it('on in the options sees the first render', () => {
    const element = sized();
    const mount = vi.fn();
    const all = vi.fn();
    lineChart(element, { series: [[1, 2]] }, { on: { mount, '*': all } });
    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0][0].output.svg).toBe(
      element.querySelector('svg')
    );
    expect(all).toHaveBeenCalledWith('mount', expect.anything());
  });

  it('off(name) removes the listeners of on in the options, not plugins', () => {
    const element = sized();
    const fromOptions = vi.fn();
    const fromPlugin = vi.fn();
    const chart = lineChart(
      element,
      { series: [[1, 2]] },
      {
        on: { mount: fromOptions },
        plugins: [
          {
            name: 'plugin',
            install: handle => void handle.on('mount', fromPlugin)
          }
        ]
      }
    );
    chart.off('mount');
    chart.update({});
    expect(fromOptions).toHaveBeenCalledTimes(1);
    expect(fromPlugin).toHaveBeenCalledTimes(2);
  });
});

describe('presets/createLineChart (controller)', () => {
  it('setOptions extends the defaults, or the current options with override', async () => {
    const { createLineChart } = await import('./lineChart');
    const element = sized();
    const controller = createLineChart(
      element,
      { series: [[1, 2]] },
      { showPoint: false }
    );

    controller.setOptions({ showLine: false }, true);
    controller.render();
    expect(element.querySelectorAll('.ct-point')).toHaveLength(0);
    expect(element.querySelectorAll('.ct-line')).toHaveLength(0);

    controller.setOptions({ showArea: true });
    controller.render();
    expect(element.querySelectorAll('.ct-point')).toHaveLength(2);
    expect(element.querySelectorAll('.ct-line')).toHaveLength(1);
    expect(controller.options().showArea).toBe(true);
  });

  it('setData replaces the data and defaults missing labels and series', async () => {
    const { createLineChart } = await import('./lineChart');
    const element = sized();
    const controller = createLineChart(element, { series: [[1]] });
    const next = { series: [[1, 2, 3]] } as {
      series: number[][];
      labels?: string[];
    };
    controller.setData(next);
    controller.render();
    expect(element.querySelectorAll('.ct-point')).toHaveLength(3);
    expect(next.labels).toEqual([]);
    expect(controller.data()).toBe(next);
  });

  it('passes its state to plugins and emits responsive on media changes', async () => {
    const { createLineChart } = await import('./lineChart');
    const media = mockMedia();
    const element = sized();
    const events: unknown[] = [];
    let preset: { options: { showPoint?: boolean } } | undefined;
    const controller = createLineChart(
      element,
      { series: [[1, 2]] },
      {},
      [['(max-width: 600px)', { showPoint: false }]],
      [
        {
          name: 'probe',
          provides: ['responsive'],
          install(handle) {
            handle.on('resolve', ({ config }) => {
              preset = config.preset as typeof preset;
            });
            handle.on('responsive', payload => void events.push(payload));
          }
        }
      ]
    );
    expect(preset?.options.showPoint).toBe(true);
    media.set('(max-width: 600px)', true);
    expect(events).toEqual([
      {
        previousOptions: expect.objectContaining({ showPoint: true }),
        currentOptions: expect.objectContaining({ showPoint: false })
      }
    ]);
    expect(preset?.options.showPoint).toBe(false);

    controller.handle.detach();
    expect(media.count('(max-width: 600px)')).toBe(0);
    expect(element.querySelector('svg')).not.toBeNull();
  });
});
