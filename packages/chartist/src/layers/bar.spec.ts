import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { findAll } from '../scene/tree';
import { bar, stackedExtent } from './bar';

function scene(series: unknown[], options: Parameters<typeof bar>[0] = {}) {
  const horizontal = options.horizontalBars;
  const step = { type: stepAxis(), ticks: ['a', 'b', 'c'] };
  const auto = { type: autoScaleAxis() };
  return runPipeline(
    createPhaseEmitter(),
    {
      data: { labels: ['a', 'b', 'c'], series },
      axes: cartesianAxes({
        x: horizontal ? auto : step,
        y: horizontal ? step : auto,
        normalize: { multi: horizontal ? 'x' : 'y', distributed: true }
      }),
      layers: [bar(options)]
    },
    { width: 400, height: 200, measureText: estimateText }
  ).scene;
}

describe('layers/bar', () => {
  it('needs both axes', () => {
    expect(() =>
      runPipeline(
        createPhaseEmitter(),
        { data: { series: [[1]] }, layers: [bar()] },
        { width: 100, height: 100, measureText: estimateText }
      )
    ).toThrow('Layer "bar" needs an x and a y axis');
  });

  it('bar nodes carry value, meta and positions in their context', () => {
    const [first] = findAll(scene([[{ value: 2, meta: 'm' }, 3, 1]]), {
      role: 'bar'
    });
    expect(first.ctx).toMatchObject({
      seriesIndex: 0,
      valueIndex: 0,
      meta: 'm',
      value: { x: undefined, y: 2 }
    });
    expect(Object.keys(first.attrs).sort()).toEqual([
      'ct:meta',
      'ct:value',
      'x1',
      'x2',
      'y1',
      'y2'
    ]);
    expect(first.key).toBe('0/0/0');
  });

  it('holes are skipped but keep their stack slot', () => {
    const result = scene(
      [
        [1, null, 3],
        [2, 2, 2]
      ],
      { stackBars: true }
    );
    expect(findAll(result, { role: 'bar', seriesIndex: 0 })).toHaveLength(2);
    const second = findAll(result, { role: 'bar', seriesIndex: 1 });
    expect(second.map(b => b.ctx?.valueIndex)).toEqual([0, 1, 2]);
  });

  it('horizontal bars run along x', () => {
    // Without the preset's referenceValue the scale starts at 1, so the
    // first bar has no length (as in 1.x); the last one is the longest.
    const bars = findAll(scene([[1, 2, 3]], { horizontalBars: true }), {
      role: 'bar'
    });
    const last = bars.at(-1)!;
    expect(last.attrs.y1).toBe(last.attrs.y2);
    expect(Number(last.attrs.x2)).toBeGreaterThan(Number(last.attrs.x1));
  });

  it('stackedExtent spans the running sums per index', () => {
    const series = [
      [
        { x: 1, y: 2 },
        { x: 0, y: 1 }
      ],
      [{ x: 3, y: 4 }, undefined],
      [{ x: -9, y: -7 }]
    ] as never;
    // y: 2, 6, -1 at index 0; 1 at index 1.
    expect(stackedExtent(series, 'y')).toEqual({ low: -1, high: 6 });
    expect(stackedExtent(series, 'x')).toEqual({ low: -5, high: 4 });
    expect(stackedExtent([], 'y')).toBeUndefined();
  });
});

describe('layers/bar stack modes', () => {
  type Pair = readonly [from: number, to: number];

  /** Bars as [from, to] along the value axis, and where a value lands. */
  function stacked(series: unknown[], options: Parameters<typeof bar>[0]) {
    const horizontal = Boolean(options?.horizontalBars);
    const label = { type: stepAxis() };
    const value = { type: autoScaleAxis(), referenceValue: 0 };
    const state = runPipeline(
      createPhaseEmitter(),
      {
        data: { labels: ['a', 'b'], series },
        axes: cartesianAxes({
          x: horizontal ? value : label,
          y: horizontal ? label : value,
          normalize: { multi: horizontal ? 'x' : 'y' }
        }),
        layers: [bar({ stackBars: true, ...options })]
      },
      { width: 400, height: 300, measureText: estimateText }
    );
    const axis = horizontal ? state.axes.x! : state.axes.y!;
    const { area } = state.layout;
    const at = (v: number) =>
      horizontal ? area.x1 + axis.project(v) : area.y1 - axis.project(v);
    const bars = findAll(state.scene, { role: 'bar' }).map(({ attrs }): Pair =>
      horizontal
        ? [Number(attrs.x1), Number(attrs.x2)]
        : [Number(attrs.y1), Number(attrs.y2)]
    );
    return { range: axis.range!, bars, at };
  }

  function expectBars(actual: readonly Pair[], expected: readonly Pair[]) {
    expect(actual).toHaveLength(expected.length);
    actual.forEach(([from, to], index) => {
      expect(from).toBeCloseTo(expected[index][0], 6);
      expect(to).toBeCloseTo(expected[index][1], 6);
    });
  }

  describe.each([
    ['vertical', false],
    ['horizontal', true]
  ])('%s', (_name, horizontalBars) => {
    it('accumulate stacks each value on the ones before; the axis fits the sums (#1483)', () => {
      const { range, bars, at } = stacked(
        [
          [5, 5],
          [4, 4]
        ],
        { horizontalBars }
      );
      expect(range.max).toBeGreaterThanOrEqual(9);
      expectBars(bars, [
        [at(0), at(5)],
        [at(0), at(5)],
        [at(5), at(9)],
        [at(5), at(9)]
      ]);
    });

    it('accumulate with negatives runs back from the sum before', () => {
      const { range, bars, at } = stacked([[5], [-3]], { horizontalBars });
      expect(range.max).toBeGreaterThanOrEqual(5);
      expectBars(bars, [
        [at(0), at(5)],
        [at(5), at(2)]
      ]);
    });

    it('stackMode false stacks like accumulate', () => {
      const { bars, at } = stacked([[5], [4]], {
        horizontalBars,
        stackMode: false
      });
      expectBars(bars, [
        [at(0), at(5)],
        [at(5), at(9)]
      ]);
    });

    it.each([['overlap' as const], [true as const]])(
      'stackMode %s draws every bar from zero; the axis fits the values',
      stackMode => {
        const { range, bars, at } = stacked([[5], [4]], {
          horizontalBars,
          stackMode
        });
        expect(range.max).toBeLessThan(9);
        expectBars(bars, [
          [at(0), at(5)],
          [at(0), at(4)]
        ]);
      }
    );

    it('without stackBars the layer reports no extent', () => {
      const layer = bar({ horizontalBars });
      expect(
        layer.extent!({
          normalized: { labels: [], series: [[{ x: 5, y: 5 }]] },
          axes: { x: 'x', y: 'y' }
        })
      ).toEqual({});
    });
  });

  it('reports the extent on the axis it draws on', () => {
    const layer = bar({ stackBars: true });
    const normalized = {
      labels: [],
      series: [[{ x: undefined, y: 5 }], [{ x: undefined, y: 4 }]]
    };
    expect(layer.extent!({ normalized, axes: { x: 'q', y: 'v' } })).toEqual({
      v: { low: 5, high: 9 }
    });
  });
});
