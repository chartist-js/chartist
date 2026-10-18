import { toScene } from '../chart/toScene';
import { lineChartConfig } from '../presets/lineChart';
import { renderToString } from './string';

// Markup of a chart with an empty HTML label, as a server puts it in a page.
const markup = () =>
  renderToString(
    toScene(
      lineChartConfig({ labels: ['Mon', '', 'Wed'], series: [[1, 3, 2]] }),
      { width: 300, height: 150, labels: 'html' }
    )
  );

/** Every element as its name and sorted attributes, in document order. */
const outline = (root: Element) =>
  [root, ...Array.from(root.querySelectorAll('*'))].map(
    element =>
      `${element.namespaceURI} ${element.localName} ${Array.from(
        element.attributes
      )
        .map(attribute => `${attribute.name}=${attribute.value}`)
        .sort()
        .join(' ')}`
  );

describe('render/string in a page', () => {
  it('closes empty HTML labels, so content after the chart stays outside it', () => {
    const page = document.createElement('div');
    page.innerHTML = `<div id="chart">${markup()}</div><p id="after">After</p>`;
    expect(page.querySelector('#after')?.parentElement).toBe(page);
    expect(page.querySelector('#chart')?.nextElementSibling?.id).toBe('after');
    expect(markup()).toContain('></span>');
  });

  it('parses as XML to the elements it had with self-closing labels', () => {
    const parse = (text: string) =>
      new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    const closed = markup();
    // The same markup with empty HTML elements written self-closing.
    const selfClosing = closed.replace(/(<span [^>]*)><\/span>/g, '$1/>');
    expect(selfClosing).not.toBe(closed);
    expect(outline(parse(closed))).toEqual(outline(parse(selfClosing)));
  });
});
