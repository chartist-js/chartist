import { dots } from '../../test/layers';
import type { PhaseEvents } from '../pipeline/types';
import { findAll } from '../scene/tree';
import { chart } from './chart';
import type { ChartPlugin } from './types';

/** A container with a controllable size (jsdom has no layout). */
function sizedContainer(width = 400, height = 200) {
  const element = document.createElement('div');
  const size = { width, height };
  Object.defineProperties(element, {
    clientWidth: { get: () => size.width },
    clientHeight: { get: () => size.height }
  });
  document.body.appendChild(element);
  return { element, size };
}

/** Minimal ResizeObserver stub that the test triggers by hand. */
function stubResizeObserver() {
  const observers: { callback: () => void; disconnected: boolean }[] = [];
  vi.stubGlobal(
    'ResizeObserver',
    function ResizeObserver(this: unknown, callback: () => void) {
      const entry = { callback, disconnected: false };
      observers.push(entry);
      return {
        observe: () => undefined,
        unobserve: () => undefined,
        disconnect: () => {
          entry.disconnected = true;
        }
      };
    }
  );
  return {
    trigger: () =>
      observers.filter(o => !o.disconnected).forEach(o => o.callback()),
    active: () => observers.filter(o => !o.disconnected).length
  };
}

const data = { series: [[1, 2, 3]] };

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('chart/chart', () => {
  it('renders synchronously into a selector or element target', () => {
    const { element } = sizedContainer();
    element.id = 'target';
    chart('#target', { data, layers: [dots()] });
    expect(element.querySelectorAll('circle')).toHaveLength(3);

    const other = sizedContainer().element;
    chart(other, { data, layers: [dots()] });
    expect(other.querySelector('svg')).not.toBeNull();
  });

  it('throws the 1.x error for a missing target', () => {
    expect(() => chart('#nope', { data, layers: [] })).toThrow(
      'Target element "#nope" is not found'
    );
  });

  it('lays out at the container size, with fixed sizes taking precedence', () => {
    const { element } = sizedContainer(500, 250);
    const layouts: PhaseEvents['layout'][] = [];
    chart(element, {
      data,
      layers: [dots()],
      on: { layout: layout => void layouts.push(layout) }
    });
    chart(element, {
      data,
      layers: [dots()],
      width: '300px',
      height: 120,
      on: { layout: layout => void layouts.push(layout) }
    });
    expect(layouts.map(l => [l.width, l.height])).toEqual([
      [500, 250],
      [300, 120]
    ]);
    const svg = element.querySelector('svg')!;
    expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual([
      '300px',
      '120'
    ]);
  });

  it('a responsive chart fills its container (100%)', () => {
    const { element } = sizedContainer();
    chart(element, { data, layers: [dots()] });
    const svg = element.querySelector('svg')!;
    expect([svg.getAttribute('width'), svg.getAttribute('height')]).toEqual([
      '100%',
      '100%'
    ]);
  });

  it('emits all phases, and mount gives live elements', () => {
    const { element } = sizedContainer();
    const names: string[] = [];
    let circle: Element | undefined;
    chart(element, {
      data,
      layers: [dots()],
      on: {
        '*': name => void names.push(name),
        mount: ({ scene, elementOf }) => {
          circle = elementOf(findAll(scene, { role: 'point' })[0]);
        }
      }
    });
    expect(names.filter((n, i) => n !== names[i - 1])).toEqual([
      'resolve',
      'prepare',
      'layout',
      'compose',
      'scene',
      'render',
      'mount'
    ]);
    expect(circle?.isConnected).toBe(true);
    expect(circle).toBe(element.querySelector('circle'));
  });

  it('installs v2 plugins with options before the first render', () => {
    const { element } = sizedContainer();
    const seen: string[] = [];
    const plugin: ChartPlugin<{ tag: string }> = {
      name: 'tagger',
      install(handle, options) {
        handle.on('compose', n =>
          n.role === 'point' ? n.addClass(options!.tag) : undefined
        );
        handle.on('mount', () => void seen.push('mount'));
      }
    };
    chart(element, {
      data,
      layers: [dots()],
      plugins: [[plugin, { tag: 'tagged' }]]
    });
    expect(element.querySelectorAll('circle.tagged')).toHaveLength(3);
    expect(seen).toEqual(['mount']);
  });

  it('skips 1.x plugin functions with a single warning', () => {
    const { element } = sizedContainer();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const legacy = vi.fn();
    const config = { data, layers: [dots()], plugins: [legacy as never] };
    chart(element, config);
    chart(element, config);
    expect(legacy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('compat plugin');
    warn.mockRestore();
  });

  it('update merges the config and renders again', () => {
    const { element } = sizedContainer();
    const handle = chart(element, { data, layers: [dots()] });
    expect(handle.update({ data: { series: [[1]] } })).toBe(handle);
    expect(element.querySelectorAll('circle')).toHaveLength(1);
    handle.update({ className: 'updated' });
    expect(element.querySelector('svg')!.getAttribute('class')).toBe('updated');
    expect(element.querySelectorAll('circle')).toHaveLength(1);
  });

  it('on and off return the handle and affect later renders', () => {
    const { element } = sizedContainer();
    const handle = chart(element, { data, layers: [dots()] });
    const listener = vi.fn();
    expect(handle.on('scene', listener)).toBe(handle);
    handle.update({});
    expect(listener).toHaveBeenCalledTimes(1);
    expect(handle.off('scene', listener)).toBe(handle);
    handle.update({});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('re-lays out on container resize, only when the size changed', () => {
    const resize = stubResizeObserver();
    const { element, size } = sizedContainer(400, 200);
    const phases: string[] = [];
    chart(element, {
      data,
      layers: [dots()],
      on: { '*': name => void phases.push(name) }
    });

    phases.length = 0;
    resize.trigger();
    expect(phases).toEqual([]);

    size.width = 300;
    resize.trigger();
    expect(phases[0]).toBe('layout');
    expect(phases).not.toContain('resolve');
    expect(phases).toContain('mount');
  });

  it('destroy removes the output, the observer and the listeners', () => {
    const resize = stubResizeObserver();
    const { element, size } = sizedContainer();
    const listener = vi.fn();
    const handle = chart(element, {
      data,
      layers: [dots()],
      on: { mount: listener }
    });
    expect(resize.active()).toBe(1);

    handle.destroy();
    expect(element.querySelector('svg')).toBeNull();
    expect(resize.active()).toBe(0);
    size.width = 100;
    resize.trigger();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(() => handle.destroy()).not.toThrow();
  });

  it('works without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { element } = sizedContainer();
    expect(() => chart(element, { data, layers: [dots()] })).not.toThrow();
  });
});
