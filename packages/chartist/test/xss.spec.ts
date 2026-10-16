import { toScene } from '../src/chart/toScene';
import { serialize } from '../src/core/data/serialize';
import type { ChartConfig } from '../src/chart/types';
import { targetLine } from '../src/layers/targetLine';
import { barChart, barChartConfig } from '../src/presets/barChart';
import { lineChart, lineChartConfig } from '../src/presets/lineChart';
import { pieChart, pieChartConfig } from '../src/presets/pieChart';
import { renderToString } from '../src/render/string';
import { carries, injected, payloads } from './payloads';

// Chart data must stay data in every output: payloads in each field come
// out as text or as escaped attribute values, never as elements or event
// handlers. Meta is kept in its 1.x serialized form. `renderToString()` output is checked as parsed SVG and as HTML
// inserted with innerHTML, the way pages use it.

interface Field {
  /** Draws the chart into an element (the DOM renderer). */
  draw(element: Element, payload: string): void;
  /** The same chart as a config, for `toScene()`. */
  config(payload: string): ChartConfig;
}

const labels = ['Mon', 'Tue'];

const fields: Record<string, Field> = {
  label: {
    draw: (element, p) =>
      lineChart(element, { labels: [p, 'Tue'], series: [[1, 2]] }),
    config: p => lineChartConfig({ labels: [p, 'Tue'], series: [[1, 2]] })
  },
  'series name': {
    draw: (element, p) =>
      lineChart(element, { labels, series: [{ name: p, data: [1, 2] }] }),
    config: p =>
      lineChartConfig({ labels, series: [{ name: p, data: [1, 2] }] })
  },
  'class name': {
    draw: (element, p) =>
      barChart(element, { labels, series: [{ className: p, data: [1, 2] }] }),
    config: p =>
      barChartConfig({ labels, series: [{ className: p, data: [1, 2] }] })
  },
  'series meta': {
    draw: (element, p) =>
      lineChart(element, { labels, series: [{ meta: p, data: [1, 2] }] }),
    config: p =>
      lineChartConfig({ labels, series: [{ meta: p, data: [1, 2] }] })
  },
  'value meta': {
    draw: (element, p) =>
      lineChart(element, { labels, series: [[{ value: 1, meta: p }, 2]] }),
    config: p =>
      lineChartConfig({ labels, series: [[{ value: 1, meta: p }, 2]] })
  },
  'label function': {
    draw: (element, p) =>
      lineChart(
        element,
        { labels, series: [[1, 2]] },
        { axisY: { labelInterpolationFnc: value => `${value}${p}` } }
      ),
    config: p =>
      lineChartConfig(
        { labels, series: [[1, 2]] },
        { axisY: { labelInterpolationFnc: value => `${value}${p}` } }
      )
  },
  'target line label': {
    draw: (element, p) =>
      lineChart(
        element,
        { labels, series: [[1, 2]] },
        { layers: { above: [targetLine({ value: 1.5, label: p })] } }
      ),
    config: p =>
      lineChartConfig(
        { labels, series: [[1, 2]] },
        { layers: { above: [targetLine({ value: 1.5, label: p })] } }
      )
  },
  'pie label': {
    draw: (element, p) =>
      pieChart(element, { labels: [p, 'b'], series: [1, 2] }),
    config: p => pieChartConfig({ labels: [p, 'b'], series: [1, 2] })
  }
};

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

const size = { width: 400, height: 200 };

afterEach(() => {
  document.body.innerHTML = '';
});

describe.each(Object.entries(fields))('a payload in the %s', (_, field) => {
  it.each(payloads)('stays data in the DOM: %s', payload => {
    const element = sized();
    field.draw(element, payload);
    expect(injected(element)).toEqual([]);
    expect(carries(element, payload, serialize(payload))).toBe(true);
  });

  it.each(payloads)('stays data in SVG strings: %s', payload => {
    for (const labelMode of ['svg', 'html'] as const) {
      const markup = renderToString(
        toScene(field.config(payload), { ...size, labels: labelMode })
      );
      const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
      expect(parsed.querySelector('parsererror')).toBeNull();
      expect(injected(parsed.documentElement)).toEqual([]);
      expect(carries(parsed.documentElement, payload, serialize(payload))).toBe(
        true
      );

      const host = sized();
      host.innerHTML = markup;
      expect(injected(host)).toEqual([]);
      expect(carries(host, payload, serialize(payload))).toBe(true);
    }
  });
});
