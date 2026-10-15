// @vitest-environment node
import { LineChart, lineChart, Svg } from 'chartist';
import { compat, fromLegacyPlugin } from 'chartist/compat';
import { JSDOM } from 'jsdom';

// Charts drawn into the elements of a JSDOM window in Node, without its
// globals (window, document, Element) installed, use that window (#1492).
describe('JSDOM without globals (v2)', () => {
  const page = () => new JSDOM('<div id="chart"></div>').window;

  test('the environment has no DOM globals', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof Element).toBe('undefined');
  });

  test('Svg wraps and creates elements of that document', () => {
    const { document } = page();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);
    const root = new Svg(svg);
    expect(root.getNode()).toBe(svg);

    const group = root.elem('g');
    expect(group.getNode().ownerDocument).toBe(document);
    expect(group.parent()?.getNode()).toBe(svg);
    expect(root.parent()).toBeNull();

    const span = document.createElement('span');
    const label = group.foreignObject(span);
    expect(label.getNode().firstChild).toBe(span);
  });

  test('lineChart with compat renders and emits draw events', () => {
    const { document } = page();
    const element = document.getElementById('chart')!;
    const draws = new Set<string>();
    const recorder = (legacy: {
      on(event: string, listener: (data: { type: string }) => void): unknown;
    }) => legacy.on('draw', data => void draws.add(data.type));
    const handle = lineChart(
      element,
      { labels: ['Mon', 'Tue'], series: [[1, 2]] },
      { width: 300, height: 200, plugins: [compat, fromLegacyPlugin(recorder)] }
    );
    expect(element.querySelector('svg')).not.toBeNull();
    expect(draws).toEqual(new Set(['grid', 'label', 'point', 'line']));
    handle.detach();
  });

  test('a 1.x class renders after the deferred tick and detaches', async () => {
    const { document } = page();
    const element = document.getElementById('chart')!;
    const chart = new LineChart(
      element,
      { labels: ['Mon', 'Tue'], series: [[1, 2]] },
      { width: 300, height: 200, plugins: [compat] }
    );
    await new Promise(resolve => chart.on('created', resolve));
    expect(element.querySelectorAll('.ct-point')).toHaveLength(2);
    expect(() => chart.detach()).not.toThrow();
  });
});
