import {
  autoScaleAxis,
  axisLabels,
  cartesianAxes,
  chart,
  container,
  line,
  LineChart,
  lineChart,
  responsive,
  stepAxis,
  toScene
} from 'chartist';
import { compat } from 'chartist/compat';
import { JSDOM } from 'jsdom';
import { created, container as element } from './fixture.ts';

const NARROW = '(width < 400px)';
const data = { labels: ['a', 'b'], series: [[1, 2]] };

/** A fake matchContainer() with change events, like the polyfill. */
function fakeMatchContainer() {
  const state = new Map<string, boolean>();
  const lists = new Set<EventTarget & { query: string }>();
  const proto = Element.prototype as unknown as {
    matchContainer?: (query: string) => unknown;
  };
  proto.matchContainer = (query: string) => {
    const list = Object.defineProperties(new EventTarget(), {
      query: { value: query },
      matches: { get: () => state.get(query) ?? false }
    }) as EventTarget & { query: string };
    lists.add(list);
    return list;
  };
  return {
    set(query: string, matches: boolean) {
      state.set(query, matches);
      lists.forEach(list => {
        if (list.query === query) {
          list.dispatchEvent(new Event('change'));
        }
      });
    },
    uninstall: () => delete proto.matchContainer
  };
}

describe('container conditions (v2)', () => {
  test('a container breakpoint applies, and crossing it re-renders', () => {
    const fake = fakeMatchContainer();
    try {
      fake.set(NARROW, true);
      const el = element();
      const events: unknown[] = [];
      const chartHandle = lineChart(el, data, { width: 300, height: 200 }, [
        [container(NARROW), { showPoint: false }]
      ]);
      chartHandle.on('responsive', payload => void events.push(payload));
      expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
      fake.set(NARROW, false);
      expect(el.querySelectorAll('.ct-point')).toHaveLength(2);
      expect(events).toHaveLength(1);
    } finally {
      fake.uninstall();
    }
  });

  test('mixed entries merge in order', () => {
    const fake = fakeMatchContainer();
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === '(min-width: 1px)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    })) as unknown as typeof window.matchMedia;
    try {
      fake.set(NARROW, true);
      const el = element();
      lineChart(el, data, { width: 300, height: 200 }, [
        ['(min-width: 1px)', { showArea: true }],
        [container(NARROW), { showArea: false }]
      ]);
      expect(el.querySelector('.ct-area')).toBeNull();
    } finally {
      window.matchMedia = original;
      fake.uninstall();
    }
  });

  test('without matchContainer(): one warning, base options', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const el = element();
      lineChart(el, data, { width: 300, height: 200 }, [
        [container(NARROW), { showPoint: false }]
      ]);
      lineChart(element(), data, { width: 300, height: 200 }, [
        [container(NARROW), { showPoint: false }]
      ]);
      expect(el.querySelectorAll('.ct-point')).toHaveLength(2);
      const calls = warn.mock.calls.filter(([message]) =>
        String(message).includes('matchContainer')
      );
      // Once per page; an earlier test file may have warned already.
      expect(calls.length).toBeLessThanOrEqual(1);
      if (calls.length) {
        expect(String(calls[0][0])).toContain('match-container');
      }
    } finally {
      warn.mockRestore();
    }
  });

  test('chart() takes responsive overrides; toScene ignores container entries', () => {
    const fake = fakeMatchContainer();
    try {
      fake.set(NARROW, true);
      const config = {
        data,
        axes: cartesianAxes([
          {
            id: 'x',
            side: 'bottom' as const,
            type: stepAxis(),
            ticks: ['a', 'b']
          },
          { id: 'y', side: 'left' as const, type: autoScaleAxis() }
        ]),
        layers: [line(), axisLabels()],
        responsive: responsive([
          [container(NARROW), { labels: 'svg' as const }]
        ])
      };
      const el = element();
      chart(el, { ...config, width: 300, height: 200 });
      expect(el.querySelector('text.ct-label')).not.toBeNull();
      fake.set(NARROW, false);
      expect(el.querySelector('text.ct-label')).toBeNull();

      const scene = toScene(
        { ...config, labels: 'html' },
        { width: 300, height: 200 }
      );
      expect(JSON.stringify(scene)).toContain('foreignObject');
    } finally {
      fake.uninstall();
    }
  });
});

describe('media queries in the container window (v2)', () => {
  const QUERY = '(max-width: 640px)';

  /**
   * A container in another window (like an iframe's) whose media query
   * matches, while the main window's doesn't (the setup's mock).
   */
  function frameContainer() {
    const { window: frame } = new JSDOM('<div></div>');
    frame.matchMedia = ((query: string) => ({
      media: query,
      matches: query === QUERY,
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    })) as unknown as typeof frame.matchMedia;
    expect(window.matchMedia(QUERY).matches).toBe(false);
    return frame.document.querySelector('div')!;
  }

  test('lineChart uses the override of the container window (#1492)', () => {
    const el = frameContainer();
    lineChart(el, data, { width: 300, height: 200 }, [
      [QUERY, { showPoint: false }]
    ]).detach();
    expect(el.querySelector('.ct-line')).not.toBeNull();
    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
  });

  test('a 1.x class uses the override of the container window (#1492)', async () => {
    const el = frameContainer();
    const legacy = new LineChart(
      el,
      data,
      { width: 300, height: 200, plugins: [compat] },
      [[QUERY, { showPoint: false }]]
    );
    await created(legacy);
    expect(el.querySelector('.ct-line')).not.toBeNull();
    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
  });
});
