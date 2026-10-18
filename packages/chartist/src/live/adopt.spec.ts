import { spyOnStyleAttributes } from '../../test/style-spy';
import {
  barChart,
  barChartConfig,
  lineChart,
  lineChartConfig,
  pieChart,
  pieChartConfig,
  renderForHydration,
  type ChartHandle,
  type ChartPlugin,
  type PhaseEvents,
  type Renderer
} from '../index';
import { liveDomRenderer } from './renderer';

const CT = 'http://gionkunz.github.com/chartist-js/ct';
const SERVER = { width: 600, height: 300 };
const week = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [[12, 9, 7, 8, 5]]
};

type MountEvent = PhaseEvents['mount'];

/** A container with a fixed size (jsdom has no layout), holding `markup`. */
function container(markup = '', width = SERVER.width, height = SERVER.height) {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => width },
    clientHeight: { get: () => height }
  });
  element.innerHTML = markup;
  document.body.appendChild(element);
  return element;
}

const points = (element: Element) =>
  Array.from(element.querySelectorAll('.ct-point'));

/**
 * An element's markup with attributes sorted and namespace declarations
 * left out, to compare a taken-over chart with a fresh one.
 */
function normalized(element: Element): string {
  const attrs = Array.from(element.attributes)
    .filter(a => a.name !== 'xmlns' && !a.name.startsWith('xmlns:'))
    .map(a => `${a.namespaceURI ?? ''} ${a.localName}="${a.value}"`)
    .sort()
    .join(' ');
  const children = Array.from(element.childNodes)
    .map(child =>
      child.nodeType === 3 ? child.textContent : normalized(child as Element)
    )
    .join('');
  return `<${element.namespaceURI} ${element.localName} ${attrs}>${children}</>`;
}

/** The three presets, each with its config for the server. */
const charts = {
  line: {
    config: (data = week) => lineChartConfig(data),
    create: (el: Element, renderer?: Renderer, on = {}, data = week) =>
      lineChart(el, data, { renderer, on })
  },
  bar: {
    config: (data = week) => barChartConfig(data),
    create: (el: Element, renderer?: Renderer, on = {}, data = week) =>
      barChart(el, data, { renderer, on })
  },
  pie: {
    config: () =>
      pieChartConfig({ series: [3, 2, 1] }, { donut: true, donutWidth: 20 }),
    create: (el: Element, renderer?: Renderer, on = {}) =>
      pieChart(
        el,
        { series: [3, 2, 1] },
        { donut: true, donutWidth: 20, renderer, on }
      )
  }
};

/** Takes `kind`'s server markup over with the live renderer. */
function takeOver(
  kind: keyof typeof charts = 'line',
  { width = SERVER.width, data = week, serverData = week } = {}
) {
  const { config, create } = charts[kind];
  const el = container(renderForHydration(config(serverData), SERVER), width);
  const server = el.querySelector('svg')!;
  const serverPoints = points(el);
  const mounts: MountEvent[] = [];
  const handle: ChartHandle = create(
    el,
    liveDomRenderer(),
    { mount: (event: MountEvent) => void mounts.push(event) },
    data
  );
  return { el, server, serverPoints, mounts, handle };
}

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  warn.mockRestore();
  document.body.innerHTML = '';
});

