import type { AxisContext, AxisOptions, ScaleAxis } from 'chartist';
import { exponentOf, logAxis, logRange, logTicks } from './logAxis.ts';

/** An axis of `length` px over the values `ys`, as a Y axis. */
function create(
  ys: readonly (number | null)[],
  options: AxisOptions = {},
  length = 400,
  factory = logAxis()
): ScaleAxis {
  const context: AxisContext = {
    dimension: 'y',
    series: [ys.map(y => (y === null ? undefined : { x: undefined, y }))],
    labels: [],
    area: { x1: 0, x2: 100, y1: length, y2: 0, width: 100, height: length },
    options
  } as unknown as AxisContext;
  return factory.create(context);
}

describe('logRange', () => {
  it('widens to whole powers (decades from the data)', () => {
    expect(logRange([120, 850_000], 10)).toEqual({ min: 100, max: 1_000_000 });
  });

  it('widens one power each way when the values share one', () => {
    expect(logRange([100], 10)).toEqual({ min: 10, max: 1000 });
  });

  it('runs from 1 to the base without values', () => {
    expect(logRange([], 10)).toEqual({ min: 1, max: 10 });
  });

  it('keeps exact powers at the ends', () => {
    expect(logRange([1, 1000], 10)).toEqual({ min: 1, max: 1000 });
    expect(logRange([0.001, 0.1], 10)).toEqual({ min: 0.001, max: 0.1 });
  });

  it('works in base 2 and base e', () => {
    expect(logRange([3, 100], 2)).toEqual({ min: 2, max: 128 });
    const e = logRange([2, 30], Math.E);
    expect(e.min).toBeCloseTo(Math.E ** 0);
    expect(e.max).toBeCloseTo(Math.E ** 4);
  });

  it('spans values from 1e-9 to 1e12', () => {
    expect(logRange([2e-9, 3e11], 10)).toEqual({ min: 1e-9, max: 1e12 });
  });

  it('snaps exponents that are whole but for float noise', () => {
    expect(exponentOf(1000, 10)).toBe(3);
    expect(exponentOf(0.001, 10)).toBe(-3);
    expect(exponentOf(31.6, 10)).toBeCloseTo(1.4997);
  });
});

describe('logTicks', () => {
  it('ticks every power that fits', () => {
    expect(logTicks(1, 10_000, 10, 400, 20).ticks).toEqual([
      1, 10, 100, 1000, 10_000
    ]);
  });

  it('ticks every nth power when they are too close, at exponents divisible by n', () => {
    const { ticks, minor } = logTicks(1, 1e8, 10, 100, 20);
    expect(ticks).toEqual([1, 100, 10_000, 1e6, 1e8]);
    expect(minor).toEqual([10, 1000, 1e5, 1e7]);
  });

  it('keeps the same ticks when the range starts at an odd power', () => {
    expect(logTicks(10, 1e8, 10, 87.5, 20).ticks).toEqual([
      100, 10_000, 1e6, 1e8
    ]);
  });

  it('has multiples as minor ticks', () => {
    const { ticks, minor } = logTicks(1, 100, 10, 400, 20);
    expect(ticks).toEqual([1, 10, 100]);
    expect(minor).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90
    ]);
  });

  it('has the powers left out as minor ticks when thinned', () => {
    expect(logTicks(1, 10_000, 10, 60, 20)).toEqual({
      ticks: [1, 100, 10_000],
      minor: [10, 1000]
    });
  });

  it('ticks multiples inside a single power', () => {
    expect(logTicks(20, 80, 10, 300, 20).ticks).toEqual([
      20, 30, 40, 50, 60, 70, 80
    ]);
  });

  it('thins multiples that come too close', () => {
    const { ticks, minor } = logTicks(20, 80, 10, 60, 20);
    expect(ticks[0]).toBe(20);
    expect(minor.length).toBeGreaterThan(0);
    expect([...ticks, ...minor].sort((a, b) => a - b)).toEqual([
      20, 30, 40, 50, 60, 70, 80
    ]);
  });

  it('gives exact decimal powers', () => {
    expect(logTicks(0.001, 1, 10, 300, 20).ticks).toEqual([
      0.001, 0.01, 0.1, 1
    ]);
    expect(logTicks(0.2, 0.9, 10, 300, 20).ticks).toEqual([
      0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9
    ]);
  });

  it('has no multiples between the powers in base 2', () => {
    expect(logTicks(1, 16, 2, 400, 20)).toEqual({
      ticks: [1, 2, 4, 8, 16],
      minor: []
    });
  });

  it('ticks from 1e-9 to 1e12', () => {
    const { ticks } = logTicks(1e-9, 1e12, 10, 2100, 20);
    expect(ticks).toHaveLength(22);
    expect(ticks[0]).toBe(1e-9);
    expect(ticks[21]).toBe(1e12);
  });
});

