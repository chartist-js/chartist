import { barChartConfig, lineChartConfig, node, toScene } from 'chartist';
import { renderToHtml } from './html.ts';
import { terminalSize } from './draw.ts';
import { terminalStyles } from './styles.ts';

describe('renderToHtml', () => {
  const bars = renderToHtml(
    toScene(
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
    )
  );

  it('wraps the lines in a pre with classes, without styles or escape codes', () => {
    expect(bars).toMatch(/^<pre class="ct-terminal">[\s\S]*<\/pre>$/);
    expect(bars).toMatch(
      /<span class="ct-bar ct-series-a">(<i>█<\/i>)+<\/span>/
    );
    expect(bars).toContain('ct-series-b');
    expect(bars).not.toContain('style=');
    expect(bars).not.toContain('\x1b');
  });

  it('marks the grid, labels and the series behind a cell', () => {
    expect(bars).toMatch(/<span class="ct-grid">(<i>[┈┊┼]<\/i>)+<\/span>/);
    expect(bars).toMatch(/<span class="ct-label">A<\/span>/);
    // Stacked bars meet inside a cell somewhere in this chart.
    expect(bars).toMatch(/ct-bar ct-series-b ct-bg-series-a/);
  });

  it('marks areas and lines', () => {
    const html = renderToHtml(
      toScene(
        lineChartConfig({ series: [[1, 3, 2]] }, { showArea: true }),
        terminalSize(30, 8)
      )
    );
    expect(html).toContain('ct-area ct-series-a');
    expect(html).toContain('ct-line ct-series-a');
  });

  it('escapes text', () => {
    const html = renderToHtml(
      node('svg', { width: 80, height: 16 }).append(
        node('text', { x: 0, y: 13.6 }).text('<b>&')
      )
    );
    expect(html).toBe(
      '<pre class="ct-terminal"><span class="ct-label">&lt;b&gt;&amp;</span></pre>'
    );
  });

  it('puts each character beyond ASCII in a cell of its own', () => {
    // Outside the cells: tags, ASCII and line breaks only.
    expect(bars.replace(/<i>[^<]<\/i>/g, '').replace(/<[^>]+>/g, '')).toMatch(
      /^[\x20-\x7e\n]*$/
    );
    const html = renderToHtml(
      node('svg', { width: 80, height: 16 }).append(
        node('text', { x: 0, y: 13.6 }).text('Zürich')
      )
    );
    expect(html).toContain('<span class="ct-label">Z<i>ü</i>rich</span>');
  });

  it('keeps the rows of the text output', () => {
    const lines = bars.replace(/<[^>]+>/g, '').split('\n');
    expect(lines.length).toBeLessThanOrEqual(10);
    for (const line of lines) {
      expect([...line.replace(/&[a-z]+;/g, 'x')].length).toBeLessThanOrEqual(
        30
      );
    }
  });
});

describe('terminalStyles', () => {
  const css = terminalStyles();

  it('colors series from the custom properties, with the default colors', () => {
    expect(css).toContain(
      '.ct-terminal .ct-series-a { color: var(--ct-series-a, #d70206); }'
    );
    expect(css).toContain(
      '.ct-terminal .ct-bg-series-o { background-color: var(--ct-series-o, #a748ca); }'
    );
  });

  it('gives labels on a series color readable text', () => {
    expect(css).toContain(
      '.ct-terminal .ct-label.ct-bg-series-c { color: var(--ct-terminal-on-series-c, rgb(0, 0, 0)); }'
    );
    expect(css).toContain(
      '.ct-terminal .ct-label.ct-bg-series-a { color: var(--ct-terminal-on-series-a, rgb(255, 255, 255)); }'
    );
  });

  it('colors the grid and labels from the Chartist custom properties', () => {
    expect(css).toContain('var(--ct-grid-color, rgba(0, 0, 0, 0.2))');
    expect(css).toContain('var(--ct-label-color, rgba(0, 0, 0, 0.4))');
    expect(css).toContain('.ct-terminal span { font: inherit; }');
    expect(css).toContain(
      '.ct-terminal i { display: inline-block; width: 1ch; font: inherit; font-style: normal; vertical-align: top; }'
    );
  });
});
