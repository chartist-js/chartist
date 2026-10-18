import { fromLegacyPlugin } from '../compat';
import { LineChart } from '../charts/LineChart';
import type { RenderEvent } from '../pipeline/types';
import { lineChart, lineChartConfig } from '../presets/lineChart';
import { domRenderer, type DomRenderOutput } from '../render/dom';
import { renderToString } from '../render/string';
import type { Renderer } from '../render/types';
import {
  container as containerQuery,
  responsive
} from '../responsive/responsive';
import { installFakeMatchContainer } from '../responsive/fakeContainer';
import type { SceneNode } from '../scene/node';
import { chart } from './chart';
import { renderForHydration } from './renderForHydration';

const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [[12, 9, 7, 8, 5]]
};

/** A container with a fixed size (jsdom has no layout), holding `markup`. */
function container(markup: string, width = 600, height = 300) {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => width },
    clientHeight: { get: () => height }
  });
  element.innerHTML = markup;
  document.body.appendChild(element);
  return element;
}

const serverMarkup = (config = lineChartConfig(data)) =>
  renderForHydration(config, { width: 600, height: 300 });

/** The scene's nodes bound to the elements at the same place in `element`. */
function bind(scene: SceneNode, element: Element, into = new Map()) {
  into.set(scene, element);
  scene.children.forEach((child, index) =>
    bind(child, element.children[index], into)
  );
  return into as Map<SceneNode, Element>;
}

/**
 * The DOM renderer, with `adopt` (unless `adopt: false`) that binds the
 * replayed scene to the server's elements, or declines. With a previous render whose
 * scene draws the same markup, it claims to have patched nothing.
 */
function stubRenderer({ adopt = true, decline = false } = {}) {
  const dom = domRenderer();
  const calls: string[] = [];
  const output = (svg: SVGSVGElement, scene: SceneNode) => {
    const elements = bind(scene, svg);
    return {
      svg,
      elementOf: (node: SceneNode) => elements.get(node),
      remove: () => svg.remove()
    };
  };
  const renderer: Renderer<DomRenderOutput> = {
    ...dom,
    render(scene, target, update) {
      calls.push(update ? `render ${update.cause}` : 'render');
      const svg = update?.previous.svg;
      if (
        update &&
        svg &&
        target.contains(svg) &&
        renderToString(update.previousScene) === renderToString(scene)
      ) {
        return { ...output(svg, scene), patched: true, changes: [] };
      }
      return dom.render(scene, target);
    },
    ...(adopt && {
      adopt(
        target: Element,
        replay: Parameters<NonNullable<Renderer['adopt']>>[1]
      ) {
        calls.push('adopt');
        const svg = target.querySelector<SVGSVGElement>(
          ':scope > svg[data-ct-hydrate]'
        );
        if (decline || !svg) {
          return undefined;
        }
        const { width, height, labels } = JSON.parse(
          svg.getAttribute('data-ct-hydrate')!
        );
        return {
          ...output(svg, replay({ width, height, labels })),
          repaired: 0
        };
      }
    })
  };
  return { renderer, calls };
}

/** Records the `mount` events of a chart created with `create`. */
function mounts() {
  const events: (RenderEvent & {
    elementOf: (node: SceneNode) => Element | undefined;
  })[] = [];
  return {
    events,
    on: { mount: (event: (typeof events)[number]) => void events.push(event) }
  };
}

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  warn.mockRestore();
  document.body.innerHTML = '';
});

