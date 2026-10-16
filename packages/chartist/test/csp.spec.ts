import { LineChart } from '../src/charts/LineChart';
import { compat } from '../src/compat';
import { createSvg } from '../src/core/creation';
import { lineChart } from '../src/presets/lineChart';
import { pieChart } from '../src/presets/pieChart';
import { spyOnStyleAttributes } from './style-spy';

// Charts under a Content Security Policy without 'unsafe-inline' for
// styles: every inline style goes through the CSSOM, never through a
// `style` attribute set by a script. The browser test in
// test/smoke/csp.test.mjs checks the same under a real policy.

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

const data = {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [[1, 5, 3]]
};

let spy: ReturnType<typeof spyOnStyleAttributes>;

beforeEach(() => {
  spy = spyOnStyleAttributes();
});

afterEach(() => {
  spy.restore();
  document.body.innerHTML = '';
});

describe('styles under a Content Security Policy', () => {
  it('sets no style attribute for a line chart with HTML labels', () => {
    const element = sized();
    lineChart(element, data);
    expect(element.querySelector('foreignObject')).not.toBeNull();
    expect(spy.calls).toEqual([]);
  });

  it('sets no style attribute for a donut with donutWidth', () => {
    const element = sized();
    pieChart(element, { series: [1, 2] }, { donut: true, donutWidth: 20 });
    expect(spy.calls).toEqual([]);
  });

  it('keeps the declarations in the style attributes', () => {
    const line = sized();
    lineChart(line, data);
    const svg = line.querySelector('svg')!;
    expect(svg.getAttribute('style')).toBe('width: 100%; height: 100%;');
    const label = line.querySelector('foreignObject')!;
    expect(label.getAttribute('style')).toBe('overflow: visible;');
    expect(label.firstElementChild!.getAttribute('style')).toMatch(
      /^width: \d+px; height: \d+px;$/
    );

    const donut = sized();
    pieChart(donut, { series: [1, 2] }, { donut: true, donutWidth: 20 });
    expect(donut.querySelector('.ct-slice-donut')!.getAttribute('style')).toBe(
      'stroke-width: 20px;'
    );
  });

  it('sets styles of 1.x draw listeners through the CSSOM', async () => {
    const element = sized();
    const lines: Element[] = [];
    await new Promise<void>(resolve => {
      new LineChart(element, data, { plugins: [compat] })
        .on('draw', context => {
          if (context.type === 'line') {
            context.element.attr({ style: 'opacity: 0.5' });
            lines.push(context.element.getNode());
          }
        })
        .on('created', () => resolve());
    });
    expect(spy.calls).toEqual([]);
    expect(lines).toHaveLength(1);
    expect((lines[0] as SVGElement).style.opacity).toBe('0.5');
  });

  it('sets no style attribute with the 1.x helpers', () => {
    const svg = createSvg(sized(), '400px', '200px', 'ct-chart-line');
    expect(svg.attr('style')).toBe('width: 400px; height: 200px;');
    expect(spy.calls).toEqual([]);
  });

  it('sets no style attribute when a chart updates', () => {
    const element = sized();
    lineChart(element, data).update({
      data: { labels: ['A', 'B'], series: [[2, 4]] }
    });
    expect(spy.calls).toEqual([]);
  });
});