describe('live/liveDomRenderer: taking server markup over', () => {
  it.each(Object.keys(charts) as (keyof typeof charts)[])(
    'keeps the elements of a %s chart and mounts once, with nothing repaired',
    kind => {
      const spy = spyOnStyleAttributes();
      try {
        const { el, server, serverPoints, mounts } = takeOver(kind);
        expect(el.querySelectorAll('svg')).toHaveLength(1);
        expect(el.querySelector('svg')).toBe(server);
        expect(points(el)).toEqual(serverPoints);
        expect(mounts.map(event => event.cause)).toEqual(['hydrate']);
        expect(mounts[0].hydration).toEqual({ repaired: 0 });
        // Styles go through the CSSOM, which a strict policy allows.
        expect(spy.calls).toEqual([]);
      } finally {
        spy.restore();
      }
      expect(warn).not.toHaveBeenCalled();
    }
  );

  it.each(Object.keys(charts) as (keyof typeof charts)[])(
    'makes a %s chart equal to a fresh one',
    kind => {
      const { el } = takeOver(kind);
      const fresh = container();
      charts[kind].create(fresh, liveDomRenderer());
      expect(normalized(el.querySelector('svg')!)).toBe(
        normalized(fresh.querySelector('svg')!)
      );
    }
  );

  it('puts the ct: attributes the HTML parser left plain in their namespace', () => {
    const { serverPoints } = takeOver();
    expect(serverPoints).toHaveLength(5);
    serverPoints.forEach((point, index) => {
      const values = Array.from(point.attributes).filter(
        attribute =>
          attribute.localName === 'value' || attribute.name === 'ct:value'
      );
      expect(values).toHaveLength(1);
      expect(values[0].namespaceURI).toBe(CT);
      expect(values[0].value).toBe(String(week.series[0][index]));
    });
  });

  it("removes an attribute the scene doesn't have, and counts it", () => {
    const el = container(renderForHydration(lineChartConfig(week), SERVER));
    points(el)[0].setAttribute('data-extra', '1');
    const mounts: MountEvent[] = [];
    lineChart(el, week, {
      renderer: liveDomRenderer(),
      on: { mount: event => void mounts.push(event) }
    });
    expect(points(el)[0].hasAttribute('data-extra')).toBe(false);
    expect(mounts[0].hydration).toEqual({ repaired: 1 });
  });

  it('applies the styles at the takeover and drops the attributes that stood in for them', () => {
    const line = takeOver('line');
    const object = line.el.querySelector('foreignObject') as SVGElement;
    const span = object.querySelector('span') as HTMLElement;
    expect(object.hasAttribute('overflow')).toBe(false);
    expect(object.style.overflow).toBe('visible');
    expect(span.style.width).toMatch(/^\d+px$/);
    expect(span.style.height).toMatch(/^\d+px$/);
    expect((line.server as unknown as HTMLElement).style.width).toBe('100%');

    const donut = takeOver('pie');
    const slices = Array.from(
      donut.el.querySelectorAll<SVGElement>('.ct-slice-donut')
    );
    expect(slices).toHaveLength(3);
    for (const slice of slices) {
      expect(slice.hasAttribute('stroke-width')).toBe(false);
      expect(slice.style.strokeWidth).toBe('20px');
    }
    expect(donut.mounts[0].hydration).toEqual({ repaired: 0 });
  });

  it('keeps the elements and shows the browser values when values differ', () => {
    // A fixed low end, so the axis ticks, and with them the structure, stay.
    const el = container(
      renderForHydration(lineChartConfig(week, { low: 0 }), SERVER)
    );
    const server = el.querySelector('svg');
    const serverPoints = points(el);
    const mounts: MountEvent[] = [];
    lineChart(
      el,
      { ...week, series: [[12, 9, 7, 8, 6]] },
      {
        low: 0,
        renderer: liveDomRenderer(),
        on: { mount: event => void mounts.push(event) }
      }
    );
    expect(el.querySelector('svg')).toBe(server);
    expect(points(el)).toEqual(serverPoints);
    expect(serverPoints[4].getAttributeNS(CT, 'value')).toBe('6');
    expect(mounts[0].hydration!.repaired).toBeGreaterThan(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns and draws a new svg when the structure doesn't match", () => {
    const { el, server, mounts } = takeOver('line', {
      data: { labels: [...week.labels, 'Sat'], series: [[12, 9, 7, 8, 5, 6]] }
    });
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toMatch(
      /doesn't match the chart.*svg > g\[\d+\]/
    );
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(server);
    expect(points(el)).toHaveLength(6);
    expect(mounts.map(event => event.cause)).toEqual(['create']);
  });

  it.each([
    ['of an unknown version', '{"v":2,"width":600,"height":300}'],
    ["that doesn't parse", 'yes']
  ])('warns about a marker %s and draws a new svg', (_, marker) => {
    const el = container(renderForHydration(lineChartConfig(week), SERVER));
    const server = el.querySelector('svg')!;
    server.setAttribute('data-ct-hydrate', marker);
    const mounts: MountEvent[] = [];
    lineChart(el, week, {
      renderer: liveDomRenderer(),
      on: { mount: event => void mounts.push(event) }
    });
    expect(mounts.map(event => event.cause)).toEqual(['create']);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(server);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toContain('data-ct-hydrate');
  });

  it('lays the chart out at a different size, keeping the svg', () => {
    const { el, server, mounts } = takeOver('line', { width: 343 });
    expect(mounts.map(event => event.cause)).toEqual(['hydrate', 'resize']);
    expect(el.querySelector('svg')).toBe(server);
    expect(server.hasAttribute('viewBox')).toBe(false);
    expect(server.hasAttribute('data-ct-hydrate')).toBe(false);
    const fresh = container('', 343);
    lineChart(fresh, week, { renderer: liveDomRenderer() });
    expect(normalized(server)).toBe(normalized(fresh.querySelector('svg')!));
  });

  it('patches the adopted elements on later updates', () => {
    const { el, server, serverPoints, mounts, handle } = takeOver();
    handle.update({ data: { ...week, series: [[1, 2, 3, 4, 5]] } });
    expect(el.querySelector('svg')).toBe(server);
    expect(points(el)).toEqual(serverPoints);
    expect(serverPoints[0].getAttributeNS(CT, 'value')).toBe('1');
    const update = mounts.at(-1)!;
    expect(update.cause).toBe('update');
    const pointChanges = update.changes.filter(
      change => change.node.role === 'point'
    );
    expect(pointChanges.map(change => change.op)).toEqual(
      Array(5).fill('update')
    );
  });

  it('gives mount plugins the adopted elements as added', () => {
    const clicks: Element[] = [];
    const tooltip: ChartPlugin = {
      name: 'tooltip',
      install: handle =>
        handle.on('mount', ({ changes, elementOf }) => {
          for (const { op, node } of changes) {
            const element = elementOf(node);
            if (op === 'add' && node.role === 'point' && element) {
              const title = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'title'
              );
              title.textContent = String(node.ctx.value);
              element.append(title);
              element.addEventListener('click', () => clicks.push(element));
            }
          }
        })
    };
    const el = container(renderForHydration(lineChartConfig(week), SERVER));
    const serverPoints = points(el);
    const handle = lineChart(el, week, {
      renderer: liveDomRenderer(),
      plugins: [tooltip]
    });
    const titles = () =>
      points(el).map(point => point.querySelectorAll('title').length);
    expect(titles()).toEqual([1, 1, 1, 1, 1]);
    serverPoints[2].dispatchEvent(new Event('click'));
    expect(clicks).toEqual([serverPoints[2]]);
    handle.update({ data: { ...week, series: [[1, 2, 3, 4, 5]] } });
    expect(titles()).toEqual([1, 1, 1, 1, 1]);
  });
});

describe('live/liveDomRenderer: the adopt option', () => {
  it('adopts by default and patches the server svg on update', () => {
    const { el, server, handle } = takeOver();
    handle.update({ data: { ...week, series: [[3, 2, 1, 2, 3]] } });
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).toBe(server);
  });

  it('draws a new svg with adopt: false, and patches that one', () => {
    const el = container(renderForHydration(lineChartConfig(week), SERVER));
    const server = el.querySelector('svg');
    const handle = lineChart(el, week, {
      renderer: liveDomRenderer({ adopt: false })
    });
    const svg = el.querySelector('svg');
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(svg).not.toBe(server);
    handle.update({ data: { ...week, series: [[3, 2, 1, 2, 3]] } });
    expect(el.querySelector('svg')).toBe(svg);
    expect(warn).not.toHaveBeenCalled();
  });

  it('leaves the default renderer drawing a new svg, without a warning', () => {
    const el = container(renderForHydration(lineChartConfig(week), SERVER));
    const server = el.querySelector('svg');
    lineChart(el, week);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(server);
    expect(warn).not.toHaveBeenCalled();
  });
});
