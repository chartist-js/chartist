import { compat } from '../compat';
import { LineChart } from '../charts/LineChart';
import { line } from '../layers/line';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import type { Layer, RenderEvent } from '../pipeline/types';
import { lineChart } from '../presets/lineChart';
import { domRenderer } from '../render/dom';
import type { DomRenderOutput } from '../render/dom';
import type { RenderUpdate, Renderer, SceneChange } from '../render/types';
import { node, type SceneNode } from '../scene/node';
import { findAll } from '../scene/tree';
import { chart } from './chart';
import type { ChartConfig, ChartPlugin } from './types';

/** A container with a fixed size (jsdom has no layout). */
function container(width = 400, height = 200) {
  const element = document.createElement('div');
  const size = { width, height };
  Object.defineProperties(element, {
    clientWidth: { get: () => size.width },
    clientHeight: { get: () => size.height }
  });
  document.body.appendChild(element);
  return { element, size };
}

/** A ResizeObserver stub the test triggers by hand. */
function stubResizeObserver() {
  const callbacks: (() => void)[] = [];
  vi.stubGlobal(
    'ResizeObserver',
    function ResizeObserver(this: unknown, callback: () => void) {
      callbacks.push(callback);
      return { observe: () => undefined, disconnect: () => undefined };
    }
  );
  return () => callbacks.forEach(callback => callback());
}

/**
 * The DOM renderer, recording the updates it gets. With `patch`, it
 * claims to have patched and returns the given changes.
 */
function recordingRenderer(
  patch?: (update: RenderUpdate<DomRenderOutput>) => readonly SceneChange[]
) {
  const dom = domRenderer();
  const updates: (RenderUpdate<DomRenderOutput> | undefined)[] = [];
  const renderer: Renderer<DomRenderOutput> = {
    ...dom,
    render(scene, target, update) {
      updates.push(update);
      const output = dom.render(scene, target);
      return update && patch
        ? { ...output, patched: true, changes: patch(update) }
        : output;
    }
  };
  return { renderer, updates };
}

