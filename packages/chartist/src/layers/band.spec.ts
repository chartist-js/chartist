import { estimateText } from '../render/measure';
import { createPhaseEmitter, type PhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import type { Layer } from '../pipeline/types';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import type { SceneNode } from '../scene/node';
import { findAll } from '../scene/tree';
import { cardinal } from '../interpolation/cardinal';
import { none } from '../interpolation/none';
import { simple } from '../interpolation/simple';
import { step } from '../interpolation/step';
import { band } from './band';
import { bar } from './bar';
import { line } from './line';

const LABELS = ['a', 'b', 'c', 'd', 'e'];

function run(
  series: unknown[],
  layers: Layer[],
  setup: (emitter: PhaseEmitter) => void = () => undefined
) {
  const emitter = createPhaseEmitter();
  setup(emitter);
  return runPipeline(
    emitter,
    {
      data: { labels: LABELS, series },
      axes: cartesianAxes({
        x: { type: stepAxis(), ticks: LABELS },
        y: { type: autoScaleAxis() }
      }),
      layers
    },
    { width: 400, height: 200, measureText: estimateText }
  );
}

const bands = (scene: SceneNode) => findAll(scene, { role: 'band' });

/** The points of a path, rounded, without its commands' control points. */
function points(scene: SceneNode) {
  return bands(scene).map(piece =>
    piece.ctx.path.pathElements.map(e => [
      e.command,
      Math.round(e.x * 100) / 100,
      Math.round(e.y * 100) / 100
    ])
  );
}

describe('layers/band', () => {
  it('needs low and high, or series', () => {
    expect(() => band({ low: 10 })).toThrow(
      'Layer "band": the band needs low and high, or series'
    );
    expect(() => band({})).toThrow('the band needs low and high, or series');
    expect(() => band({ series: ['a'], low: 1 })).toThrow(
      "series can't be combined with low and high"
    );
  });

  it('needs both axes', () => {
    expect(() =>
      runPipeline(
        createPhaseEmitter(),
        { data: { series: [[1]] }, layers: [band({ low: 1, high: 2 })] },
        { width: 100, height: 100, measureText: estimateText }
      )
    ).toThrow('Layer "band" needs an x and a y axis');
  });

  it('draws one path between two series in a band group', () => {
    const { scene } = run(
      [
        { name: 'p10', data: [1, 2, 3, 2, 1] },
        { name: 'p90', data: [4, 6, 7, 5, 4] }
      ],
      [band({ low: 'p10', high: 'p90' })]
    );
    const [group] = scene.children;
    expect(group.name).toBe('g');
    expect(group.classes).toEqual(['ct-band']);
    expect(group.role).toBeUndefined();
    const [piece] = bands(scene);
    expect(bands(scene)).toHaveLength(1);
    expect(piece.name).toBe('path');
    expect(piece.classes).toEqual(['ct-band-area']);
    expect(piece.ctx).toMatchObject({
      low: { seriesIndex: 0 },
      high: { seriesIndex: 1 }
    });
    expect(piece.attrs.d).toMatch(/Z$/);
  });

  it('follows the high series with its upper edge, as the line does', () => {
    const series = [
      { name: 'lo', data: [1, 2, 3, 2, 1] },
      { name: 'hi', data: [4, 6, 7, 5, 4] }
    ];
    const { scene } = run(series, [
      band({ low: 'lo', high: 'hi' }),
      line({ series: ['hi'] })
    ]);
    const [lineNode] = findAll(scene, { role: 'line' });
    const [piece] = bands(scene);
    expect(String(piece.attrs.d).startsWith(String(lineNode.attrs.d))).toBe(
      true
    );
    // Then back along the low series to the start.
    const elements = piece.ctx.path.pathElements;
    const lowLine = findAll(run(series, [line({ series: ['lo'] })]).scene, {
      role: 'line'
    })[0].ctx.path.pathElements;
    expect([elements[5].x, elements[5].y]).toEqual([
      lowLine[4].x,
      lowLine[4].y
    ]);
    expect([elements[9].x, elements[9].y]).toEqual([
      lowLine[0].x,
      lowLine[0].y
    ]);
  });

  it.each([
    ['none', none()],
    ['simple', simple()],
    ['cardinal', cardinal()],
    ['step', step()]
  ])('shares the %s interpolation with the line layer', (_name, lineSmooth) => {
    const series = [
      { name: 'lo', data: [1, 2, 3, 2, 1] },
      { name: 'hi', data: [4, 6, 7, 5, 4] }
    ];
    const { scene } = run(series, [
      band({ low: 'lo', high: 'hi', lineSmooth }),
      line({ series: ['hi'], lineSmooth })
    ]);
    const [lineNode] = findAll(scene, { role: 'line' });
    const [piece] = bands(scene);
    expect(String(piece.attrs.d).startsWith(String(lineNode.attrs.d))).toBe(
      true
    );
  });

  it('covers the minimum to the maximum of a group', () => {
    const series = [
      { name: 'a', data: [1, 5, 3] },
      { name: 'b', data: [4, 2, 6] },
      { name: 'c', data: [2, 3, 1] },
      { name: 'other', data: [10, 10, 10] }
    ];
    const state = run(series, [
      band({ series: ['a', 'b', 'c'], lineSmooth: false })
    ]);
    const { area } = state.layout;
    const y = (v: number) => area.y1 - state.axes.y!.project(v);
    const [piece] = bands(state.scene);
    expect(piece.ctx.series).toEqual([0, 1, 2]);
    expect(piece.ctx.low).toBeUndefined();
    const ys = piece.ctx.path.pathElements.map(e => e.y);
    expect(ys).toEqual([y(4), y(5), y(6), y(1), y(2), y(1)]);
  });

  it('fills the area width between constant edges and widens the axis', () => {
    const state = run([[45, 50, 55]], [band({ low: 40, high: 60 })]);
    const { area } = state.layout;
    const axis = state.axes.y!;
    expect(axis.range!.min).toBeLessThanOrEqual(40);
    expect(axis.range!.max).toBeGreaterThanOrEqual(60);
    const [piece] = bands(state.scene);
    expect(piece.ctx).toMatchObject({
      low: { value: 40 },
      high: { value: 60 }
    });
    const high = area.y1 - axis.project(60);
    const low = area.y1 - axis.project(40);
    expect(points(state.scene)[0]).toEqual(
      [
        ['M', area.x1, high],
        ['L', area.x2, high],
        ['L', area.x2, low],
        ['L', area.x1, low]
      ].map(([c, x, yy]) => [
        c,
        Math.round((x as number) * 100) / 100,
        Math.round((yy as number) * 100) / 100
      ])
    );
    expect(piece.attrs.d).toMatch(/Z$/);
  });

  it('draws constant edges outside a fixed axis range at its end', () => {
    const state = runPipeline(
      createPhaseEmitter(),
      {
        data: { labels: LABELS, series: [[1, 2]] },
        axes: cartesianAxes({
          x: { type: stepAxis(), ticks: LABELS },
          y: { type: autoScaleAxis(), low: 0, high: 10 }
        }),
        layers: [band({ low: 5, high: 20 })]
      },
      { width: 400, height: 200, measureText: estimateText }
    );
    expect(state.axes.y!.range!.max).toBe(10);
    const ys = bands(state.scene)[0].ctx.path.pathElements.map(e => e.y);
    expect(Math.min(...ys)).toBe(state.layout.area.y2);
  });

  it('breaks at a hole in an edge', () => {
    const { scene } = run(
      [
        { name: 'lo', data: [1, 1, 1, 1, 1, 1, 1] },
        { name: 'hi', data: [3, 4, 3, null, 4, 3, 4] }
      ],
      [band({ low: 'lo', high: 'hi' })]
    );
    const pieces = bands(scene);
    expect(pieces).toHaveLength(2);
    // Three values each way before the hole, three after it.
    expect(pieces.map(p => p.ctx.path.pathElements.length)).toEqual([6, 6]);
  });

  it('breaks where no series of a group has a value', () => {
    const { scene } = run(
      [
        [1, 2, null, 4, 5],
        [2, null, null, 3, 6]
      ],
      [band({ series: [0, 1] })]
    );
    expect(bands(scene)).toHaveLength(2);
  });

  it('mixes a constant and a series edge', () => {
    const series = [{ name: 'forecast', data: [3, 5, 4] }];
    const state = run(series, [
      band({ low: 0, high: 'forecast', lineSmooth: false })
    ]);
    const { area } = state.layout;
    const y = (v: number) => area.y1 - state.axes.y!.project(v);
    const [piece] = bands(state.scene);
    expect(piece.ctx).toMatchObject({
      low: { value: 0 },
      high: { seriesIndex: 0 }
    });
    const elements = piece.ctx.path.pathElements;
    expect(elements.map(e => e.y)).toEqual([
      y(3),
      y(5),
      y(4),
      y(0),
      y(0),
      y(0)
    ]);
    // The constant edge runs at the X of the series' values.
    expect(elements.slice(3).map(e => e.x)).toEqual(
      elements
        .slice(0, 3)
        .map(e => e.x)
        .reverse()
    );
    expect(state.axes.y!.range!.min).toBeLessThanOrEqual(0);
  });

  it('takes a series edge by index', () => {
    const { scene } = run(
      [
        [9, 9, 9],
        [1, 2, 3],
        [4, 5, 6]
      ],
      [band({ low: { series: 1 }, high: { series: 2 } })]
    );
    expect(bands(scene)[0].ctx).toMatchObject({
      low: { seriesIndex: 1 },
      high: { seriesIndex: 2 }
    });
  });

  it('lines up with bars with align: center', () => {
    const series = [
      [1, 2, 3, 2, 1],
      [4, 5, 6, 5, 4]
    ];
    const edges = { low: { series: 0 }, high: { series: 1 } };
    const plain = run(series, [band(edges)]);
    const [start] = bands(plain.scene);
    const [center] = bands(
      run(series, [band({ ...edges, align: 'center' })]).scene
    );
    const step = plain.axes.x!.step!;
    expect(
      center.ctx.path.pathElements[0].x - start.ctx.path.pathElements[0].x
    ).toBeCloseTo(step / 2);
    const [lineNode] = findAll(
      run(series, [
        band({ ...edges, align: 'center' }),
        line({ series: [1], align: 'center' })
      ]).scene,
      { role: 'line' }
    );
    expect(String(center.attrs.d).startsWith(String(lineNode.attrs.d))).toBe(
      true
    );
  });

  it('throws for an unknown series', () => {
    expect(() => run([[1, 2]], [band({ low: 'nope', high: 1 })])).toThrow(
      'Chartist: unknown series "nope" in layer "band"'
    );
  });

  it('keeps the series it uses visible to other layers', () => {
    const { scene } = run(
      [
        { name: 'lo', data: [1, 2] },
        { name: 'hi', data: [3, 4] }
      ],
      [band({ low: 'lo', high: 'hi' }), line()]
    );
    expect(findAll(scene, { role: 'line' })).toHaveLength(2);
  });

  it('adds className to its group and takes class names', () => {
    const { scene } = run(
      [[1, 2]],
      [
        band({
          low: 0,
          high: 1,
          className: 'ct-series-c',
          classNames: { band: 'my-band', area: 'my-area' }
        })
      ]
    );
    expect(scene.children[0].classes).toEqual(['my-band', 'ct-series-c']);
    expect(bands(scene)[0].classes).toEqual(['my-area']);
  });

  it('keeps the chart a line chart', () => {
    const layer = band({ low: 0, high: 1 });
    expect(layer.chartType).toBeUndefined();
    expect(layer.coordinates).toEqual(['cartesian']);
    expect(layer.series).toEqual([]);
  });

  describe('mark', () => {
    const classesOf = (scene: SceneNode, role: 'point' | 'bar') =>
      findAll(scene, { role }).map(n =>
        n.classes.filter(c => c.endsWith('-band'))
      );

    it('has no refine without mark', () => {
      expect('refine' in band({ low: 40, high: 60 })).toBe(false);
      expect(band({ low: 40, high: 60, mark: true }).refine).toBeTypeOf(
        'function'
      );
    });

    it.each([
      ['before', true],
      ['after', false]
    ])('marks points with the band listed %s the line', (_name, first) => {
      const marking = band({ low: 40, high: 60, mark: true });
      const layers = first ? [marking, line()] : [line(), marking];
      const { scene } = run([[30, 50, 70, 40, 60]], layers);
      expect(classesOf(scene, 'point')).toEqual([
        ['ct-out-band'],
        ['ct-in-band'],
        ['ct-out-band'],
        ['ct-in-band'],
        ['ct-in-band']
      ]);
    });

    it('marks bars, and horizontal bars by their value', () => {
      for (const horizontalBars of [false, true]) {
        const step = { type: stepAxis(), ticks: ['a', 'b', 'c'] };
        const auto = { type: autoScaleAxis() };
        const { scene } = runPipeline(
          createPhaseEmitter(),
          {
            data: { labels: ['a', 'b', 'c'], series: [[30, 50, 70]] },
            axes: cartesianAxes({
              x: horizontalBars ? auto : step,
              y: horizontalBars ? step : auto,
              normalize: {
                multi: horizontalBars ? 'x' : 'y',
                distributed: true
              }
            }),
            layers: [
              bar({ horizontalBars }),
              band({ low: 40, high: 60, mark: true })
            ]
          },
          { width: 400, height: 200, measureText: estimateText }
        );
        expect(classesOf(scene, 'bar')).toEqual([
          ['ct-out-band'],
          ['ct-in-band'],
          ['ct-out-band']
        ]);
      }
    });

    it('marks by the edges at each value index', () => {
      const { scene } = run(
        [
          { name: 'lo', data: [0, 5, 0] },
          { name: 'hi', data: [2, 6, 2] },
          { name: 'values', data: [1, 1, 3] }
        ],
        [
          band({ low: 'lo', high: 'hi', mark: true }),
          line({ series: ['values'] })
        ]
      );
      expect(classesOf(scene, 'point')).toEqual([
        ['ct-in-band'],
        ['ct-out-band'],
        ['ct-out-band']
      ]);
    });

    it('leaves nodes at a hole of the band alone', () => {
      const { scene } = run(
        [
          { name: 'lo', data: [0, null, 0] },
          { name: 'values', data: [1, 1, 1] }
        ],
        [band({ low: 'lo', high: 2, mark: true }), line({ series: [1] })]
      );
      expect(classesOf(scene, 'point')).toEqual([
        ['ct-in-band'],
        [],
        ['ct-in-band']
      ]);
    });

    it('marks nothing without mark', () => {
      const { scene } = run(
        [[30, 50, 70]],
        [band({ low: 40, high: 60 }), line()]
      );
      expect(classesOf(scene, 'point')).toEqual([[], [], []]);
    });

    it('takes class names for the marks', () => {
      const { scene } = run(
        [[30, 50]],
        [
          band({
            low: 40,
            high: 60,
            mark: true,
            classNames: { inBand: 'in', outBand: 'out' }
          }),
          line()
        ]
      );
      expect(findAll(scene, { role: 'point' }).map(p => p.classes)).toEqual([
        ['ct-point', 'out'],
        ['ct-point', 'in']
      ]);
    });

    it('marks before compose listeners see the nodes', () => {
      const seen: string[][] = [];
      const { scene } = run(
        [[30, 50, 70]],
        [band({ low: 40, high: 60, mark: true }), line()],
        emitter =>
          emitter.on('compose', (current: SceneNode) => {
            if (current.role !== 'point') {
              return undefined;
            }
            seen.push(current.classes.filter(c => c.endsWith('-band')));
            // A listener still has the last word.
            return current.ctx.valueIndex === 2 ? null : undefined;
          })
      );
      expect(seen).toEqual([['ct-out-band'], ['ct-in-band'], ['ct-out-band']]);
      expect(findAll(scene, { role: 'point' })).toHaveLength(2);
    });
  });
});
