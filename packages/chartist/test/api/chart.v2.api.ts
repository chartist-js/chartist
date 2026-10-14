import {
  chart,
  domRenderer,
  findAll,
  type DomRenderOutput,
  type PhaseEvents,
  type Renderer,
  type SceneNode
} from 'chartist';
import { container } from './fixture.ts';
import { dotsLayer } from './layers.v2.ts';

const data = { series: [[1, 2, 3]] };

describe('chart() (v2 functional API)', () => {
  test('renders synchronously and returns a handle', () => {
    const el = container();
    const handle = chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200
    });
    expect(el.querySelectorAll('circle.dot')).toHaveLength(3);
    expect(Object.keys(handle).sort()).toEqual([
      'container',
      'destroy',
      'detach',
      'emit',
      'off',
      'on',
      'update'
    ]);
  });

  test('config listeners receive the first render, mount gets live elements', () => {
    const el = container();
    const mounted = vi.fn();
    let first: Element | undefined;
    chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200,
      on: {
        mount: ({ scene, elementOf }) => {
          mounted();
          first = elementOf(findAll(scene, { role: 'point' })[0]);
        }
      }
    });
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(first).toBe(el.querySelector('circle'));
  });

  test('update and destroy', () => {
    const el = container();
    const handle = chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200
    });
    handle.update({ data: { series: [[1]] } });
    expect(el.querySelectorAll('circle')).toHaveLength(1);
    handle.destroy();
    expect(el.querySelector('svg')).toBeNull();
  });

  test('a v2 plugin installs with options before the first render', () => {
    const el = container();
    const install = vi.fn((handle, options: { cls: string }) => {
      handle.on('compose', (n: SceneNode) =>
        n.role === 'point' ? n.addClass(options.cls) : undefined
      );
    });
    chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200,
      plugins: [[{ name: 'mark', install }, { cls: 'marked' }]]
    });
    expect(install).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('circle.marked')).toHaveLength(3);
  });
});

describe('custom layers (chart-composition spec)', () => {
  test('a user-defined layer renders, and compose listeners see role and context', () => {
    const el = container();
    const composed: PhaseEvents['compose'][] = [];
    chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200,
      on: { compose: n => void composed.push(n) }
    });
    const points = composed.filter(n => n.role === 'point');
    expect(
      points.map(p => [p.ctx?.seriesIndex, p.ctx?.valueIndex, p.ctx?.value])
    ).toEqual([
      [0, 0, 1],
      [0, 1, 2],
      [0, 2, 3]
    ]);
    expect(el.querySelectorAll('circle')).toHaveLength(3);
  });

  test('layers render in declaration order', () => {
    const el = container();
    chart(el, {
      data,
      layers: [dotsLayer('first'), dotsLayer('second')],
      width: 400,
      height: 200
    });
    const classes = Array.from(el.querySelectorAll('circle'), c =>
      c.getAttribute('class')
    );
    expect(classes).toEqual([
      'first',
      'first',
      'first',
      'second',
      'second',
      'second'
    ]);
  });

  test('a layer in an unsupported coordinate system fails with a named error', () => {
    expect(() =>
      chart(container(), {
        data,
        layers: [dotsLayer()],
        coordinates: 'polar',
        width: 400,
        height: 200
      })
    ).toThrow('Layer "dots" does not support polar coordinates');
  });

  test('nodes without keys get layer/series/value keys', () => {
    const el = container();
    const keys: (string | undefined)[] = [];
    chart(el, {
      data: { series: [[1], [2]] },
      layers: [dotsLayer(), dotsLayer()],
      width: 400,
      height: 200,
      on: {
        scene: ({ scene }) =>
          void keys.push(...findAll(scene, { role: 'point' }).map(p => p.key))
      }
    });
    expect(keys).toEqual(['0/0/0', '0/1/0', '1/0/0', '1/1/0']);
  });
});

describe('pipeline events (chart-pipeline spec)', () => {
  test('transform by returning a value; returning nothing keeps the payload', () => {
    const el = container();
    let seenByLater: unknown;
    let original: unknown;
    chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200,
      on: {
        prepare: payload => {
          original = payload;
          return {
            data: {
              ...payload.data,
              series: [...payload.data.series, { values: [4] }]
            }
          };
        }
      },
      plugins: [
        {
          name: 'observer',
          install: handle =>
            handle.on('prepare', payload => {
              seenByLater = payload;
            })
        }
      ]
    });
    expect(el.querySelectorAll('g.ct-series')).toHaveLength(2);
    // The plugin registered first, so it saw the original payload, unchanged.
    expect(seenByLater).toBe(original);
    expect((original as PhaseEvents['prepare']).data.series).toHaveLength(1);
  });

  test('a layout listener can reserve space for a legend', () => {
    const el = container();
    chart(el, {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200,
      on: {
        layout: layout => ({
          ...layout,
          area: {
            ...layout.area,
            y1: layout.area.y1 - 40,
            height: layout.area.height - 40
          }
        })
      }
    });
    // Bottom edge 200 - 5 (padding) - 40 (reserved); the dot sits at value 1.
    expect(el.querySelector('circle')!.getAttribute('cy')).toBe('154');
  });

  test('phases run in order', () => {
    const names: string[] = [];
    chart(container(), {
      data,
      layers: [dotsLayer()],
      width: 400,
      height: 200,
      on: { '*': name => void names.push(name) }
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
  });
});

describe('domRenderer (v2)', () => {
  test('a custom renderer can wrap the DOM renderer', () => {
    const el = container();
    const dom = domRenderer();
    const renderer: Renderer<DomRenderOutput> = {
      ...dom,
      render(scene, target) {
        const output = dom.render(scene, target);
        output.svg.setAttribute('role', 'img');
        return output;
      }
    };
    chart(el, { data, layers: [dotsLayer()], renderer });
    expect(el.querySelector('svg')?.getAttribute('role')).toBe('img');
    expect(el.querySelectorAll('circle.dot')).toHaveLength(3);
  });
});