describe('chart(): taking server markup over', () => {
  it('adopts the server svg and runs render and mount with the cause hydrate', () => {
    const el = container(serverMarkup());
    const server = el.querySelector('svg')!;
    const points = Array.from(server.querySelectorAll('.ct-point'));
    const { renderer, calls } = stubRenderer();
    const renders: RenderEvent[] = [];
    const { events, on } = mounts();
    lineChart(el, data, {
      renderer,
      on: { ...on, render: event => void renders.push(event) }
    });

    expect(calls).toEqual(['adopt', 'render resize']);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).toBe(server);
    expect(Array.from(server.querySelectorAll('.ct-point'))).toEqual(points);
    expect(renders.map(event => event.cause)).toEqual(['hydrate']);
    const [mount] = events;
    expect(events.map(event => event.cause)).toEqual(['hydrate']);
    expect(mount.hydration).toEqual({ repaired: 0 });
    expect(mount.previous).toBeUndefined();
    expect(mount.changes.every(change => change.op === 'add')).toBe(true);
    expect(mount.changes[0].node).toBe(mount.scene);
    expect(mount.elementOf(mount.scene)).toBe(server);
    const point = mount.changes.find(change => change.node.role === 'point');
    expect(mount.elementOf(point!.node)).toBe(points[0]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders as a first render with a custom renderer without adopt', () => {
    const el = container(serverMarkup());
    const server = el.querySelector('svg');
    const { renderer, calls } = stubRenderer({ adopt: false });
    const { events, on } = mounts();
    lineChart(el, data, { renderer, on });
    expect(calls).toEqual(['render']);
    expect(events.map(event => event.cause)).toEqual(['create']);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(server);
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders as a first render when the renderer declines', () => {
    const el = container(serverMarkup());
    const server = el.querySelector('svg');
    const { renderer, calls } = stubRenderer({ decline: true });
    const { events, on } = mounts();
    lineChart(el, data, { renderer, on });
    expect(calls).toEqual(['adopt', 'render']);
    expect(events.map(event => event.cause)).toEqual(['create']);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(server);
  });

  it('draws a new svg for a chart with a converted 1.x plugin', () => {
    const el = container(serverMarkup());
    const server = el.querySelector('svg');
    const { renderer, calls } = stubRenderer();
    const { events, on } = mounts();
    const draws: Element[] = [];
    const plugin = fromLegacyPlugin(legacy =>
      legacy.on('draw', (event: { element: { getNode(): Element } }) =>
        draws.push(event.element.getNode())
      )
    );
    lineChart(el, data, { renderer, on, plugins: [plugin] });
    expect(calls).toEqual(['render']);
    expect(events.map(event => event.cause)).toEqual(['create']);
    const svg = el.querySelector('svg')!;
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(svg).not.toBe(server);
    expect(draws.length).toBeGreaterThan(0);
    expect(draws.every(element => svg.contains(element))).toBe(true);
  });

  it('draws a new svg for a 1.x LineChart', async () => {
    const el = container(serverMarkup());
    const server = el.querySelector('svg');
    const legacy = new LineChart(el, data);
    // 1.x classes draw on the next task.
    await new Promise(resolve => setTimeout(resolve));
    legacy.detach();
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(server);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('chart(): the layout at the real size', () => {
  it('runs one mount at the server size, and removes the viewBox and the marker', () => {
    const el = container(serverMarkup());
    const server = el.querySelector('svg')!;
    const { renderer } = stubRenderer();
    const { events, on } = mounts();
    lineChart(el, data, { renderer, on });
    expect(events.map(event => event.cause)).toEqual(['hydrate']);
    expect(server.hasAttribute('viewBox')).toBe(false);
    expect(server.hasAttribute('data-ct-hydrate')).toBe(false);
  });

  it('renders again with the cause resize at another size', () => {
    const el = container(serverMarkup(), 343, 300);
    const { renderer, calls } = stubRenderer();
    const { events, on } = mounts();
    lineChart(el, data, { renderer, on });
    expect(calls).toEqual(['adopt', 'render resize']);
    expect(events.map(event => event.cause)).toEqual(['hydrate', 'resize']);
    const svg = el.querySelector('svg')!;
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(svg.hasAttribute('viewBox')).toBe(false);
    expect(svg.hasAttribute('data-ct-hydrate')).toBe(false);
  });

  it('keeps the scaling viewBox during the hydrate mount', () => {
    const el = container(serverMarkup(), 343, 300);
    const { renderer } = stubRenderer();
    const viewBoxes: (string | null)[] = [];
    lineChart(el, data, {
      renderer,
      on: {
        mount: ({ scene, elementOf }) =>
          void viewBoxes.push(elementOf(scene)!.getAttribute('viewBox'))
      }
    });
    expect(viewBoxes).toEqual(['0 0 600 300', null]);
  });

  it('keeps the cleanups of the hydrate mount when nothing changes', () => {
    const el = container(serverMarkup());
    const { renderer } = stubRenderer();
    const cleanup = vi.fn();
    const handle = lineChart(el, data, {
      renderer,
      on: { mount: () => cleanup }
    });
    expect(cleanup).not.toHaveBeenCalled();
    handle.destroy();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('applies the responsive overrides with the real layout', () => {
    const fake = installFakeMatchContainer();
    try {
      const narrow = '(width < 400px)';
      fake.set(narrow, true, false);
      const config = {
        ...lineChartConfig(data),
        responsive: responsive([
          [containerQuery(narrow), { className: 'is-narrow' }]
        ])
      };
      const el = container(serverMarkup(config));
      const server = el.querySelector('svg')!;
      expect(server.classList.contains('is-narrow')).toBe(false);
      const { renderer } = stubRenderer();
      const { events, on } = mounts();
      chart(el, { ...config, renderer, on });
      expect(events.map(event => event.cause)).toEqual(['hydrate', 'resize']);
      expect(el.querySelector('svg')!.classList.contains('is-narrow')).toBe(
        true
      );
    } finally {
      fake.uninstall();
    }
  });
});

describe('chart(): markup replaced by other code', () => {
  it.each([
    ['the DOM renderer', () => undefined],
    ['a renderer that adopts', () => stubRenderer().renderer]
  ])('warns and draws a new svg with %s', (_, renderer) => {
    const el = container(serverMarkup());
    const handle = lineChart(el, data, { renderer: renderer() });
    expect(warn).not.toHaveBeenCalled();
    // A framework writes the server markup into the container again.
    el.innerHTML = serverMarkup();
    handle.update({ data: { ...data, series: [[1, 2, 3, 4, 5]] } });
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toContain(
      "other code removed the chart's svg"
    );
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')!.hasAttribute('data-ct-hydrate')).toBe(
      false
    );
  });
});
