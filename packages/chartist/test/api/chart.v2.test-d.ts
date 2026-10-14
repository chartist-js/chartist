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
  type Layer,
  type PhaseEvents,
  type PlainNode,
  type RoleNode,
  type SceneNode
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
