// @vitest-environment jsdom
import {
  lineChart,
  lineChartConfig,
  pieChart,
  type PhaseEvents
} from 'chartist';
import { liveDomRenderer } from 'chartist/live';
import { renderForHydration } from 'chartist/server';
import { legend } from './legend.ts';

const data = {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [
    { name: 'Tea', data: [5, 6, 4] },
    { name: 'Coffee', data: [8, 9, 7] }
  ]
};

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

const entries = (element: Element) =>
  Array.from(element.querySelectorAll('g.ct-legend-item'), item => ({
    name: item.querySelector('text.ct-legend-label')?.textContent,
    classes: item.getAttribute('class')
  }));

describe('legend in the browser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('follows the names and series of update()', () => {
    const element = container();
    const chart = lineChart(element, data, {
      layers: { above: [legend()] }
    });
    expect(entries(element)).toEqual([
      { name: 'Tea', classes: 'ct-legend-item ct-series-a' },
      { name: 'Coffee', classes: 'ct-legend-item ct-series-b' }
    ]);
    chart.update({
      data: {
        labels: data.labels,
        series: [
          { name: 'Green tea', data: [5, 6, 4] },
          { name: 'Coffee', data: [8, 9, 7] },
          { name: 'Cocoa', data: [2, 1, 3] }
        ]
      }
    });
    expect(entries(element)).toEqual([
      { name: 'Green tea', classes: 'ct-legend-item ct-series-a' },
      { name: 'Coffee', classes: 'ct-legend-item ct-series-b' },
      { name: 'Cocoa', classes: 'ct-legend-item ct-series-c' }
    ]);
  });

  it('keeps the elements of the series that stay in a live chart', () => {
    const element = container();
    const chart = lineChart(element, data, {
      layers: { above: [legend()] },
      renderer: liveDomRenderer()
    });
    const [tea, coffee] = element.querySelectorAll('g.ct-legend-item');
    chart.update({
      data: {
        labels: data.labels,
        series: [{ name: 'Black tea', data: [5, 6, 4] }, data.series[1]]
      }
    });
    const now = element.querySelectorAll('g.ct-legend-item');
    expect(now[0]).toBe(tea);
    expect(now[1]).toBe(coffee);
    expect(now[0].textContent).toBe('Black tea');
  });

  it('moves to another side with a responsive override', () => {
    const match = mockMedia();
    const element = container();
    lineChart(element, data, { layers: { above: [legend()] } }, [
      [
        '(max-width: 400px)',
        { layers: { above: [legend({ side: 'bottom' })] } }
      ]
    ]);
    const sides = () =>
      element.querySelector('g.ct-legend')?.getAttribute('class');
    expect(sides()).toBe('ct-legend ct-horizontal ct-start');
    match('(max-width: 400px)');
    expect(sides()).toBe('ct-legend ct-horizontal ct-end');
  });

  it('lists the slices of a pie chart', () => {
    const element = container();
    pieChart(
      element,
      { labels: ['Search', 'Direct'], series: [5, 3] },
      { layers: { above: [legend({ side: 'right' })] } }
    );
    expect(entries(element).map(entry => entry.name)).toEqual([
      'Search',
      'Direct'
    ]);
  });

  it('hydrates server markup without repairs', () => {
    const options = { layers: { above: [legend({ side: 'bottom' })] } };
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
    expect(entries(element).map(entry => entry.name)).toEqual([
      'Tea',
      'Coffee'
    ]);
  });
});
