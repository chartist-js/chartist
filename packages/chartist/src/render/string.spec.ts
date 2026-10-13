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
});
