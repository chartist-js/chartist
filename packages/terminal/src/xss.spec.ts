// @vitest-environment jsdom
import { carries, injected, payloads } from '../../chartist/test/payloads.ts';
import { lineChart, pieChart } from './charts.ts';
import { legend } from './legend.ts';

// Chart data must stay data in the HTML and element output and in the
// legend: payloads come out as text, never as elements or event handlers.
// The payloads and checks are the ones of the chartist package's tests.

const outputs = {
  label: (p: string) => ({
    html: lineChart(
      { labels: [p, 'b'], series: [[1, 2]] },
      { columns: 120, rows: 8, format: 'html' }
    ),
    element: lineChart(
      { labels: [p, 'b'], series: [[1, 2]] },
      { columns: 120, rows: 8, format: 'element' }
    )
  }),
  'pie label': (p: string) => ({
    html: pieChart(
      { labels: [p, 'b'], series: [1, 2] },
      { columns: 120, rows: 20, format: 'html' }
    ),
    element: pieChart(
      { labels: [p, 'b'], series: [1, 2] },
      { columns: 120, rows: 20, format: 'element' }
    )
  }),
  'legend name': (p: string) => ({
    html: legend({ series: [{ name: p, data: [1] }] }, { format: 'html' }),
    element: legend({ series: [{ name: p, data: [1] }] }, { format: 'element' })
  })
};

describe.each(Object.entries(outputs))('a payload in the %s', (_, output) => {
  it.each(payloads)('stays data: %s', payload => {
    const { html, element } = output(payload);
    const host = document.createElement('div');
    host.innerHTML = html;
    for (const root of [host, element]) {
      expect(injected(root)).toEqual([]);
      expect(carries(root, payload)).toBe(true);
    }
  });
});
