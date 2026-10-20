// @vitest-environment jsdom
import { lineChart, lineChartConfig, toScene } from 'chartist';
import { renderToString } from 'chartist/server';
import { carries, injected, payloads } from '../../chartist/test/payloads.ts';
import { targetLine } from './targetLine.ts';

// A target line's label is chart data: payloads in it come out as text,
// never as elements or event handlers. The payloads and checks are the
// ones of the chartist package's tests.
const data = { labels: ['a', 'b'], series: [[1, 2]] };
const options = (label: string) => ({
  layers: { above: [targetLine({ value: 1.5, label })] }
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a payload in a target line label', () => {
  it.each(payloads)('stays data in the DOM: %s', payload => {
    const element = document.createElement('div');
    Object.defineProperties(element, {
      clientWidth: { get: () => 400 },
      clientHeight: { get: () => 200 }
    });
    document.body.appendChild(element);
    lineChart(element, data, options(payload));
    expect(injected(element)).toEqual([]);
    expect(carries(element, payload)).toBe(true);
  });

  it.each(payloads)('stays data in SVG strings: %s', payload => {
    const markup = renderToString(
      toScene(lineChartConfig(data, options(payload)), {
        width: 400,
        height: 200
      })
    );
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(injected(parsed.documentElement)).toEqual([]);
    expect(carries(parsed.documentElement, payload)).toBe(true);
  });
});
