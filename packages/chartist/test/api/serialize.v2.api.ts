import { LineChart, lineChart } from 'chartist';
import { container } from './fixture.ts';

// chartist@1.5.0 sets a stray xmlns on its label spans, so this runs against v2 only.
describe('serialized charts (#1217)', () => {
  const data = { labels: ['a', 'b'], series: [[1, 2]] };

  function parsesAsSvg(element: HTMLElement) {
    const svg = element.querySelector('svg')!;
    expect(svg.querySelector('foreignObject span')).not.toBeNull();
    const markup = new XMLSerializer().serializeToString(svg);
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
  }

  test('a chart drawn by the function parses as SVG', () => {
    const el = container();
    lineChart(el, data).detach();
    parsesAsSvg(el);
  });

  test('a chart drawn by the 1.x class parses as SVG', async () => {
    const el = container();
    const legacy = new LineChart(el, data);
    await new Promise(resolve => setTimeout(resolve));
    legacy.detach();
    parsesAsSvg(el);
  });
});
