import { pointContext } from '../../test/contexts';
import { toScene } from '../chart/toScene';
import { lineChart, lineChartConfig } from '../presets/lineChart';
import { node } from '../scene/node';
import { spyOnStyleAttributes } from '../../test/style-spy';
import { applyAttribute, domRenderer, renderElement } from './dom';
import { estimateText } from './measure';
import { renderToString } from './string';

const CT = 'http://gionkunz.github.com/chartist-js/ct';

function sample() {
  const point = node('line', { x1: 1, 'ct:value': 5 }, 'ct-point', {
    role: 'point',
    ctx: pointContext()
  });
  return {
    point,
    scene: node('svg', { width: 600, height: 300 }, 'chart').append(
      node('g', {}, 'series')
        .append(point)
        .append(node('text', { x: 2 }).text('A & B'))
    )
  };
}

/**
 * Serializes DOM with attributes sorted, to compare with string output.
 * `xmlns` is left out: DOM elements carry their namespace, not the attribute.
 */
function normalized(element: Element): string {
  const attrs = Array.from(element.attributes)
    .filter(a => a.name !== 'xmlns')
    .map(a => `${a.name}="${a.value}"`)
    .sort()
    .join(' ');
  const children = Array.from(element.childNodes)
    .map(child =>
      child.nodeType === 3 ? child.textContent : normalized(child as Element)
    )
    .join('');
  return `<${element.tagName} ${attrs}>${children}</${element.tagName}>`;
}

describe('render/dom', () => {
  it('renders namespaced SVG elements with ct: attributes', () => {
    const container = document.createElement('div');
    const { scene } = sample();
    const { svg } = domRenderer().render(scene, container);
    expect(container.firstElementChild).toBe(svg);
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('xmlns:ct')).toBe(CT);
    const line = svg.querySelector('line')!;
    expect(line.getAttributeNS(CT, 'value')).toBe('5');
    expect(line.getAttribute('class')).toBe('ct-point');
    expect(svg.querySelector('text')!.textContent).toBe('A & B');
  });

  it('matches the string renderer', () => {
    const container = document.createElement('div');
    const { scene } = sample();
    const { svg } = domRenderer().render(scene, container);
    const parsed = new DOMParser().parseFromString(
      renderToString(scene),
      'image/svg+xml'
    ).documentElement;
    expect(normalized(svg)).toBe(normalized(parsed));
  });

  it('string output is well-formed XML that round-trips attributes and text', () => {
    const markup = renderToString(
      node('svg', { width: 10 }).append(
        node('g', { 'ct:series-name': 'a & b' }).append(
          node('text').text('<x>')
        )
      )
    );
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.querySelector('g')!.getAttributeNS(CT, 'series-name')).toBe(
      'a & b'
    );
    expect(parsed.querySelector('text')!.textContent).toBe('<x>');
  });

  it('replaces an earlier Chartist svg but keeps other content', () => {
    const container = document.createElement('div');
    const other = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(other);
    const renderer = domRenderer();
    renderer.render(sample().scene, container);
    const second = renderer.render(sample().scene, container);
    expect(Array.from(container.children)).toEqual([other, second.svg]);
  });

  it('elementOf maps scene nodes to rendered elements', () => {
    const container = document.createElement('div');
    const { scene } = sample();
    const output = domRenderer().render(scene, container);
    const point = scene.children[0].children[0];
    expect(output.elementOf(point)).toBe(output.svg.querySelector('line'));
    expect(output.elementOf(scene)).toBe(output.svg);
    expect(output.elementOf(node('g'))).toBeUndefined();
  });

  it('remove takes the output out of the container', () => {
    const container = document.createElement('div');
    const output = domRenderer().render(sample().scene, container);
    output.remove();
    expect(container.children).toHaveLength(0);
  });

  it('measureText falls back to the estimate without SVG metrics (jsdom)', () => {
    const { measureText } = domRenderer();
    expect(measureText!('Hello', { fontSize: 10 })).toEqual(
      estimateText('Hello', { fontSize: 10 })
    );
    expect(document.body.querySelector('svg')).toBeNull();
  });

  it("measureText measures in the container's document", () => {
    const other = document.implementation.createHTMLDocument('other');
    const container = other.createElement('div');
    other.body.appendChild(container);
    const inOther = vi.spyOn(other, 'createElementNS');
    const inGlobal = vi.spyOn(document, 'createElementNS');
    try {
      domRenderer().measureText!('Hello', { container });
      expect(inOther).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'svg');
      expect(inGlobal).not.toHaveBeenCalled();
    } finally {
      inOther.mockRestore();
      inGlobal.mockRestore();
    }
  });

  it('measureText uses getBBox where available', () => {
    const original = (SVGElement.prototype as { getBBox?: unknown }).getBBox;
    (SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox =
      () => ({ width: 42, height: 7 }) as DOMRect;
    try {
      // jsdom's computed font size is the 16 px default.
      expect(domRenderer().measureText!('Hello')).toEqual({
        width: 42,
        height: 7,
        fontSize: 16
      });
    } finally {
      (SVGElement.prototype as { getBBox?: unknown }).getBBox = original;
    }
  });
});

