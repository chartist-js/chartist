import { spyOnStyleAttributes } from '../../test/style-spy';
import {
  barChart,
  lineChart,
  lineChartConfig,
  node,
  pieChart,
  toScene,
  type DomRenderOutput,
  type PhaseEvents,
  type Renderer,
  type SceneChange
} from '../index';
import { diffScenes } from './diff';
import { liveDomRenderer } from './renderer';
import type { LiveAnimationContext } from './types';

const SIZE = { width: 400, height: 200 };

type MountEvent = PhaseEvents['mount'];

function container() {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return element;
}

const points = (element: Element) =>
  Array.from(element.querySelectorAll('.ct-point'));
const bars = (element: Element) =>
  Array.from(element.querySelectorAll('.ct-bar'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('live/liveDomRenderer', () => {
  it('keeps the svg of a preset that opts in', () => {
    const element = container();
    const chart = lineChart(
      element,
      { series: [[1, 2, 3]] },
      { ...SIZE, renderer: liveDomRenderer() }
    );
    const svg = element.querySelector('svg');
    chart.update({ data: { series: [[3, 2, 1]] } });
    expect(element.querySelectorAll('svg')).toHaveLength(1);
    expect(element.querySelector('svg')).toBe(svg);
  });

  it('draws a new svg without it', () => {
    const element = container();
    const chart = lineChart(element, { series: [[1, 2, 3]] }, SIZE);
    const svg = element.querySelector('svg');
    chart.update({ data: { series: [[3, 2, 1]] } });
    expect(element.querySelector('svg')).not.toBe(svg);
  });

  it('changes only the attributes of the changed value', () => {
    const element = container();
    const chart = lineChart(
      element,
      { series: [[1, 2, 3, 4, 5]] },
      { ...SIZE, low: 0, high: 10, renderer: liveDomRenderer() }
    );
    const before = points(element);
    const y = before[2].getAttribute('y1');
    const observer = new MutationObserver(() => undefined);
    observer.observe(element, { attributes: true, subtree: true });
    chart.update({ data: { series: [[1, 2, 9, 4, 5]] } });
    const records = observer.takeRecords();
    observer.disconnect();
    const after = points(element);
    expect(after).toEqual(before);
    after.forEach((point, i) => expect(point).toBe(before[i]));
    expect(after[2].getAttribute('y1')).not.toBe(y);
    const written = new Set(records.map(record => record.target));
    expect(written.has(after[2])).toBe(true);
    expect([0, 1, 3, 4].some(i => written.has(after[i]))).toBe(false);
  });

  it('creates the element of a value more after the others', () => {
    const element = container();
    const chart = lineChart(
      element,
      { series: [[1, 2, 3, 4, 5]] },
      { ...SIZE, renderer: liveDomRenderer() }
    );
    const before = points(element);
    chart.update({ data: { series: [[1, 2, 3, 4, 5, 6]] } });
    const after = points(element);
    expect(after).toHaveLength(6);
    before.forEach((point, i) => expect(after[i]).toBe(point));
    expect(after[4].nextElementSibling).toBe(after[5]);
  });

  it('keeps the elements on a resize', () => {
    const element = container();
    const chart = lineChart(
      element,
      { series: [[1, 2, 3]] },
      { ...SIZE, renderer: liveDomRenderer() }
    );
    const before = points(element);
    const x = before[2].getAttribute('x1');
    chart.setOptions({ width: 300 });
    const after = points(element);
    after.forEach((point, i) => expect(point).toBe(before[i]));
    expect(after[2].getAttribute('x1')).not.toBe(x);
  });

  it('keeps what listeners added to kept elements', () => {
    const element = container();
    const chart = barChart(
      element,
      { series: [[1, 2, 3]] },
      {
        ...SIZE,
        renderer: liveDomRenderer(),
        on: {
          mount: ({ changes, elementOf }) => {
            for (const { op, node } of changes) {
              const bar =
                op === 'add' && node.role === 'bar' && elementOf(node);
              if (bar) {
                const title = document.createElementNS(
                  'http://www.w3.org/2000/svg',
                  'title'
                );
                title.textContent = 'A bar';
                bar.appendChild(title);
                bar.setAttribute('tabindex', '0');
                bar.classList.add('focusable');
              }
            }
          }
        }
      }
    );
    chart.update({ data: { series: [[3, 1, 2]] } });
    for (const bar of bars(element)) {
      expect(bar.querySelector('title')?.textContent).toBe('A bar');
      expect(bar.getAttribute('tabindex')).toBe('0');
      expect(bar.classList.contains('focusable')).toBe(true);
    }
  });

  it('keeps children a listener added in place when their neighbors move', () => {
    const element = container();
    let marker: Element | undefined;
    const chart = lineChart(
      element,
      { series: [[1, 2, 3]] },
      {
        ...SIZE,
        renderer: liveDomRenderer(),
        on: {
          mount: ({ cause, output }) => {
            if (cause === 'create') {
              const { svg } = output as DomRenderOutput;
              const series = svg.querySelector('.ct-series')!;
              marker = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'desc'
              );
              // Right after the line, before the points.
              series.insertBefore(marker, series.querySelector('.ct-point'));
            }
          }
        }
      }
    );
    chart.setOptions({ showArea: true });
    chart.update({ data: { series: [[2, 3, 4, 5]] } });
    expect(marker!.previousElementSibling!.classList.contains('ct-line')).toBe(
      true
    );
    expect(marker!.nextElementSibling!.classList.contains('ct-point')).toBe(
      true
    );
    expect(element.querySelector('.ct-area')!.nextElementSibling).toBe(
      element.querySelector('.ct-line')
    );
  });

  it('sets styles through the CSSOM on kept and added elements', () => {
    const element = container();
    const chart = pieChart(
      element,
      { series: [1, 2] },
      { ...SIZE, donut: true, donutWidth: 20, renderer: liveDomRenderer() }
    );
    const spy = spyOnStyleAttributes();
    try {
      chart.setOptions({ donutWidth: 30 });
      chart.update({ data: { series: [1, 2, 3] } });
    } finally {
      spy.restore();
    }
    expect(spy.calls).toEqual([]);
    const slices = element.querySelectorAll<SVGElement>('.ct-slice-donut');
    expect(slices).toHaveLength(3);
    slices.forEach(slice => expect(slice.style.strokeWidth).toBe('30px'));
  });

  it('creates added HTML labels in the XHTML namespace', () => {
    const element = container();
    const chart = lineChart(
      element,
      { labels: ['a', 'b'], series: [[1, 2]] },
      { ...SIZE, renderer: liveDomRenderer({ key: 'label' }) }
    );
    chart.update({ data: { labels: ['a', 'b', 'c'], series: [[1, 2, 3]] } });
    const spans = element.querySelectorAll('foreignObject > span');
    expect(Array.from(spans, span => span.textContent)).toContain('c');
    spans.forEach(span =>
      expect(span.namespaceURI).toBe('http://www.w3.org/1999/xhtml')
    );
  });

  it('patches classes and text as a fresh render draws them', () => {
    const renderer = liveDomRenderer();
    const element = container();
    const scene = (classes: string, text: string) =>
      node('svg').append(
        node('text', { x: 1 }, classes, { key: 'label' }).text(text)
      );
    const first = scene('a b', 'one');
    const output = renderer.render(first, element);
    const label = output.svg.firstElementChild!;
    const title = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'title'
    );
    label.appendChild(title);
    const second = scene('', 'two');
    const update = {
      previous: output,
      previousScene: first,
      cause: 'update' as const,
      labels: [],
      previousLabels: [],
      keyframes: () => undefined
    };
    const patched = renderer.render(second, element, update);
    expect(patched.svg).toBe(output.svg);
    expect(label.hasAttribute('class')).toBe(false);
    expect(label.textContent).toBe('two');
    expect(label.lastChild).toBe(title);
    expect(patched.elementOf(second.children[0])).toBe(label);
  });

  it('passes one update for a changed bar to mount', () => {
    const element = container();
    const events: MountEvent[] = [];
    const chart = barChart(
      element,
      { series: [[5, 4, 3]] },
      {
        ...SIZE,
        low: 0,
        high: 10,
        renderer: liveDomRenderer(),
        on: { mount: event => void events.push(event) }
      }
    );
    chart.update({ data: { series: [[5, 8, 3]] } });
    const { cause, changes, output } = events[1];
    expect(cause).toBe('update');
    expect(output.patched).toBe(true);
    expect(changes).toHaveLength(1);
    const [change] = changes;
    expect(change.op).toBe('update');
    expect(change.node.role).toBe('bar');
    expect(change.previous!.attrs.y2).not.toBe(change.node.attrs.y2);
    expect(events[1].elementOf(change.node)).toBe(bars(element)[1]);
  });

  it('lets listeners act on new elements only', () => {
    const element = container();
    const listeners = new Map<Element, number>();
    const chart = barChart(
      element,
      { series: [[1, 2, 3]] },
      {
        ...SIZE,
        renderer: liveDomRenderer(),
        on: {
          mount: ({ changes, elementOf }) => {
            for (const { op, node } of changes) {
              const bar =
                op === 'add' && node.role === 'bar' && elementOf(node);
              if (bar) {
                bar.addEventListener('click', () => undefined);
                listeners.set(bar, (listeners.get(bar) ?? 0) + 1);
              }
            }
          }
        }
      }
    );
    chart.update({ data: { series: [[1, 2, 3, 4]] } });
    expect(bars(element)).toHaveLength(4);
    for (const bar of bars(element)) {
      expect(listeners.get(bar)).toBe(1);
    }
  });

  it('serves two charts with one instance', () => {
    const renderer = liveDomRenderer();
    const first = container();
    const second = container();
    const a = lineChart(first, { series: [[1, 2]] }, { ...SIZE, renderer });
    const b = lineChart(second, { series: [[5, 1]] }, { ...SIZE, renderer });
    const svgs = [first.querySelector('svg'), second.querySelector('svg')];
    a.update({ data: { series: [[2, 1]] } });
    b.update({ data: { series: [[1, 5, 3]] } });
    expect(first.querySelector('svg')).toBe(svgs[0]);
    expect(second.querySelector('svg')).toBe(svgs[1]);
    expect(points(first)).toHaveLength(2);
    expect(points(second)).toHaveLength(3);
  });

  it('draws a new svg for a wrapper that drops the update', () => {
    const live = liveDomRenderer();
    const renderer: Renderer<DomRenderOutput> = {
      ...live,
      render: (scene, target) => live.render(scene, target)
    };
    const element = container();
    const outputs: DomRenderOutput[] = [];
    const chart = lineChart(
      element,
      { series: [[1, 2]] },
      {
        ...SIZE,
        renderer,
        on: {
          mount: ({ output }) => void outputs.push(output as DomRenderOutput)
        }
      }
    );
    chart.update({ data: { series: [[2, 1]] } });
    expect(outputs[1].svg).not.toBe(outputs[0].svg);
    expect(outputs[1].patched).toBeUndefined();
    expect(element.querySelectorAll('svg')).toHaveLength(1);
  });

  it('returns the changes diffScenes() finds for the two scenes', () => {
    const element = container();
    const labels = ['Mo', 'Tu', 'We'];
    const next = ['Tu', 'We', 'Th'];
    let changes: readonly SceneChange[] = [];
    const chart = lineChart(
      element,
      { labels, series: [[1, 2, 3]] },
      {
        ...SIZE,
        renderer: liveDomRenderer({ key: 'label' }),
        on: { mount: event => void (changes = event.changes) }
      }
    );
    chart.update({ data: { labels: next, series: [[2, 3, 4]] } });
    const summary = (list: readonly SceneChange[]) =>
      list.map(({ op, node }) => `${op} ${node.name} ${node.key ?? ''}`);
    const size = { ...SIZE, labels: 'html' } as const;
    const expected = diffScenes(
      toScene(lineChartConfig({ labels, series: [[1, 2, 3]] }, SIZE), size),
      toScene(
        lineChartConfig({ labels: next, series: [[2, 3, 4]] }, SIZE),
        size
      ),
      { key: 'label', labels: next, previousLabels: labels }
    );
    expect(summary(changes)).toEqual(summary(expected));
    expect(changes.length).toBeGreaterThan(0);
  });

  it('hands its animations the patched render and returns their timing', () => {
    const element = container();
    const contexts: LiveAnimationContext[] = [];
    const animation = { duration: 300, easing: 'ease-out' };
    const animations: MountEvent['animation'][] = [];
    const chart = lineChart(
      element,
      { labels: ['a', 'b'], series: [[1, 2]] },
      {
        ...SIZE,
        renderer: liveDomRenderer({
          key: 'label',
          animations: {
            animate: context => {
              contexts.push(context);
              return animation;
            }
          }
        }),
        on: { mount: event => void animations.push(event.animation) }
      }
    );
    chart.update({ data: { labels: ['b', 'c'], series: [[2, 3]] } });
    expect(contexts).toHaveLength(1);
    const [context] = contexts;
    expect(context.container).toBe(element);
    expect(context.update.cause).toBe('update');
    expect(context.changes.length).toBeGreaterThan(0);
    expect(context.elementOf(context.scene)).toBe(element.querySelector('svg'));
    const value = { seriesIndex: 0, valueIndex: 0, value: 2, meta: undefined };
    expect(context.valueKey(value, 'next')).toBe('b');
    expect(context.valueKey(value, 'previous')).toBe('a');
    expect(animations).toEqual([undefined, animation]);
  });

  it('reads styles for its animations with the chart root classes', () => {
    const element = container();
    const style = document.createElement('style');
    style.textContent = '.ct-chart-line path.probe { --probe: 12ms; }';
    document.head.appendChild(style);
    let read: string | undefined;
    const chart = lineChart(
      element,
      { series: [[1, 2]] },
      {
        ...SIZE,
        renderer: liveDomRenderer({
          animations: {
            animate: ({ measureStyle }) => {
              read = measureStyle?.('--probe', { classes: ['probe'] });
              return undefined;
            }
          }
        })
      }
    );
    chart.update({ data: { series: [[2, 1]] } });
    style.remove();
    expect(read?.trim()).toBe('12ms');
  });
});
