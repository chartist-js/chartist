// @vitest-environment node
import { node } from '../scene/node';
import { renderToString } from './string';

const ROOT =
  'xmlns="http://www.w3.org/2000/svg" xmlns:ct="http://gionkunz.github.com/chartist-js/ct"';

describe('render/string', () => {
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