describe('render/dom HTML in foreignObject', () => {
  const scene = node('svg').append(
    node('foreignObject', { width: 10 }).append(
      node('span', {}, 'label').text('Hi')
    )
  );

  it('creates foreignObject content in the XHTML namespace', () => {
    const { svg } = domRenderer().render(scene, document.createElement('div'));
    const span = svg.querySelector('span')!;
    expect(svg.querySelector('foreignObject')!.namespaceURI).toBe(
      'http://www.w3.org/2000/svg'
    );
    expect(span.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(span.hasAttribute('xmlns')).toBe(false);
    expect(span.textContent).toBe('Hi');
  });

  it('serializes to markup that parses as SVG (#1217)', () => {
    const container = document.createElement('div');
    lineChart(container, { labels: ['a', 'b'], series: [[1, 2]] });
    const svg = container.querySelector('svg')!;
    const span = svg.querySelector('foreignObject span')!;
    expect(span.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(span.hasAttribute('xmlns')).toBe(false);

    const markup = new XMLSerializer().serializeToString(svg);
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.getElementsByTagName('span')[0].namespaceURI).toBe(
      'http://www.w3.org/1999/xhtml'
    );
  });

  it('replaces server-rendered markup parsed as HTML', () => {
    const data = { labels: ['a', 'b'], series: [[1, 2]] };
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      toScene(lineChartConfig(data), { width: 300, height: 150 })
    );
    const server = container.querySelector('svg')!;
    // The HTML parser leaves the declaration as a plain attribute.
    expect(server.getAttributeNS('http://www.w3.org/2000/xmlns/', 'ct')).toBe(
      null
    );
    lineChart(container, data);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('svg')).not.toBe(server);
  });

  it('string output declares XHTML on the HTML root and parses', () => {
    const markup = renderToString(scene);
    expect(markup).toContain(
      '<span xmlns="http://www.w3.org/1999/xhtml" class="label">Hi</span>'
    );
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.getElementsByTagName('span')[0].namespaceURI).toBe(
      'http://www.w3.org/1999/xhtml'
    );
  });
});

describe('renderElement', () => {
  it('creates HTML label content in the XHTML namespace, styled through the CSSOM', () => {
    const label = node('foreignObject', {
      style: 'overflow: visible;',
      x: 4
    }).append(
      node('span', { style: 'width: 30px; height: 20px;' }, 'ct-label').text(
        'Mon'
      )
    );
    const spy = spyOnStyleAttributes();
    const created: string[] = [];
    try {
      const element = renderElement(label, document, {
        created: current => created.push(current.name)
      });
      const span = element.firstElementChild as HTMLElement;
      expect(element.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(span.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
      expect(span.style.width).toBe('30px');
      expect(span.textContent).toBe('Mon');
      expect(created).toEqual(['span', 'foreignObject']);
      expect(spy.calls).toEqual([]);
    } finally {
      spy.restore();
    }
  });
});

describe('applyAttribute', () => {
  it('sets ct: names in their namespace and style through the CSSOM', () => {
    const point = renderElement(node('line', { x1: 1 }, 'ct-point'), document);
    const spy = spyOnStyleAttributes();
    try {
      applyAttribute(point, 'ct:value', 12);
      applyAttribute(point, 'style', 'stroke-width: 12px;');
      applyAttribute(point, 'x1', 3);
    } finally {
      spy.restore();
    }
    expect(point.getAttributeNS(CT, 'value')).toBe('12');
    expect((point as SVGElement).style.strokeWidth).toBe('12px');
    expect(point.getAttribute('x1')).toBe('3');
    expect(spy.calls).toEqual([]);
  });
});
