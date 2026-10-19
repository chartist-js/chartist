// @vitest-environment jsdom
import { lineChart, lineChartConfig, type PhaseEvents } from 'chartist';
import { liveDomRenderer } from 'chartist/live';
import { renderForHydration } from 'chartist/server';
import { axisTitle } from './axisTitle.ts';

const data = { labels: ['Mon', 'Tue', 'Wed'], series: [[12, 9, 7]] };

/** A container with a fixed size (jsdom has no layout). */
function container(markup = '') {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 500 },
    clientHeight: { get: () => 300 }
  });
  element.innerHTML = markup;
  document.body.appendChild(element);
  return element;
}

/** matchMedia with queries that can be switched on; returns the switch. */
function mockMedia() {
  const listeners = new Map<string, Set<() => void>>();
  const matching = new Set<string>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matching.has(query);
    },
    addEventListener: (_: string, listener: () => void) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(listener));
    },
    removeEventListener: (_: string, listener: () => void) => {
      listeners.get(query)?.delete(listener);
    }
  }));
  return (query: string) => {
    matching.add(query);
    listeners.get(query)?.forEach(listener => listener());
  };
}

const titles = (element: Element) =>
  Array.from(
    element.querySelectorAll('text.ct-axis-title'),
    title => title.textContent
  );

describe('axisTitle in the browser', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('takes a shorter title from a responsive override', () => {
    const match = mockMedia();
    const element = container();
    lineChart(
      element,
      data,
      { layers: { above: [axisTitle({ axis: 'y', text: 'Visits per day' })] } },
      [
        [
          '(max-width: 400px)',
          { layers: { above: [axisTitle({ axis: 'y', text: 'Visits' })] } }
        ]
      ]
    );
    expect(titles(element)).toEqual(['Visits per day']);
    match('(max-width: 400px)');
    expect(titles(element)).toEqual(['Visits']);
  });

  it('hydrates server markup without repairs', () => {
    const options = {
      layers: {
        above: [
          axisTitle({ axis: 'x', text: 'Day' }),
          axisTitle({ axis: 'y', text: 'Visits', align: 'end' as const })
        ]
      }
    };
    const element = container(
      renderForHydration(lineChartConfig(data, options), {
        width: 500,
        height: 300
      })
    );
    const svg = element.querySelector('svg');
    const mounts: PhaseEvents['mount'][] = [];
    lineChart(element, data, {
      ...options,
      renderer: liveDomRenderer(),
      on: { mount: event => void mounts.push(event) }
    });
    expect(element.querySelector('svg')).toBe(svg);
    expect(
      mounts.map(({ cause, hydration }) => ({ cause, hydration }))
    ).toEqual([{ cause: 'hydrate', hydration: { repaired: 0 } }]);
    expect(titles(element)).toEqual(['Day', 'Visits']);
  });
});