describe('logAxis', () => {
  it('has the kind log and a log transform', () => {
    const factory = logAxis({ base: 2 });
    expect(factory.kind).toBe('log');
    expect(factory.transform!.forward(8)).toBeCloseTo(3);
    expect(factory.transform!.inverse(3)).toBeCloseTo(8);
    const axis = create([1, 8], {}, 300, factory);
    expect(axis.kind).toBe('log');
    expect(axis.transform).toBe(factory.transform);
  });

  it('throws for a base that is not a finite number above 1', () => {
    for (const base of [1, -10, 0.5, Infinity, NaN]) {
      expect(() => logAxis({ base })).toThrow(/logAxis.*base/);
    }
  });

  it('throws for a low or high of zero or below', () => {
    expect(() => create([1, 10], { low: 0 })).toThrow(/logAxis.*low/);
    expect(() => create([1, 10], { high: -5 })).toThrow(/logAxis.*high/);
  });

  it('fits decades to the data and spaces them evenly (#1176)', () => {
    const axis = create([120, 4100, 850_000]);
    expect(axis.range).toEqual({ min: 100, max: 1_000_000 });
    expect(axis.ticks).toEqual([100, 1000, 10_000, 100_000, 1_000_000]);
    axis.ticks.forEach((tick, index) =>
      expect(axis.project(tick)).toBeCloseTo(index * 100)
    );
  });

  it('places values by their logarithm', () => {
    const axis = create([], { low: 1, high: 1000 }, 300);
    expect(axis.project(1)).toBeCloseTo(0);
    expect(axis.project(10)).toBeCloseTo(100);
    expect(axis.project(100)).toBeCloseTo(200);
    expect(axis.project(Math.sqrt(1000))).toBeCloseTo(150);
    expect(axis.project(31.62)).toBeCloseTo(150, 0);
    // Outside the range: outside the axis.
    expect(axis.project(10_000)).toBeCloseTo(400);
  });

  it('places zero and negative values at the start, and leaves them out of the range', () => {
    const axis = create([0, -5, 10, 1000, null]);
    expect(axis.range).toEqual({ min: 10, max: 1000 });
    expect(axis.project(0)).toBe(0);
    expect(axis.project(-5)).toBe(0);
  });

  it('uses low and high exactly', () => {
    const axis = create([1, 1e6], { low: 50, high: 5000 });
    expect(axis.range).toEqual({ min: 50, max: 5000 });
  });

  it('makes a high at or below low one power above it', () => {
    expect(create([], { low: 50, high: 20 }).range).toEqual({
      min: 50,
      max: 500
    });
    expect(create([1, 10], { low: 100 }).range).toEqual({
      min: 100,
      max: 1000
    });
  });

  it('takes the extent of its layers and the positive part of highLow', () => {
    const extent = logAxis().create({
      dimension: 'y',
      series: [[{ x: undefined, y: 50 }]],
      labels: [],
      area: { x1: 0, x2: 100, y1: 300, y2: 0, width: 100, height: 300 },
      options: { highLow: { low: 0, high: 200 } },
      extent: { low: -3, high: 4000 }
    } as unknown as AxisContext);
    expect(extent.range).toEqual({ min: 10, max: 10_000 });
  });

  it('takes ticks by hand, leaving out zero and below (#64)', () => {
    const axis = create([10, 100], { ticks: [0, 10, 16, 25, 40, 63, 100] });
    expect(axis.ticks).toEqual([10, 16, 25, 40, 63, 100]);
  });

  it('reports minor ticks only when asked', () => {
    expect(create([1, 100]).minorTicks).toBeUndefined();
    const axis = create([1, 100], {}, 400, logAxis({ minorTicks: true }));
    expect(axis.minorTicks).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90
    ]);
    const base2 = create(
      [1, 16],
      {},
      400,
      logAxis({ base: 2, minorTicks: true })
    );
    expect(base2.minorTicks).toEqual([]);
  });

  it('labels small values without float noise', () => {
    const axis = create([0.002, 0.5], {}, 300);
    expect(axis.ticks).toEqual([0.001, 0.01, 0.1, 1]);
    expect(axis.ticks.map(String)).toEqual(['0.001', '0.01', '0.1', '1']);
  });
});
