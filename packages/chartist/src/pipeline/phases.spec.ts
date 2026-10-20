import { freezeDeep } from '../../test/freeze';
import { dots } from '../../test/layers';
import { estimateText } from '../render/measure';
import { findAll } from '../scene/tree';
import { createPhaseEmitter } from './emitter';
import { DEFAULT_PADDING, runPipeline, type PipelineOptions } from './phases';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import type { Layer, LayerContext, Layout, PhaseEvents } from './types';
import type { ChartPadding } from '../core/types';
import type { MeasureText } from '../render/measure';
import { pie } from '../layers/pie';
import { toScene } from '../chart/toScene';
import { lineChartConfig } from '../presets/lineChart';

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

  it('layout keeps the 1.x minimums when the padding is larger than the chart', async () => {
    const { createChartRect } = await import('../core/creation');
    const { Svg } = await import('../svg/Svg');
    const { layout } = run({ padding: 300 });
    const svg = new Svg('svg');
    vi.spyOn(svg, 'width').mockReturnValue(ENV.width);
    vi.spyOn(svg, 'height').mockReturnValue(ENV.height);
    const rect = createChartRect(svg, { chartPadding: 300 });
    expect(layout.area).toEqual({
      x1: rect.x1,
      x2: rect.x2,
      y1: rect.y1,
      y2: rect.y2,
      width: rect.width(),
      height: rect.height()
    });
    expect(layout.area.width).toBe(1);
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

  describe('reserving room with inset', () => {
    /** A layer that reserves room and remembers the context it drew with. */
    function roomLayer(
      room: Layer['inset'],
      seen: LayerContext[] = [],
      type = 'room',
      coordinates: Layer['coordinates'] = ['cartesian']
    ): Layer {
      return {
        type,
        coordinates,
        series: [],
        inset: room,
        compose(context) {
          seen.push(context);
          return [];
        }
      };
    }

    const reserve =
      (room: Partial<ChartPadding> | undefined): Layer['inset'] =>
      () =>
        room;

    function runAt(
      options: Partial<PipelineOptions>,
      width = 400,
      height = 300,
      setup: (emitter: ReturnType<typeof createPhaseEmitter>) => void = () =>
        undefined,
      measureText: MeasureText = estimateText
    ) {
      const emitter = createPhaseEmitter();
      setup(emitter);
      return runPipeline(
        emitter,
        { data: { series: [[1, 2, 3]] }, layers: [dots()], ...options },
        { width, height, measureText }
      );
    }

    const bottomAxes = () =>
      cartesianAxes({
        x: { type: stepAxis(), offset: 30, ticks: ['a', 'b', 'c'] },
        y: { type: autoScaleAxis(), offset: 40 }
      });

    it('reserves room between the padding and the axis band', () => {
      const seen: LayerContext[] = [];
      const state = runAt({
        axes: bottomAxes(),
        layers: [dots(), roomLayer(reserve({ bottom: 20 }), seen)]
      });
      const { area } = state.layout;
      expect(area.y1).toBe(300 - 5 - 20 - 30);
      expect(seen[0].insetArea).toEqual({
        bottom: {
          x1: area.x1,
          x2: area.x2,
          y2: 275,
          y1: 295,
          width: area.width,
          height: 20
        }
      });
    });

    it('stacks layers on one side outward in list order', () => {
      const first: LayerContext[] = [];
      const second: LayerContext[] = [];
      const without = runAt({ axes: bottomAxes() }).layout.area;
      const { area } = runAt({
        axes: bottomAxes(),
        layers: [
          roomLayer(reserve({ left: 16 }), first),
          roomLayer(reserve({ left: 16 }), second)
        ]
      }).layout;
      expect(area.x1).toBe(without.x1 + 32);
      const band = area.x1 - 40;
      expect(first[0].insetArea!.left).toMatchObject({
        x1: band - 16,
        x2: band
      });
      expect(second[0].insetArea!.left).toMatchObject({
        x1: band - 32,
        x2: band - 16,
        y2: area.y2,
        y1: area.y1,
        height: area.height
      });
    });

    it('places the room outside every axis on the side', () => {
      const seen: LayerContext[] = [];
      const { area } = runAt({
        axes: cartesianAxes([
          { id: 'x', side: 'bottom', type: stepAxis(), offset: 30 },
          { id: 'eur', side: 'left', type: autoScaleAxis(), offset: 40 },
          { id: 'usd', side: 'left', type: autoScaleAxis(), offset: 50 }
        ]),
        layers: [roomLayer(reserve({ left: 20 }), seen)]
      }).layout;
      expect(area.x1).toBe(DEFAULT_PADDING.left + 110);
      expect(seen[0].insetArea!.left).toMatchObject({
        x1: DEFAULT_PADDING.left,
        x2: DEFAULT_PADDING.left + 20
      });
    });

    it('keeps preset labels next to the area, as a larger padding would', () => {
      const data = { labels: ['a', 'b', 'c'], series: [[1, 3, 2]] };
      const labelsOf = (options: Parameters<typeof lineChartConfig>[1]) =>
        findAll(
          toScene(lineChartConfig(data, options), { width: 400, height: 300 }),
          {
            role: 'label'
          }
        ).map(label => label.attrs);
      expect(
        labelsOf({
          axisX: { position: 'start' },
          layers: { above: [roomLayer(reserve({ top: 24 }))] }
        })
      ).toEqual(
        labelsOf({
          axisX: { position: 'start' },
          chartPadding: { ...DEFAULT_PADDING, top: DEFAULT_PADDING.top + 24 }
        })
      );
    });

    it('asks again on a layout run, without resolve or prepare', () => {
      const phases: string[] = [];
      const options = {
        data: { series: [[1, 2, 3]] },
        axes: bottomAxes(),
        layers: [
          dots(),
          roomLayer(({ width }) => ({ bottom: width < 400 ? 40 : 20 }))
        ]
      };
      const emitter = createPhaseEmitter();
      emitter.on('*', name => phases.push(name));
      const wide = runPipeline(emitter, options, {
        width: 600,
        height: 300,
        measureText: estimateText
      });
      phases.length = 0;
      const narrow = runPipeline(
        emitter,
        options,
        { width: 300, height: 300, measureText: estimateText },
        wide,
        'layout'
      );
      expect(wide.layout.inset!.bottom).toBe(20);
      expect(narrow.layout.inset!.bottom).toBe(40);
      expect(phases).not.toContain('resolve');
      expect(phases).not.toContain('prepare');
    });

    it('puts the room into the layout payload, before the listeners', () => {
      let payload: Layout | undefined;
      const seen: LayerContext[] = [];
      const state = runAt(
        {
          axes: bottomAxes(),
          layers: [roomLayer(reserve({ bottom: 20 }), seen)]
        },
        400,
        300,
        emitter =>
          emitter.on('layout', current => {
            payload = current;
            // A listener moving the area doesn't move the boxes.
            return {
              ...current,
              area: {
                ...current.area,
                y1: current.area.y1 - 10,
                height: current.area.height - 10
              }
            };
          })
      );
      expect(payload!.inset).toEqual({ top: 0, right: 0, bottom: 20, left: 0 });
      expect(payload!.padding.bottom).toBe(DEFAULT_PADDING.bottom + 20);
      expect(state.layout.area.y1).toBe(235);
      expect(seen[0].insetArea!.bottom).toMatchObject({ y2: 275, y1: 295 });
    });

    it('lays out as before when no layer reserves room', () => {
      const base = runAt({ axes: bottomAxes() });
      for (const room of [undefined, { top: 0, bottom: 0 }]) {
        const state = runAt({
          axes: bottomAxes(),
          layers: [dots(), roomLayer(reserve(room))]
        });
        expect(state.layout).toEqual(base.layout);
        expect('inset' in state.layout).toBe(false);
        expect(state.layout.padding).toEqual(DEFAULT_PADDING);
        expect(state.drawn[1].context.insetArea).toBeUndefined();
        expect(state.scene).toEqual(base.scene);
      }
    });

    it('rejects room that is not a finite number of 0 or more', () => {
      for (const left of [-4, NaN, Infinity]) {
        expect(() =>
          runAt({ layers: [roomLayer(reserve({ left }), [], 'caption')] })
        ).toThrow(/layer "caption" reserved invalid room/);
      }
    });

    it('works in polar charts', () => {
      const seen: LayerContext[] = [];
      const state = runAt({
        coordinates: 'polar',
        data: { series: [1, 2, 3] },
        layers: [
          pie(),
          roomLayer(reserve({ right: 40 }), seen, 'room', ['polar'])
        ]
      });
      const { area } = state.layout;
      expect(area.x2).toBe(400 - DEFAULT_PADDING.right - 40);
      expect(seen[0].insetArea!.right).toMatchObject({
        x1: area.x2,
        x2: area.x2 + 40,
        y2: area.y2,
        y1: area.y1
      });
    });

    it('measures with the renderer and passes the layer its series', () => {
      const seen: { height: number; series: number }[] = [];
      const measuring: Layer['inset'] = ({ measureText, data }) => {
        const { height } = measureText('Title');
        seen.push({ height, series: data.series.length });
        return { bottom: height };
      };
      // Layers bind to series when the chart has axes.
      const options = {
        axes: bottomAxes(),
        data: { series: [[1], [2]] },
        layers: [dots(), { ...roomLayer(measuring), series: [1] }]
      };
      runAt(options);
      runAt(options, 400, 300, undefined, () => ({ width: 10, height: 30 }));
      expect(seen).toEqual([
        { height: estimateText('Title').height, series: 1 },
        { height: 30, series: 1 }
      ]);
    });
  });
});
