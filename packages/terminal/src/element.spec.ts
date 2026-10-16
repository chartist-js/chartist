// @vitest-environment jsdom
import {
  barChartConfig,
  lineChartConfig,
  node,
  pieChartConfig,
  toScene
} from 'chartist';
import { barChart, lineChart, pieChart } from './charts.ts';
import { renderToElement, renderToHtml } from './html.ts';
import { legend } from './legend.ts';
import { terminalSize } from './draw.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('renderToElement', () => {
  const scenes = {
    line: toScene(
      lineChartConfig(
        { labels: ['Mon', 'Tue', 'Wed'], series: [[1, 3, 2]] },
        { showArea: true }
      ),
      terminalSize(30, 8)
    ),
    'stacked bar': toScene(
      barChartConfig(
        {
          labels: ['A', 'B'],
          series: [
            [3, 1],
            [2, 4]
          ]
        },
        { stackBars: true }
      ),
      terminalSize(30, 10)
    ),
    donut: toScene(
      pieChartConfig(
        { labels: ['Bananas', 'Apples'], series: [20, 10] },
        { donut: true }
      ),
      terminalSize(30, 12)
    )
  };

  it.each(Object.entries(scenes))(
    'builds the same markup as renderToHtml() for a %s chart',
    (_, scene) => {
      const element = renderToElement(scene);
      expect(element).toBeInstanceOf(HTMLPreElement);
      expect(element.outerHTML).toBe(renderToHtml(scene));
    }
  );

  it('keeps text as text', () => {
    const element = renderToElement(
      node('svg', { width: 80, height: 16 }).append(
        node('text', { x: 0, y: 13.6 }).text('<b>&')
      )
    );
    expect(element.textContent).toBe('<b>&');
    expect(element.querySelector('b')).toBeNull();
  });

  it('creates the element in a given document', () => {
    const other = document.implementation.createHTMLDocument('');
    const element = renderToElement(scenes.line, { document: other });
    expect(element.ownerDocument).toBe(other);
  });

  it('is the chart functions’ element format', () => {
    const data = { labels: ['Bananas', 'Apples'], series: [20, 10] };
    const options = { donut: true, columns: 30, rows: 12 };
    const element = pieChart(data, { ...options, format: 'element' });
    expect(element).toBeInstanceOf(HTMLPreElement);
    expect(element.outerHTML).toBe(
      pieChart(data, { ...options, format: 'html' })
    );
    expect(
      lineChart({ series: [[1, 2]] }, { format: 'element' }).outerHTML
    ).toBe(lineChart({ series: [[1, 2]] }, { format: 'html' }));
    expect(
      barChart({ series: [[1, 2]] }, { format: 'element' }).outerHTML
    ).toBe(barChart({ series: [[1, 2]] }, { format: 'html' }));
  });

  it('types the result by format', () => {
    const data = { series: [[1, 2]] };
    expectTypeOf(
      lineChart(data, { format: 'element' })
    ).toEqualTypeOf<HTMLPreElement>();
    expectTypeOf(barChart(data, { format: 'html' })).toEqualTypeOf<string>();
    expectTypeOf(pieChart({ series: [1, 2] })).toEqualTypeOf<string>();
    expectTypeOf(
      legend(data, { format: 'element' })
    ).toEqualTypeOf<HTMLPreElement>();
    expectTypeOf(legend(data)).toEqualTypeOf<string>();
    const format = 'element' as 'text' | 'html' | 'element';
    expectTypeOf(lineChart(data, { format })).toEqualTypeOf<
      string | HTMLPreElement
    >();
  });

  it('builds the legend as an element', () => {
    const data = {
      series: [
        { name: '<b>', data: [1] },
        { name: 'Sign-ups', data: [2] }
      ]
    };
    const element = legend(data, { format: 'element', columns: 10 });
    expect(element.textContent).toContain('<b>');
    expect(element.querySelector('b')).toBeNull();
    expect(element.outerHTML).toBe(
      legend(data, { format: 'html', columns: 10 })
    );
    expect(legend({ series: [[1]] }, { format: 'element' }).outerHTML).toBe(
      '<pre class="ct-terminal ct-legend"></pre>'
    );
  });

  it('throws without a document', () => {
    vi.stubGlobal('document', undefined);
    expect(() => renderToElement(scenes.line)).toThrow(
      "Chartist terminal: format 'element' needs a document"
    );
  });
});
