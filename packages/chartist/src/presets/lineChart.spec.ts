import type { PhaseEvents } from '../pipeline/types';
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
