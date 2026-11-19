// @vitest-environment node
import { node } from '../scene/node';
import { toScene } from '../chart/toScene';
import { barChartConfig } from '../presets/barChart';
import { lineChartConfig } from '../presets/lineChart';
import { pieChartConfig } from '../presets/pieChart';
import { renderToString } from './string';

const ROOT =
  'xmlns="http://www.w3.org/2000/svg" xmlns:ct="http://gionkunz.github.com/chartist-js/ct"';

describe('render/string', () => {
  it.each([
    {
      dimension: 'X',
      horizontalBars: false,
      closingLine: '<line class="ct-grid ct-horizontal" x1="305" x2="305"'
    },
    {
      dimension: 'Y',
      horizontalBars: true,
      closingLine: '<line class="ct-grid ct-vertical" y1="15" y2="15"'
    }
  ])(
    'adds a closing grid line to the $dimension step axis on request',
    ({ dimension, horizontalBars, closingLine }) => {
      const data = { labels: ['A', 'B'], series: [[1, 2]] };
      const render = (
        options: { showClosingGridLine?: boolean; showGrid?: boolean } = {}
      ) =>
        renderToString(
          toScene(
            barChartConfig(data, {
              horizontalBars,
              [`axis${dimension}`]: options
            }),
            {
              width: 320,
              height: 180
            }
          )
        );

      expect(render()).not.toContain(closingLine);
      expect(render({ showClosingGridLine: true })).toContain(closingLine);
      expect(
        render({ showClosingGridLine: true, showGrid: false })
      ).not.toContain(closingLine);
    }
  );

  it('adds a closing grid line to a line chart without fullWidth', () => {
    const data = { labels: ['A', 'B'], series: [[1, 2]] };
    const render = (showClosingGridLine?: boolean) =>
      renderToString(
        toScene(lineChartConfig(data, { axisX: { showClosingGridLine } }), {
          width: 320,
          height: 180
        })
      );
    const closingLine =
      /<line class="ct-grid ct-horizontal" x1="305" x2="305"[^>]*\/>/;
    const svg = render();
    const svgWithClosingLine = render(true);

    expect(svg).not.toMatch(closingLine);
    expect(svgWithClosingLine).toMatch(closingLine);
    expect(svgWithClosingLine.replace(closingLine, '')).toBe(svg);
  });

  it('does not draw a second closing line when the final step tick is already there', () => {
    const data = { labels: ['A', 'B'], series: [[1, 2]] };
    const svg = renderToString(
      toScene(
        lineChartConfig(data, {
          fullWidth: true,
          axisX: { showClosingGridLine: true }
        }),
        { width: 320, height: 180 }
      )
    );
    expect(
      svg.match(/<line class="ct-grid ct-horizontal" x1="305" x2="305"/g)
    ).toHaveLength(1);
  });

  it.each([
    { donutWidth: '40%', width: 62 },
    { donutWidth: '40.5%', width: 62.775 },
    { donutWidth: '0.5%', width: 0.775 },
    { donutWidth: '40.5px', width: 40.5 },
    { donutWidth: 40.5, width: 40.5 }
  ])('renders a donut width of $donutWidth', ({ donutWidth, width }) => {
    const svg = renderToString(
      toScene(pieChartConfig({ series: [3, 1] }, { donut: true, donutWidth }), {
        width: 320,
        height: 320
      })
    );
    const widths = Array.from(
      svg.matchAll(/stroke-width:\s*([^;"]+)/g),
      match => match[1]
    );
    expect(widths).toEqual([`${width}px`, `${width}px`]);
  });

  it('serializes the root with namespaces, size and classes', () => {
    expect(
      renderToString(node('svg', { width: 600, height: 300 }, 'chart'))
    ).toBe(`<svg ${ROOT} class="chart" width="600" height="300"/>`);
  });

  it('serializes children, text and ct: attributes', () => {
    const scene = node('svg').append(
      node('g', {}, 'series')
        .append(node('line', { x1: 1, 'ct:value': 5 }, 'ct-point'))
        .append(node('text', { x: 2 }).text('Label'))
    );
    expect(renderToString(scene)).toBe(
      `<svg ${ROOT}><g class="series"><line class="ct-point" x1="1" ct:value="5"/><text x="2">Label</text></g></svg>`
    );
  });

  it('escapes attribute values and text', () => {
    const scene = node('svg').append(
      node('text', { 'ct:meta': '{"a":"<b>"}' }).text(`Tom & "Jerry's" <3`)
    );
    expect(renderToString(scene)).toContain(
      '<text ct:meta="{&quot;a&quot;:&quot;&lt;b&gt;&quot;}">Tom &amp; &quot;Jerry&#039;s&quot; &lt;3</text>'
    );
  });

  // Names can't be escaped: an invalid one throws, as it does in the DOM,
  // instead of writing markup a plugin built from data.
  it('throws on an element name that is not a valid XML name', () => {
    const scene = node('svg').append(node('img src=x onerror=alert(1)'));
    expect(() => renderToString(scene)).toThrow(
      'Chartist: "img src=x onerror=alert(1)" is not a valid element name'
    );
  });

  it('throws on an attribute name that is not a valid XML name', () => {
    const scene = node('svg').append(node('g', { 'x onload=alert(1) y': 1 }));
    expect(() => renderToString(scene)).toThrow(
      'Chartist: "x onload=alert(1) y" is not a valid attribute name'
    );
  });

  it.each(['', '1x', 'a"b', 'a>b', 'a/b'])('throws on the name "%s"', name => {
    expect(() => renderToString(node('svg').append(node(name)))).toThrow(
      'is not a valid element name'
    );
    expect(() =>
      renderToString(node('svg').append(node('g', { [name]: 1 })))
    ).toThrow('is not a valid attribute name');
  });

  it('keeps namespaced and other valid names', () => {
    const scene = node('svg')
      .append(
        node('foreignObject', { 'ct:value': 1, 'xml:lang': 'de' }).append(
          node('span', { 'data-x_y.z': 2 }, 'ct-label').text('Grüezi')
        )
      )
      .append(node('élément'));
    expect(renderToString(scene)).toBe(
      `<svg ${ROOT}><foreignObject ct:value="1" xml:lang="de"><span xmlns="http://www.w3.org/1999/xhtml" class="ct-label" data-x_y.z="2">Grüezi</span></foreignObject><élément/></svg>`
    );
  });
});