const config = (extra: Partial<ChartConfig> = {}): ChartConfig => ({
  data: { labels: ['a', 'b', 'c'], series: [[1, 2, 3]] },
  axes: cartesianAxes([
    { id: 'x', side: 'bottom', type: stepAxis() },
    { id: 'y', side: 'left', type: autoScaleAxis() }
  ]),
  layers: [line()],
  ...extra
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('render causes and changes', () => {
  it('names the cause of each render', () => {
    const resize = stubResizeObserver();
    const { element, size } = container();
    const causes: string[] = [];
    const handle = chart(
      element,
      config({ on: { mount: ({ cause }) => void causes.push(cause) } })
    );
    handle.update({ data: { series: [[3, 2, 1]] } });
    size.width = 300;
    resize();
    expect(causes).toEqual(['create', 'update', 'resize']);
  });

  it('names responsive renders', () => {
    const { element } = container();
    let changed: (() => void) | undefined;
    const causes: string[] = [];
    chart(element, {
      ...config({ on: { mount: ({ cause }) => void causes.push(cause) } }),
      responsive: {
        entries: [],
        watch: (_target, onChange) => {
          changed = onChange;
          return { matching: [], check: () => false, stop: () => undefined };
        }
      }
    });
    changed?.();
    expect(causes).toEqual(['create', 'responsive']);
  });

  it('describes the first render as adding every node', () => {
    const { element } = container();
    let event: RenderEvent | undefined;
    chart(
      element,
      config({ on: { render: payload => void (event = payload) } })
    );
    const nodes = findAll(event!.scene, {});
    expect(event!.previous).toBeUndefined();
    expect(event!.changes.every(change => change.op === 'add')).toBe(true);
    expect(event!.changes.map(change => change.node)).toEqual(nodes);
  });

  it('describes a render by the DOM renderer as a replacement', () => {
    const { element } = container();
    const events: (RenderEvent & {
      elementOf: (node: SceneNode) => Element | undefined;
    })[] = [];
    const handle = chart(
      element,
      config({ on: { mount: event => void events.push(event) } })
    );
    const before = events[0].scene;
    handle.update({ data: { series: [[3, 2, 1]] } });
    const { changes, previous, elementOf, cause } = events[1];
    expect(cause).toBe('update');
    expect(previous).toBe(before);
    const removed = changes.filter(change => change.op === 'remove');
    const added = changes.filter(change => change.op === 'add');
    expect(removed.map(change => change.node)).toEqual(findAll(before, {}));
    expect(added[0].node).toBe(events[1].scene);
    expect(changes.some(change => change.op === 'update')).toBe(false);
    // A removed node's element is the one just taken out of the page.
    const oldSvg = elementOf(before);
    expect(oldSvg?.isConnected).toBe(false);
    expect(elementOf(events[1].scene)?.isConnected).toBe(true);
  });

  it('hands a renderer the previous render from the second render on', () => {
    const { element } = container();
    const { renderer, updates } = recordingRenderer();
    const scenes: SceneNode[] = [];
    const handle = chart(
      element,
      config({
        renderer,
        on: { scene: ({ scene }) => void scenes.push(scene) }
      })
    );
    handle.update({ data: { labels: ['x', 'y', 'z'], series: [[3, 2, 1]] } });
    expect(updates[0]).toBeUndefined();
    const update = updates[1]!;
    expect(update.previousScene).toBe(scenes[0]);
    expect(update.previous.svg.isConnected).toBe(false);
    expect(update.cause).toBe('update');
    expect(update.labels).toEqual(['x', 'y', 'z']);
    expect(update.previousLabels).toEqual(['a', 'b', 'c']);
  });

  it('passes on the changes of a renderer that patched', () => {
    const { element } = container();
    const custom: SceneChange[] = [];
    const { renderer } = recordingRenderer(update => {
      custom.push({
        op: 'update',
        node: update.previousScene,
        previous: update.previousScene
      });
      return custom;
    });
    const seen: (readonly SceneChange[])[] = [];
    const handle = chart(
      element,
      config({
        renderer,
        on: { mount: ({ changes }) => void seen.push(changes) }
      })
    );
    handle.update({ data: { series: [[3, 2, 1]] } });
    expect(seen[1]).toBe(custom);
  });

  it('passes the animation timing a renderer returned into mount', () => {
    const { element } = container();
    const dom = domRenderer();
    const renderer: Renderer = {
      ...dom,
      render: (scene, target, update) => ({
        ...dom.render(scene, target),
        ...(update && { animation: { duration: 300, easing: 'ease-out' } })
      })
    };
    const timings: unknown[] = [];
    const handle = chart(
      element,
      config({
        renderer,
        on: { mount: ({ animation }) => void timings.push(animation) }
      })
    );
    handle.update({});
    expect(timings).toEqual([undefined, { duration: 300, easing: 'ease-out' }]);
  });

  it('never hands the previous render to 1.x code', () => {
    const { element } = container();
    const { renderer, updates } = recordingRenderer(() => []);
    const handle = lineChart(
      element,
      { series: [[1, 2]] },
      { renderer, plugins: [compat] }
    );
    handle.update({ data: { series: [[2, 1]] } });
    expect(updates).toEqual([undefined, undefined]);
  });

  it('marks the 1.x classes as replacing their output', () => {
    const { element } = container();
    let handle: object | undefined;
    const capture: ChartPlugin = {
      name: 'capture',
      install: chartHandle => void (handle = chartHandle)
    };
    new LineChart(
      element,
      { series: [[1, 2]] },
      { plugins: [capture] }
    ).initialize();
    expect(
      (handle as Record<symbol, unknown>)[Symbol.for('chartist.replacesOutput')]
    ).toBe(true);
  });
});

describe('cleanup after mount', () => {
  it('runs a mount cleanup before the next render and on destroy', () => {
    const { element } = container();
    const calls: string[] = [];
    let renders = 0;
    const handle = chart(
      element,
      config({
        on: {
          mount: () => {
            const render = ++renders;
            calls.push(`mount ${render}`);
            return () => calls.push(`cleanup ${render}`);
          },
          render: () => void calls.push('render')
        }
      })
    );
    handle.update({});
    handle.destroy();
    handle.destroy();
    expect(calls).toEqual([
      'render',
      'mount 1',
      'cleanup 1',
      'render',
      'mount 2',
      'cleanup 2'
    ]);
  });

  it('runs cleanups in registration order, all of them when one throws', () => {
    const { element } = container();
    const calls: string[] = [];
    const handle = chart(element, config());
    handle.on('mount', () => () => {
      calls.push('first');
      throw new Error('first failed');
    });
    handle.on('mount', () => () => void calls.push('second'));
    handle.update({});
    expect(() => handle.update({})).toThrow('first failed');
    expect(calls).toEqual(['first', 'second']);
  });

  it('ignores values other than functions, so a detach in mount type-checks', () => {
    const { element } = container();
    const handle = chart(element, config());
    handle.on('mount', () => handle.detach());
    expect(() => handle.update({})).not.toThrow();
  });

  it('runs no cleanup on detach', () => {
    const { element } = container();
    const cleanup = vi.fn();
    const handle = chart(element, config({ on: { mount: () => cleanup } }));
    handle.detach();
    expect(cleanup).not.toHaveBeenCalled();
  });
});

describe('plugin cleanup', () => {
  it('runs the install cleanups after the output is removed, in reverse order, once', () => {
    const { element } = container();
    const calls: string[] = [];
    const plugin = (name: string): ChartPlugin => ({
      name,
      install: chartHandle => {
        chartHandle.on(
          'mount',
          () => () => calls.push(`mount cleanup ${name}`)
        );
        return () =>
          calls.push(
            `${name}: svg ${element.querySelector('svg') ? 'there' : 'gone'}`
          );
      }
    });
    const handle = chart(
      element,
      config({ plugins: [plugin('a'), plugin('b')] })
    );
    handle.detach();
    expect(calls).toEqual([]);
    handle.destroy();
    handle.destroy();
    expect(calls).toEqual([
      'mount cleanup a',
      'mount cleanup b',
      'b: svg gone',
      'a: svg gone'
    ]);
  });

  it('ignores what install returns besides a function', () => {
    const { element } = container();
    const plugin: ChartPlugin = {
      name: 'chained',
      install: chartHandle => chartHandle.on('render', () => undefined)
    };
    const handle = chart(element, config({ plugins: [plugin] }));
    expect(() => handle.destroy()).not.toThrow();
  });
});

describe('keyframes', () => {
  /** A renderer that asks for the keyframes of a node on every update. */
  function askingRenderer(pick: (scene: SceneNode) => SceneNode | undefined) {
    const dom = domRenderer();
    const answers: unknown[] = [];
    const renderer: Renderer = {
      ...dom,
      render(scene, target, update) {
        const next = pick(scene);
        const previous = update && pick(update.previousScene);
        if (update && next && previous) {
          answers.push(update.keyframes(previous, next, [0, 0.5, 1]));
        }
        return dom.render(scene, target);
      }
    };
    return { renderer, answers };
  }
  const firstLine = (scene: SceneNode) => findAll(scene, { role: 'line' })[0];

  it('asks plugins in order, then the layer that drew the node', () => {
    const { element } = container();
    const { renderer, answers } = askingRenderer(firstLine);
    const calls: string[] = [];
    const layer: Layer = {
      ...line(),
      keyframes: (_previous, _next, context, progress) => {
        calls.push(`layer ${context.layerIndex}`);
        return progress.map(at => ({ d: `layer ${at}` }));
      }
    };
    const silent: ChartPlugin = {
      name: 'silent',
      install: () => undefined,
      keyframes: () => void calls.push('silent')
    };
    const handle = chart(
      element,
      config({ renderer, layers: [layer], plugins: [silent] })
    );
    handle.update({ data: { series: [[3, 2, 1]] } });
    expect(calls).toEqual(['silent', 'layer 0']);
    expect(answers[0]).toEqual([
      { d: 'layer 0' },
      { d: 'layer 0.5' },
      { d: 'layer 1' }
    ]);
  });

  it('takes the first plugin that answers', () => {
    const { element } = container();
    const { renderer, answers } = askingRenderer(firstLine);
    const layer: Layer = { ...line(), keyframes: () => [{ d: 'layer' }] };
    const plugin: ChartPlugin = {
      name: 'turn',
      install: () => undefined,
      keyframes: () => [{ d: 'plugin' }]
    };
    const handle = chart(
      element,
      config({ renderer, layers: [layer], plugins: [plugin] })
    );
    handle.update({ data: { series: [[3, 2, 1]] } });
    expect(answers[0]).toEqual([{ d: 'plugin' }]);
  });

  it('asks only plugins for nodes no layer drew', () => {
    const { element } = container();
    const pickNeedle = (scene: SceneNode) =>
      scene.children.find(child => child.classes.includes('needle'));
    const { renderer, answers } = askingRenderer(pickNeedle);
    const layer: Layer = { ...line(), keyframes: () => [{ d: 'layer' }] };
    const handle = chart(
      element,
      config({
        renderer,
        layers: [layer],
        on: {
          scene: ({ scene }) => ({
            scene: scene.append(node('path', { d: 'M0 0' }, 'needle'))
          })
        }
      })
    );
    handle.update({});
    expect(answers[0]).toBeUndefined();
  });

  it("computes nothing when the renderer doesn't ask", () => {
    const { element } = container();
    const keyframes = vi.fn(() => undefined);
    const handle = chart(
      element,
      config({ plugins: [{ name: 'p', install: () => undefined, keyframes }] })
    );
    handle.update({});
    expect(keyframes).not.toHaveBeenCalled();
  });
});

describe('presets take a renderer', () => {
  it('renders a preset with the given renderer on every render', () => {
    const { element } = container();
    const { renderer, updates } = recordingRenderer();
    const handle = lineChart(element, { series: [[1, 2, 3]] }, { renderer });
    handle.update({ data: { series: [[3, 2, 1]] } });
    handle.setOptions({ showArea: true });
    expect(updates.length).toBe(3);
    expect(updates[2]?.cause).toBe('update');
  });
});

describe('history', () => {
  it('builds the same scene after updates as a fresh chart', () => {
    const scenes: SceneNode[] = [];
    const first = container();
    const handle = chart(
      first.element,
      config({ on: { scene: ({ scene }) => void scenes.push(scene) } })
    );
    handle.update({ data: { labels: ['x', 'y'], series: [[5, 1]] } });
    const second = container();
    chart(
      second.element,
      config({
        data: { labels: ['x', 'y'], series: [[5, 1]] },
        on: { scene: ({ scene }) => void scenes.push(scene) }
      })
    );
    // What's rendered: element names, attributes, classes, text and keys.
    const rendered = (current: SceneNode): unknown => ({
      name: current.name,
      attrs: current.attrs,
      classes: current.classes,
      content: current.content,
      key: current.key,
      children: current.children.map(rendered)
    });
    expect(rendered(scenes[1])).toEqual(rendered(scenes[2]));
  });
});
