/**
 * The v2 type contract: nodes narrow by role, queries and
 * builders keep their types, events and plugins are checked.
 */
import {
  autoScaleAxis,
  band,
  bar,
  barChart,
  cartesianAxes,
  chart,
  findAll,
  lineChart,
  node,
  pie,
  pieChart,
  responsive,
  stepAxis,
  targetLine,
  trendLine,
  withOptions,
  type Area,
  type ChartPadding,
  type ChartPlugin,
  type InsetContext,
  type Layer,
  type PresetLayers,
  type ResponsiveWatcher,
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
    if (scene.role === 'targetLine') {
      expectTypeOf(scene.ctx.value).toEqualTypeOf<number>();
      expectTypeOf(scene.ctx.axis).toEqualTypeOf<ScaleAxis>();
      expectTypeOf(scene.attrs.y1).toEqualTypeOf<number>();
    }
    if (scene.role === 'trendLine') {
      expectTypeOf(scene.ctx.seriesIndex).toEqualTypeOf<number>();
      expectTypeOf(scene.ctx.slope).toEqualTypeOf<number>();
      expectTypeOf(scene.ctx.intercept).toEqualTypeOf<number>();
      expectTypeOf(scene.attrs.x2).toEqualTypeOf<number>();
    }
    if (scene.role === 'targetLabel') {
      expectTypeOf(scene.ctx.text).toEqualTypeOf<string>();
    }
    if (scene.role === 'band') {
      expectTypeOf(scene.ctx.path).toEqualTypeOf<SvgPath>();
      expectTypeOf(scene.ctx.series).toEqualTypeOf<
        readonly number[] | undefined
      >();
      expectTypeOf(scene.attrs.d).toEqualTypeOf<string>();
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

  test('presets take extra layers below and above their series', () => {
    lineChart('#c', { series: [[1]] }, { layers: { above: [layer] } });
    barChart('#c', { series: [[1]] }, { layers: { below: [layer] } });
    pieChart('#c', { series: [1] }, { layers: { below: [], above: [layer] } });
    expectTypeOf<PresetLayers['above']>().toEqualTypeOf<
      readonly Layer[] | undefined
    >();
    // @ts-expect-error: a layer list, not a single layer
    lineChart('#c', { series: [[1]] }, { layers: { above: layer } });
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

  test('a responsive set watches with a ResponsiveWatcher', () => {
    const set = responsive([['(width < 400px)', { width: 300 }]]);
    expectTypeOf(set.watch).returns.toEqualTypeOf<ResponsiveWatcher>();
    expectTypeOf<ResponsiveWatcher['matching']>().toEqualTypeOf<
      readonly number[]
    >();
  });

  test('refine changes nodes but cannot drop them', () => {
    const marking: Layer = {
      type: 'marking',
      coordinates: ['cartesian'],
      compose: () => [],
      refine: current =>
        current.role === 'point' ? current.addClass('ct-marked') : undefined
    };
    void marking;
    const dropping: Layer = {
      type: 'dropping',
      coordinates: ['cartesian'],
      compose: () => [],
      // @ts-expect-error: only compose listeners drop nodes
      refine: () => null
    };
    void dropping;
  });

  test('inset reserves room per side and the boxes are areas', () => {
    const titled: Layer = {
      type: 'titled',
      coordinates: ['cartesian'],
      inset: ({ measureText }) => ({ bottom: measureText('Title').height }),
      compose: ({ insetArea }) => {
        expectTypeOf(insetArea?.bottom).toEqualTypeOf<Area | undefined>();
        return [];
      }
    };
    void titled;
    expectTypeOf<ReturnType<NonNullable<Layer['inset']>>>().toEqualTypeOf<
      Partial<ChartPadding> | undefined
    >();
    expectTypeOf<InsetContext['axes'][number]['side']>().toEqualTypeOf<
      'top' | 'bottom' | 'left' | 'right'
    >();
    const wrong: Layer = {
      type: 'wrong',
      coordinates: ['cartesian'],
      compose: () => [],
      // @ts-expect-error: room is in px per side
      inset: () => ({ bottom: '20px' })
    };
    void wrong;
  });

  test('a target line takes one value and an optional label', () => {
    targetLine({ value: 1000, label: 'Target', className: 'ct-series-b' });
    targetLine({ axis: 'eur', value: 800, labelPosition: 'start' });
    // @ts-expect-error: a line needs a value
    targetLine({ label: 'Target' });
    // @ts-expect-error: a label is text
    targetLine({ value: 1000, label: 1000 });
  });

  test('a trend line takes the options of a line layer', () => {
    trendLine();
    trendLine({ series: ['sales', 1], x: 'month', y: 'eur', align: 'center' });
    trendLine({ classNames: { series: 'my-series', line: 'my-trend' } });
    // @ts-expect-error: align is start or center
    trendLine({ align: 'end' });
  });

  test('a band edge is a constant, values or a series', () => {
    band({ low: 40, high: 60 });
    band({ low: [1, null, 3], high: [{ x: 0, y: 5 }] });
    band({ low: 'p10', high: { series: 2 } });
    // @ts-expect-error: values are numbers, { x, y } or null
    band({ low: ['1'], high: 2 });
  });

  test('labels take labelTransform everywhere they take a label function', () => {
    const label = (value: unknown) => `${String(value)} °C`;
    lineChart(
      '#chart',
      { series: [[1]] },
      { axisY: { labelTransform: label } }
    );
    barChart('#chart', { series: [[1]] }, { axisX: { labelTransform: label } });
    pieChart('#chart', { series: [1] }, { labelTransform: label });
    cartesianAxes({
      x: { type: stepAxis(), labelTransform: label },
      y: { type: autoScaleAxis() }
    });
    pie({ labelTransform: label });
    lineChart(
      '#chart',
      { series: [[1]] },
      {
        axisY: {
          // @ts-expect-error: a label function returns a label
          labelTransform: () => 1n
        }
      }
    );
  });

  test('a bar layer moves by an offset in px', () => {
    bar({ stackBars: true, offset: -8 });
    // @ts-expect-error: an offset is a number of px
    bar({ offset: '8px' });
  });

  test('axes take labelAlign for their SVG labels', () => {
    lineChart(
      '#c',
      { series: [[1]] },
      {
        labels: 'svg',
        axisX: { labelAlign: { horizontal: 'middle' } },
        axisY: { labelAlign: { horizontal: 'end', vertical: 'top' } }
      }
    );
    barChart('#c', { series: [[1]] }, { axisX: { labelAlign: {} } });
    cartesianAxes([
      {
        id: 'x',
        side: 'bottom',
        type: stepAxis(),
        labelAlign: { vertical: 'middle' }
      },
      { id: 'y', side: 'left', type: autoScaleAxis() }
    ]);
    cartesianAxes({
      y: { type: autoScaleAxis(), labelAlign: { horizontal: 'start' } }
    });
    lineChart(
      '#c',
      { series: [[1]] },
      {
        axisX: {
          // @ts-expect-error: horizontal is start, middle or end
          labelAlign: { horizontal: 'left' }
        }
      }
    );
  });
});
