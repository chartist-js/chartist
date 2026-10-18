import {
  chart,
  findAll,
  mapNodes,
  node,
  renderToString,
  toScene,
  type ChartConfig,
  type ChartHandle,
  type ChartPlugin,
  type DomRenderOutput,
  type Keyframes,
  type Layer,
  type RenderCause,
  type Renderer,
  type SceneChange,
  type PhaseEvents,
  type PlainNode,
  type RoleNode,
  type SceneNode,
  lineChart,
  domRenderer
} from 'chartist';

declare const layer: Layer;

describe('v2 types', () => {
  test('chart returns a chainable handle', () => {
    const handle = chart('#c', { data: { series: [] }, layers: [layer] });
    expectTypeOf(handle).toEqualTypeOf<ChartHandle>();
    expectTypeOf(
      handle.on('scene', ({ scene }) => ({ scene }))
    ).toEqualTypeOf<ChartHandle>();
    expectTypeOf(
      handle.update({ className: 'x' })
    ).toEqualTypeOf<ChartHandle>();
    expectTypeOf(handle.destroy()).toEqualTypeOf<void>();
  });

  test('listeners are typed per phase', () => {
    const config: ChartConfig = {
      data: { series: [[1]] },
      layers: [layer],
      on: {
        prepare: ({ data }) => {
          expectTypeOf(data.series[0].values).toEqualTypeOf<
            readonly unknown[]
          >();
        },
        compose: n => (n.role === 'grid' ? null : undefined),
        layout: layout => {
          expectTypeOf(layout.area.width).toEqualTypeOf<number>();
          return layout;
        },
        mount: ({ elementOf, scene }) => {
          expectTypeOf(elementOf(scene)).toEqualTypeOf<Element | undefined>();
        }
      }
    };
    expectTypeOf(config).toExtend<ChartConfig>();
    const bad: ChartConfig = {
      data: { series: [] },
      layers: [],
      on: {
        // @ts-expect-error only compose listeners may drop with null
        scene: () => null
      }
    };
    void bad;
  });

  test('plugins are typed objects', () => {
    const plugin: ChartPlugin<{ size: number }> = {
      name: 'p',
      install(handle, options) {
        expectTypeOf(handle).toEqualTypeOf<ChartHandle>();
        expectTypeOf(options).toEqualTypeOf<{ size: number } | undefined>();
      }
    };
    expectTypeOf(plugin.name).toEqualTypeOf<string>();
  });

  test('scene functions', () => {
    const n = node('g', { x: 1 }, 'a');
    expectTypeOf(n).toEqualTypeOf<PlainNode>();
    expectTypeOf(
      n.addClass('b').attr({ y: undefined })
    ).toEqualTypeOf<PlainNode>();
    expectTypeOf(findAll(n, { role: 'point' })).toEqualTypeOf<
      RoleNode<'point'>[]
    >();
    expectTypeOf(findAll(n)).toEqualTypeOf<SceneNode[]>();
    expectTypeOf(
      mapNodes(n, () => undefined)
    ).toEqualTypeOf<SceneNode | null>();
    expectTypeOf(n.attrs).toEqualTypeOf<
      Readonly<Record<string, string | number>>
    >();
    // @ts-expect-error nodes are read-only
    n.classes = [];
  });

  test('toScene and renderToString', () => {
    const scene = toScene(
      { data: { series: [] }, layers: [] },
      { width: 1, height: 1 }
    );
    expectTypeOf(scene).toEqualTypeOf<SceneNode>();
    expectTypeOf(renderToString(scene)).toEqualTypeOf<string>();
    expectTypeOf<PhaseEvents['compose']>().toEqualTypeOf<SceneNode>();
  });
});

describe('render lifecycle types (v2)', () => {
  test('mount listeners may return a cleanup, or anything else', () => {
    const handle = chart('#c', { data: { series: [] }, layers: [layer] });
    handle.on('mount', ({ cause, changes, previous, animation }) => {
      expectTypeOf(cause).toEqualTypeOf<RenderCause>();
      expectTypeOf(changes).toEqualTypeOf<readonly SceneChange[]>();
      expectTypeOf(previous).toEqualTypeOf<SceneNode | undefined>();
      expectTypeOf(animation?.duration).toEqualTypeOf<number | undefined>();
      return () => undefined;
    });
    handle.on('mount', () => handle.detach());
  });

  test('render and mount carry what a hydrate render repaired', () => {
    const handle = chart('#c', { data: { series: [] }, layers: [layer] });
    handle.on('mount', ({ cause, hydration }) => {
      expectTypeOf(hydration).toEqualTypeOf<
        { readonly repaired: number } | undefined
      >();
      if (cause === 'hydrate') {
        expectTypeOf(hydration?.repaired).toEqualTypeOf<number | undefined>();
      }
    });
    handle.on('render', ({ hydration }) => {
      expectTypeOf(hydration?.repaired).toEqualTypeOf<number | undefined>();
    });
  });

  test('renderers may adopt markup, or not', () => {
    const dom = domRenderer();
    // Without adopt, as before.
    const plain: Renderer<DomRenderOutput> = { ...dom };
    expectTypeOf(plain.adopt).toEqualTypeOf<
      | ((
          scene: SceneNode,
          svg: SVGSVGElement
        ) => (DomRenderOutput & { readonly repaired: number }) | undefined)
      | undefined
    >();
    const adopting: Renderer<DomRenderOutput> = {
      ...dom,
      adopt: (scene, svg) => {
        expectTypeOf(scene).toEqualTypeOf<SceneNode>();
        expectTypeOf(svg).toEqualTypeOf<SVGSVGElement>();
        return {
          svg,
          elementOf: () => undefined,
          remove: () => svg.remove(),
          repaired: 0
        };
      }
    };
    // @ts-expect-error adopt returns the output with repaired
    const missing: Renderer = { ...dom, adopt: () => ({}) };
    lineChart('#c', { series: [[1]] }, { renderer: adopting });
    lineChart('#c', { series: [[1]] }, { renderer: missing });
  });

  test('plugins may return a cleanup from install and give keyframes', () => {
    const plugin: ChartPlugin = {
      name: 'needle',
      install: () => () => undefined,
      keyframes: (_previous, _next, progress) =>
        progress.map(at => ({ transform: `rotate(${at * 90})` }))
    };
    expectTypeOf(plugin.keyframes).toEqualTypeOf<
      | ((
          previous: SceneNode,
          next: SceneNode,
          progress: readonly number[]
        ) => Keyframes | undefined)
      | undefined
    >();
  });

  test('renderers take the previous render as a third argument', () => {
    const dom = domRenderer();
    // A wrapper that passes the update on has the DOM renderer's output.
    const renderer: Renderer<DomRenderOutput> = {
      ...dom,
      render: (scene, target, update) => {
        expectTypeOf(update?.cause).toEqualTypeOf<RenderCause | undefined>();
        return dom.render(scene, target, update);
      }
    };
    lineChart('#c', { series: [[1]] }, { renderer });
    // The renderer can't change after the chart is created.
    // @ts-expect-error renderer isn't an option of setOptions
    lineChart('#c', { series: [[1]] }).setOptions({ renderer });
  });
});
