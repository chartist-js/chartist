import { freezeDeep } from '../../test/freeze';
import { dots } from '../../test/layers';
import { estimateText } from '../render/measure';
import { findAll } from '../scene/tree';
import { createPhaseEmitter } from './emitter';
import { DEFAULT_PADDING, runPipeline, type PipelineOptions } from './phases';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import type { LayerContext, PhaseEvents } from './types';

const ENV = { width: 400, height: 200, measureText: estimateText };

function run(
  options: Partial<PipelineOptions> = {},
  setup: (emitter: ReturnType<typeof createPhaseEmitter>) => void = () =>
    undefined
) {
  const emitter = createPhaseEmitter();
  setup(emitter);
  return runPipeline(
    emitter,
    freezeDeep({ data: { series: [[1, 2, 3]] }, layers: [dots()], ...options }),
    ENV
  );
}

describe('pipeline/phases', () => {
  it('emits the phases in order', () => {
    const names: string[] = [];
    run({}, emitter => emitter.on('*', name => names.push(name)));
    expect(names.filter((name, i) => name !== names[i - 1])).toEqual([
      'resolve',
      'prepare',
      'layout',
      'compose',
      'scene'
    ]);
  });

  it('resolve applies defaults', () => {
    const { config } = run();
    expect(config.coordinates).toBe('cartesian');
    expect(config.padding).toEqual(DEFAULT_PADDING);
    expect(run({ padding: 4 }).config.padding).toEqual({
      top: 4,
      right: 4,
      bottom: 4,
      left: 4
    });
    expect(run({ padding: { top: 0 } }).config.padding.top).toBe(0);
  });

  it('resolve rejects layers in unsupported coordinates', () => {
    expect(() => run({ coordinates: 'polar' })).toThrow(
      'Layer "dots" does not support polar coordinates'
    );
  });

  it('prepare normalizes arrays, series objects and flat series', () => {
    expect(
      run({
        data: { series: [[1, 2], { name: 'b', meta: 'm', data: [3] }] }
      }).data.series
    ).toEqual([
      { values: [1, 2] },
      { name: 'b', meta: 'm', className: undefined, values: [3] }
    ]);
    expect(run({ data: { series: [5, 10] } }).data.series).toEqual([
      { values: [5, 10] }
    ]);
    expect(run({ data: { series: [] } }).data.series).toEqual([]);
  });

  it('layout computes the area inside the padding', () => {
    const { layout } = run({
      padding: { top: 10, right: 20, bottom: 30, left: 40 }
    });
    expect(layout.area).toEqual({
      x1: 40,
      y1: 170,
      x2: 380,
      y2: 10,
      width: 340,
      height: 160
    });
  });

  it('layout clamps to a zero-size area when the padding is larger than the chart', () => {
    const { layout } = run({ padding: 300 });
    expect(layout.area.width).toBe(0);
    expect(layout.area.height).toBe(0);
  });

  it('a layout listener that returns an invalid area fails with a clear error', () => {
    expect(() =>
      run({}, emitter =>
        emitter.on('layout', (layout: PhaseEvents['layout']) => ({
          ...layout,
          area: { ...layout.area, width: NaN }
        }))
      )
    ).toThrow('invalid layout after the "layout" phase');
  });

  it('values returned by prepare and layout listeners reach later phases', () => {
    const state = run({}, emitter => {
      emitter.on('prepare', ({ data }: PhaseEvents['prepare']) => ({
        data: { ...data, series: [...data.series, { values: [4] }] }
      }));
      emitter.on('layout', (layout: PhaseEvents['layout']) => ({
        ...layout,
        area: {
          ...layout.area,
          y1: layout.area.y1 - 40,
          height: layout.area.height - 40
        }
      }));
    });
    expect(findAll(state.scene, { role: 'series' })).toHaveLength(2);
    expect(state.layout.area.y1).toBe(ENV.height - DEFAULT_PADDING.bottom - 40);
  });

  it('listeners receive frozen payloads and the pipeline never mutates them', () => {
    expect(() =>
      run({}, emitter => {
        emitter.on('resolve', freezeDeep);
        emitter.on('prepare', freezeDeep);
        emitter.on('layout', freezeDeep);
        emitter.on('compose', freezeDeep);
        emitter.on('scene', freezeDeep);
      })
    ).not.toThrow();
  });

  it('compose emits per node with a role, children before parents', () => {
    const seen: string[] = [];
    run({}, emitter =>
      emitter.on('compose', (n: PhaseEvents['compose']) => {
        seen.push(`${n.role}:${n.key}`);
      })
    );
    expect(seen).toEqual([
      'point:0/0/0',
      'point:0/0/1',
      'point:0/0/2',
      'series:0/0'
    ]);
  });

  it('compose listeners replace and drop nodes; parents see the result', () => {
    let pointsInSeries = -1;
    const state = run({}, emitter => {
      emitter.on('compose', (n: PhaseEvents['compose']) => {
        if (n.role === 'point') {
          return n.ctx?.valueIndex === 0 ? null : n.addClass('kept');
        }
        pointsInSeries = n.children.length;
        return undefined;
      });
    });
    expect(pointsInSeries).toBe(2);
    expect(
      findAll(state.scene, { role: 'point' }).map(p => p.classes.join(' '))
    ).toEqual(['dot kept', 'dot kept']);
  });

  it('scene wraps layers in declaration order in a root svg', () => {
    const { scene } = run({
      layers: [dots('first'), dots('second')],
      className: 'my'
    });
    expect(scene.name).toBe('svg');
    expect(scene.classes).toEqual(['my']);
    expect(scene.attrs).toEqual({ width: 400, height: 200 });
    expect(
      findAll(scene, { role: 'point' }).map(p => `${p.key} ${p.classes[0]}`)
    ).toEqual([
      '0/0/0 first',
      '0/0/1 first',
      '0/0/2 first',
      '1/0/0 second',
      '1/0/1 second',
      '1/0/2 second'
    ]);
  });

  it('re-running from layout reuses resolve and prepare', () => {
    const emitter = createPhaseEmitter();
    const names: string[] = [];
    emitter.on('*', name => names.push(name));
    const options = { data: { series: [[1]] }, layers: [dots()] };
    const first = runPipeline(emitter, options, ENV);
    names.length = 0;
    const second = runPipeline(
      emitter,
      options,
      { ...ENV, width: 200 },
      first,
      'layout'
    );
    expect(names).not.toContain('resolve');
    expect(names).not.toContain('prepare');
    expect(second.config).toBe(first.config);
    expect(second.layout.width).toBe(200);
  });

  describe('with axes', () => {
    const axes = cartesianAxes({
      x: {
        type: stepAxis(),
        offset: 30,
        position: 'end' as const,
        ticks: ['a', 'b', 'c']
      },
      y: { type: autoScaleAxis(), offset: 40, position: 'start' as const }
    });

    function capture(setup?: Parameters<typeof run>[1]) {
      let context: LayerContext | undefined;
      const state = run(
        {
          axes,
          layers: [
            {
              type: 'probe',
              coordinates: ['cartesian'],
              compose: ctx => {
                context = ctx;
                return [];
              }
            }
          ]
        },
        setup
      );
      return { state, context: context! };
    }

    it('reserves the axis offsets around the area', () => {
      const { state } = capture();
      expect(state.layout.area).toEqual({
        x1: 50,
        x2: 385,
        y1: 165,
        y2: 15,
        width: 335,
        height: 150
      });
    });

    it('creates the axes for the final area and passes them to layers', () => {
      const { context } = capture(emitter =>
        emitter.on('layout', (layout: PhaseEvents['layout']) => ({
          ...layout,
          area: { ...layout.area, y1: 125, height: 110 }
        }))
      );
      expect(context.axes.x?.ticks).toEqual(['a', 'b', 'c']);
      expect(context.axes.y?.length).toBe(110);
      expect(context.normalized?.series).toEqual([
        [
          { x: undefined, y: 1 },
          { x: undefined, y: 2 },
          { x: undefined, y: 3 }
        ]
      ]);
    });

    it('charts without axes get no axes and no normalized data', () => {
      let context: LayerContext | undefined;
      run({
        layers: [
          {
            type: 'probe',
            coordinates: ['cartesian'],
            compose: ctx => {
              context = ctx;
              return [];
            }
          }
        ]
      });
      expect(context!.axes).toEqual({});
      expect(context!.normalized).toBeUndefined();
    });
  });
});
