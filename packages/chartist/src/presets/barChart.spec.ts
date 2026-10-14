import { barChart } from './barChart';

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('presets/barChart', () => {
  it('renders the 1.x structure with the horizontal class', () => {
    const element = sized();
    barChart(
      element,
      { labels: ['a', 'b'], series: [[1, 2]] },
      { horizontalBars: true }
    );
    const svg = element.querySelector('svg')!;
    expect(svg.getAttribute('class')).toBe('ct-chart-bar ct-horizontal-bars');
    expect(Array.from(svg.children, c => c.getAttribute('class'))).toEqual([
      'ct-grids',
      null,
      'ct-labels'
    ]);
    expect(element.querySelectorAll('line.ct-bar')).toHaveLength(2);
  });

  it('grids and labels of the label axis come first', () => {
    const element = sized();
    barChart(
      element,
      { labels: ['a', 'b'], series: [[1, 2]] },
      { horizontalBars: true }
    );
    const grids = Array.from(element.querySelectorAll('.ct-grids line'), l =>
      l.getAttribute('class')
    );
    expect(grids[0]).toBe('ct-grid ct-vertical');
    expect(grids.at(-1)).toBe('ct-grid ct-horizontal');
  });

  it("the value axis's own low and high win over the reference value (#1476)", () => {
    const valueLabels = (options: Parameters<typeof barChart>[2]) => {
      const element = sized();
      barChart(element, { series: [[12, 15, 18]] }, options);
      return Array.from(
        element.querySelectorAll('.ct-label.ct-vertical'),
        label => Number(label.textContent)
      );
    };
    expect(valueLabels({})[0]).toBe(0);
    expect(valueLabels({ axisY: { low: 10 } })[0]).toBe(10);
    const element = sized();
    barChart(
      element,
      { series: [[12, 15, 18]] },
      { horizontalBars: true, axisX: { low: 10 } }
    );
    expect(
      Number(element.querySelector('.ct-label.ct-horizontal')!.textContent)
    ).toBe(10);
  });

  // As 1.x: `overlap` keeps the axis at the sums, `true` fits the values.
  it.each([
    ['accumulate', true],
    ['overlap', true],
    [true, false]
  ] as const)('stackMode %s fits the sums: %s', (stackMode, sums) => {
    const element = sized();
    barChart(
      element,
      {
        series: [
          [5, 5],
          [4, 4]
        ]
      },
      { stackBars: true, stackMode, axisY: { onlyInteger: true } }
    );
    const top = Math.max(
      ...Array.from(element.querySelectorAll('.ct-label.ct-vertical'), label =>
        Number(label.textContent)
      )
    );
    // The values reach 5, the sums 9.
    expect(top > 5).toBe(sums);
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
    barChart(element, { series: [[1, 2]] }, {}, [
      ['print', { horizontalBars: true }]
    ]);
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-bar'
    );
    matches = true;
    listeners.forEach(fn => fn());
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-bar ct-horizontal-bars'
    );
  });

  it('setOptions changes the options and redraws', () => {
    const element = sized();
    const mount = vi.fn();
    const chart = barChart(element, { series: [[1, 2]] }, { on: { mount } });
    expect(mount).toHaveBeenCalledTimes(1);
    chart.setOptions({ horizontalBars: true });
    expect(element.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-bar ct-horizontal-bars'
    );
    expect(mount).toHaveBeenCalledTimes(2);
  });
});
