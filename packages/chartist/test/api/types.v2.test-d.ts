/**
 * The v2 type contract (refine-typings): nodes narrow by role, queries and
 * builders keep their types, events and plugins are checked.
 */
import {
  barChart,
  chart,
  findAll,
  lineChart,
  node,
  withOptions,
  type ChartPlugin,
  type Layer,
  type RoleNode,
  type SceneNode,
  type ScaleAxis,
  type SvgPath
} from 'chartist';

declare const layer: Layer;
declare const scene: SceneNode;

// A plugin's own role and event, declared as plugins do.
declare module 'chartist' {
  interface NodeRoles {
    marker: { ctx: { readonly label: string }; attrs: { readonly cx: number } };
  }
  interface ChartEvents {
    'legend:click': { readonly seriesIndex: number };
  }
}

describe('v2 type contract', () => {
  test('checking the role narrows context and attributes', () => {
    if (scene.role === 'point') {
      expectTypeOf(scene.ctx.x).toEqualTypeOf<number>();
      expectTypeOf(scene.ctx.valueIndex).toEqualTypeOf<number>();
      expectTypeOf(scene.attrs.x2).toEqualTypeOf<number>();
      // @ts-expect-error: points have no path, lines and areas do
      void scene.ctx.path;
    }
    if (scene.role === 'line') {
      expectTypeOf(scene.ctx.path).toEqualTypeOf<SvgPath>();
    }
    if (scene.role === 'slice') {
      expectTypeOf(scene.ctx.seriesIndex).toEqualTypeOf<number>();
      expectTypeOf(scene.ctx.center).toEqualTypeOf<{
        readonly x: number;
        readonly y: number;
      }>();
    }
    if (scene.role === 'label' && scene.ctx.kind === 'axis') {
      expectTypeOf(scene.ctx.axis).toEqualTypeOf<ScaleAxis>();
    }
    if (scene.role === 'marker') {
      expectTypeOf(scene.ctx.label).toEqualTypeOf<string>();
    }
    // Any node: the series index reads as number | undefined.
    expectTypeOf(scene.ctx?.seriesIndex).toEqualTypeOf<number | undefined>();
  });

  test('queries and builders keep the role', () => {
    const bars = findAll(scene, { role: 'bar', seriesIndex: 0 });
    expectTypeOf(bars).toEqualTypeOf<RoleNode<'bar'>[]>();
    expectTypeOf(bars[0].addClass('x').attr({ y2: 3 })).toEqualTypeOf<
      RoleNode<'bar'>
    >();
    // Inferred type predicates narrow arrays too.
    const points = scene.children.filter(child => child.role === 'point');
    expectTypeOf(points).toEqualTypeOf<RoleNode<'point'>[]>();
  });

  test('node() checks a role node context', () => {
    const marker = node('circle', { cx: 1 }, 'ct-marker', {
      role: 'marker',
      ctx: { label: 'peak' }
    });
    expectTypeOf(marker).toEqualTypeOf<RoleNode<'marker'>>();
    // @ts-expect-error: a point needs its context
    node('line', {}, 'ct-point', { role: 'point' });
    // @ts-expect-error: roles are declared in NodeRoles
    node('g', {}, '', { role: 'undeclared' });
  });

  test('events are checked by name', () => {
    const handle = chart('#c', { data: { series: [] }, layers: [layer] });
    handle.on('legend:click', event => {
      expectTypeOf(event.seriesIndex).toEqualTypeOf<number>();
    });
    handle.emit('legend:click', { seriesIndex: 1 });
    // @ts-expect-error: a typo in a phase name
    handle.on('compsoe', () => undefined);
    // @ts-expect-error: the payload must match the declaration
    handle.emit('legend:click', { series: 1 });
    // @ts-expect-error: phase events can't be emitted
    handle.emit('scene', {});
  });

  test('plugins read the preset by its kind', () => {
    const reader: ChartPlugin = {
      name: 'reader',
      install(chart) {
        chart.on('resolve', ({ config }) => {
          if (config.preset?.kind === 'line') {
            expectTypeOf(config.preset.options.showArea).toEqualTypeOf<
              boolean | undefined
            >();
          }
          if (config.preset?.kind === 'bar') {
            expectTypeOf(config.preset.options.stackMode).toEqualTypeOf<
              | 'accumulate'
              | 'accumulate-relative'
              | 'overlap'
              | boolean
              | undefined
            >();
          }
        });
        chart.on('mount', ({ output }) => {
          expectTypeOf(output.elementOf).toEqualTypeOf<
            ((node: SceneNode) => Element | undefined) | undefined
          >();
        });
      }
    };
    void reader;
  });

  test('preset options are v2 options', () => {
    // @ts-expect-error: 1.x plugin functions need fromLegacyPlugin()
    lineChart('#c', { series: [[1]] }, { plugins: [() => undefined] });
    lineChart(
      '#c',
      { series: [[1]] },
      {
        series: { a: { showArea: true } }
      }
    );
    // @ts-expect-error: only five options apply per series
    lineChart('#c', { series: [[1]] }, { series: { a: { low: 0 } } });
  });

  test('compose listeners may return conditionally', () => {
    lineChart('#c', { series: [[1, 2]] }).on('compose', current => {
      if (current.role !== 'point') {
        return;
      }
      return current.addClass('ct-marked');
    });
  });

  test('plugins: provides is checked, options are checked', () => {
    const legend: ChartPlugin = {
      name: 'legend',
      provides: ['legend:click'],
      install: () => undefined
    };
    const threshold: ChartPlugin<{ limit: number }> = {
      name: 'threshold',
      install: (_chart, options) => void options?.limit
    };
    barChart(
      '#c',
      { series: [[1]] },
      {
        plugins: [legend, withOptions(threshold, { limit: 7 })]
      }
    );
    // @ts-expect-error: limt isn't an option of threshold
    withOptions(threshold, { limt: 7 });
    const unknownEvent: ChartPlugin = {
      name: 'x',
      // @ts-expect-error: events a plugin provides are declared in ChartEvents
      provides: ['not-declared'],
      install: () => undefined
    };
    void unknownEvent;
  });
});
