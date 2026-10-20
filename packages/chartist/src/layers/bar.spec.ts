import { toScene } from '../chart/toScene';
import { getMultiValue } from '../core/data/data';
import { barChartConfig } from '../presets/barChart';
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
    // Positives and negatives apart: 6 up, -7 down.
    expect(stackedExtent(series, 'y', true)).toEqual({ low: -7, high: 6 });
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

    it('accumulate-relative stacks positives up and negatives down (#1473)', () => {
      const { range, bars, at } = stacked(
        [
          [10, 1],
          [-6, 1],
          [-6, 1]
        ],
        { horizontalBars, stackMode: 'accumulate-relative' }
      );
      expect(range.min).toBeLessThanOrEqual(-12);
      expect(range.max).toBeGreaterThanOrEqual(10);
      // The negative stack of a reaches -12, below every single value and
      // every running sum.
      expectBars(bars, [
        [at(0), at(10)],
        [at(0), at(1)],
        [at(0), at(-6)],
        [at(1), at(2)],
        [at(-6), at(-12)],
        [at(2), at(3)]
      ]);
    });

    it('accumulate-relative picks the stack by the value along the value axis (#1469)', () => {
      // The other coordinate is a position at or above zero.
      const point = (v: number) =>
        horizontalBars ? { x: v, y: 1 } : { x: 1, y: v };
      const { range, bars, at } = stacked([[point(4)], [point(-4)]], {
        horizontalBars,
        stackMode: 'accumulate-relative'
      });
      expect(range.min).toBeLessThanOrEqual(-4);
      expectBars(bars, [
        [at(0), at(4)],
        [at(0), at(-4)]
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

describe('layers/bar offset', () => {
  const labels = ['Q1', 'Q2'];
  const series = [
    { name: '2024 new', data: [3, 4] },
    { name: '2024 returning', data: [2, 1] },
    { name: '2025 new', data: [5, 6] },
    { name: '2025 returning', data: [4, 3] }
  ];

  function grouped(offsets?: readonly [number, number]) {
    return runPipeline(
      createPhaseEmitter(),
      {
        data: { labels, series },
        axes: cartesianAxes({
          x: { type: stepAxis(), ticks: labels },
          y: { type: autoScaleAxis(), referenceValue: 0 },
          normalize: { multi: 'y' }
        }),
        layers: [
          bar({
            series: ['2024 new', '2024 returning'],
            stackBars: true,
            offset: offsets?.[0]
          }),
          bar({
            series: ['2025 new', '2025 returning'],
            stackBars: true,
            offset: offsets?.[1]
          })
        ]
      },
      { width: 400, height: 300, measureText: estimateText }
    );
  }

  it('two stacked layers with opposite offsets draw grouped stacks', () => {
    const state = grouped([-8, 8]);
    const { area } = state.layout;
    const x = state.axes.x!;
    const y = state.axes.y!;
    // The value axis fits the higher stack: 6 + 3 at Q2.
    expect(y.range!.max).toBeGreaterThanOrEqual(9);
    const bars = (seriesIndex: number) =>
      findAll(state.scene, { role: 'bar', seriesIndex }).map(b => ({
        x: Number(b.attrs.x1),
        x2: Number(b.attrs.x2),
        from: Number(b.attrs.y1),
        to: Number(b.attrs.y2)
      }));
    const center = (index: number) =>
      area.x1 + x.project(0, index, []) + x.length / labels.length / 2;
    const at = (v: number) => area.y1 - y.project(v);

    [0, 1].forEach(index => {
      for (const seriesIndex of [0, 1]) {
        expect(bars(seriesIndex)[index].x).toBeCloseTo(center(index) - 8, 6);
      }
      for (const seriesIndex of [2, 3]) {
        expect(bars(seriesIndex)[index].x).toBeCloseTo(center(index) + 8, 6);
        expect(bars(seriesIndex)[index].x2).toBe(bars(seriesIndex)[index].x);
      }
    });
    // Each layer stacks only its own series: 2025 starts at zero.
    expect(bars(0)[0].from).toBeCloseTo(at(0), 6);
    expect(bars(1)[0].from).toBeCloseTo(at(3), 6);
    expect(bars(1)[0].to).toBeCloseTo(at(5), 6);
    expect(bars(2)[0].from).toBeCloseTo(at(0), 6);
    expect(bars(3)[0].from).toBeCloseTo(at(5), 6);
    expect(bars(3)[0].to).toBeCloseTo(at(9), 6);
  });

  it('moves horizontal bars down with a positive offset', () => {
    const without = findAll(scene([[1, 2, 3]], { horizontalBars: true }), {
      role: 'bar'
    });
    const moved = findAll(
      scene([[1, 2, 3]], { horizontalBars: true, offset: 6 }),
      { role: 'bar' }
    );
    expect(moved).toHaveLength(without.length);
    moved.forEach((b, index) => {
      const before = without[index].attrs;
      expect(Number(b.attrs.y1)).toBeCloseTo(Number(before.y1) + 6, 6);
      expect(Number(b.attrs.y2)).toBeCloseTo(Number(before.y2) + 6, 6);
      expect(b.attrs.x1).toBe(before.x1);
      expect(b.attrs.x2).toBe(before.x2);
    });
  });

  it('moves grouped and distributed bars too', () => {
    const data = [
      [1, 2, 3],
      [3, 2, 1]
    ];
    const pairs = [
      [scene(data), scene(data, { offset: -5 }), -5],
      [
        scene([1, 2, 3], { distributeSeries: true }),
        scene([1, 2, 3], { distributeSeries: true, offset: 4 }),
        4
      ]
    ] as const;
    for (const [before, after, offset] of pairs) {
      const without = findAll(before, { role: 'bar' });
      const moved = findAll(after, { role: 'bar' });
      expect(moved).toHaveLength(without.length);
      moved.forEach((b, index) => {
        const x = Number(without[index].attrs.x1);
        expect(Number(b.attrs.x1)).toBeCloseTo(x + offset, 6);
        expect(b.attrs.y2).toBe(without[index].attrs.y2);
      });
    }
  });

  it('leaves the bars unchanged without an offset', () => {
    expect(grouped().scene).toEqual(grouped([0, 0]).scene);
  });
});

describe('layers/bar context', () => {
  const contexts = (options: Parameters<typeof bar>[0]) =>
    findAll(
      scene(
        [
          [1, 2],
          [3, 4]
        ],
        options
      ),
      { role: 'bar' }
    ).map(current => [current.ctx.horizontal, current.ctx.stacked]);

  it.each([
    [{}, false, false],
    [{ horizontalBars: true }, true, false],
    [{ stackBars: true }, false, true],
    [
      { stackBars: true, stackMode: 'accumulate-relative' as const },
      false,
      true
    ],
    [{ stackBars: true, stackMode: 'overlap' as const }, false, false],
    [{ horizontalBars: true, stackBars: true }, true, true]
  ])(
    'says whether a bar is horizontal and stacked: %o',
    (options, horizontal, stacked) => {
      expect(contexts(options)).toEqual(
        Array.from({ length: 4 }, () => [horizontal, stacked])
      );
    }
  );
});

describe('layers/bar meta', () => {
  it('reverses the meta with the values for reverseData (#1534)', () => {
    const meta = (value: number, name: string) => ({ value, meta: name });
    for (const options of [
      { reverseData: true },
      { reverseData: true, horizontalBars: true, stackBars: true }
    ]) {
      const bars = findAll(
        toScene(
          barChartConfig(
            {
              labels: ['a', 'b', 'c'],
              series: [
                [meta(1, 'a1'), meta(2, 'a2'), meta(3, 'a3')],
                [meta(10, 'b1'), meta(20, 'b2'), meta(30, 'b3')]
              ]
            },
            options
          ),
          { width: 400, height: 300 }
        ),
        { role: 'bar' }
      );
      expect(
        bars.map(current => [
          getMultiValue(current.ctx.value, options.horizontalBars ? 'x' : 'y'),
          current.ctx.meta,
          current.attrs['ct:meta']
        ])
      ).toEqual([
        [30, 'b3', 'b3'],
        [20, 'b2', 'b2'],
        [10, 'b1', 'b1'],
        [3, 'a3', 'a3'],
        [2, 'a2', 'a2'],
        [1, 'a1', 'a1']
      ]);
    }
  });
});
