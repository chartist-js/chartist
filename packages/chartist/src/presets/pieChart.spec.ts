import { pieChart } from './pieChart';

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 300 },
    clientHeight: { get: () => 300 }
  });
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('presets/pieChart', () => {
  it('renders the 1.x pie and donut structure', () => {
    const pieElement = sized();
    pieChart(pieElement, { labels: ['a', 'b'], series: [1, 2] });
    const svg = pieElement.querySelector('svg')!;
    expect(svg.getAttribute('class')).toBe('ct-chart-pie');
    expect(Array.from(svg.children, c => c.getAttribute('class'))).toEqual([
      'ct-series ct-series-a',
      'ct-series ct-series-b',
      null
    ]);
    expect(
      Array.from(svg.querySelectorAll('text.ct-label'), t => t.textContent)
    ).toEqual(['a', 'b']);

    const donutElement = sized();
    pieChart(donutElement, { series: [1, 2] }, { donut: true });
    expect(donutElement.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-donut'
    );
    expect(donutElement.querySelectorAll('path.ct-slice-donut')).toHaveLength(
      2
    );
  });

  it('switches responsive options', () => {
    let matches = false;
    const listeners: (() => void)[] = [];
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: () => undefined
    }));
    const element = sized();
    pieChart(element, { series: [1, 2] }, {}, [['print', { donut: true }]]);
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-pie'
    );
    matches = true;
    listeners.forEach(fn => fn());
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-donut'
    );
  });

  it('setOptions changes the options and redraws', () => {
    const element = sized();
    const mount = vi.fn();
    const chart = pieChart(element, { series: [1, 2] }, { on: { mount } });
    expect(mount).toHaveBeenCalledTimes(1);
    chart.setOptions({ donut: true });
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-donut'
    );
    chart.setOptions({ showLabel: false }, { replace: true });
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-pie'
    );
    expect(element.querySelectorAll('.ct-label')).toHaveLength(0);
  });

  it('takes an object chartPadding over its default (#842)', () => {
    const element = sized();
    pieChart(element, { series: [1, 2] }, { chartPadding: { top: 20 } });
    // 20 px at the top and the pie's 5 px elsewhere: the 290 x 275 area
    // has its centre 7.5 px below the chart's centre.
    for (const slice of Array.from(
      element.querySelectorAll('path.ct-slice-pie')
    )) {
      expect(slice.getAttribute('d')).toMatch(/L150,157\.5Z$/);
    }
  });

  it('merges a responsive object chartPadding over a number (#903)', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    }));
    const element = sized();
    pieChart(element, { series: [1, 2] }, { chartPadding: 10 }, [
      ['screen', { chartPadding: { top: 20 } }]
    ]);
    // The object replaces the number, so only its top is taken from it.
    for (const slice of Array.from(
      element.querySelectorAll('path.ct-slice-pie')
    )) {
      expect(slice.getAttribute('d')).toMatch(/,157\.5Z$/);
    }
  });
});
