import {
  applyAttribute,
  domRenderer,
  keySplinesOf,
  lineChart,
  node,
  renderElement,
  sampleEasing,
  type ChartPlugin,
  type DomRenderOutput,
  type RenderEvent,
  type Renderer,
  type RenderUpdate
} from 'chartist';

function container() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('render lifecycle (v2)', () => {
  test('renderers get the previous render, and listeners the cause and changes', () => {
    const dom = domRenderer();
    const updates: (RenderUpdate<DomRenderOutput> | undefined)[] = [];
    const renderer: Renderer<DomRenderOutput> = {
      ...dom,
      render(scene, target, update) {
        updates.push(update);
        return dom.render(scene, target, update);
      }
    };
    const events: RenderEvent[] = [];
    const chart = lineChart(
      container(),
      { labels: ['a', 'b'], series: [[1, 2]] },
      { renderer, on: { mount: event => void events.push(event) } }
    );
    chart.update({ data: { labels: ['a', 'b'], series: [[2, 1]] } });
    expect(updates[0]).toBeUndefined();
    expect(updates[1]?.cause).toBe('update');
    expect(updates[1]?.labels).toEqual(['a', 'b']);
    expect(events.map(event => event.cause)).toEqual(['create', 'update']);
    // The DOM renderer replaces its SVG, so the update is a replacement.
    expect(events[1].previous).toBe(events[0].scene);
    expect(events[1].changes[0]).toEqual({
      op: 'remove',
      node: events[0].scene
    });
  });

  test('cleanup functions from mount listeners and install', () => {
    const calls: string[] = [];
    const plugin: ChartPlugin = {
      name: 'tracker',
      install: chart => {
        chart.on('mount', () => () => void calls.push('mount cleanup'));
        return () => void calls.push('install cleanup');
      }
    };
    const chart = lineChart(
      container(),
      { series: [[1, 2]] },
      { plugins: [plugin] }
    );
    chart.update({ data: { series: [[2, 1]] } });
    chart.destroy();
    expect(calls).toEqual([
      'mount cleanup',
      'mount cleanup',
      'install cleanup'
    ]);
  });
});

describe('elements for renderers (v2)', () => {
  test('renderElement creates a node as the DOM renderer does', () => {
    const label = renderElement(
      node('foreignObject', { x: 1 }).append(
        node('span', { style: 'width: 20px;' }, 'ct-label').text('A')
      ),
      document
    );
    const span = label.firstElementChild as HTMLElement;
    expect(span.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(span.style.width).toBe('20px');
  });

  test('applyAttribute sets ct: names in the Chartist namespace', () => {
    const point = renderElement(node('line', {}, 'ct-point'), document);
    applyAttribute(point, 'ct:value', 3);
    expect(
      point.getAttributeNS('http://gionkunz.github.com/chartist-js/ct', 'value')
    ).toBe('3');
  });
});

describe('easing (v2)', () => {
  test('sampleEasing and keySplinesOf', () => {
    expect(sampleEasing('ease-out', 400)).toHaveLength(12);
    expect(
      Math.max(...sampleEasing('cubic-bezier(0.34, 1.56, 0.64, 1)', 400))
    ).toBeGreaterThan(1);
    expect(keySplinesOf('ease-out')).toBe('0 0 0.58 1');
    expect(keySplinesOf('easeOutBack')).toBeUndefined();
  });
});
