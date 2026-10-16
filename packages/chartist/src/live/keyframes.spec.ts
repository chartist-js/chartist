import { describe, expect, it } from 'vitest';
import {
  band,
  findAll,
  Interpolation,
  lineChartConfig,
  pieChartConfig,
  SvgPath,
  toScene,
  type ChartConfig,
  type LineInterpolation,
  type Keyframes,
  type NodeRole,
  type SceneNode
} from '../index';
import { builtInKeyframes } from './keyframes';
import type { LiveAnimationContext, ValueKeyContext } from './types';

const SIZE = { width: 400, height: 200 };
const PROGRESS = [0, 0.25, 0.5, 0.75, 1];

type Key = (value: Omit<ValueKeyContext, 'label'>) => string;
const byMeta: Key = ({ meta, valueIndex }) => String(meta ?? valueIndex);
const byIndex: Key = ({ valueIndex }) => String(valueIndex);

function contextOf(
  previousScene: SceneNode,
  scene: SceneNode,
  valueKey: Key
): LiveAnimationContext {
  return {
    changes: [],
    elementOf: () => undefined,
    update: {
      previous: {},
      previousScene,
      cause: 'update',
      labels: [],
      previousLabels: [],
      keyframes: () => undefined
    },
    container: document.body,
    scene,
    valueKey
  };
}

/** Values keyed by their meta: `[['a', 5], ['b', 3]]`. */
function lineScene(
  values: readonly (readonly [string, number])[],
  lineSmooth: LineInterpolation,
  options: Parameters<typeof lineChartConfig>[1] = {}
) {
  return toScene(
    lineChartConfig(
      {
        labels: values.map(([id]) => id),
        series: [values.map(([meta, value]) => ({ value, meta }))]
      },
      { lineSmooth, low: 0, high: 10, ...options }
    ),
    SIZE
  );
}

/** The keyframes of the first node with a role, between two scenes. */
function framesOf(
  previous: SceneNode,
  next: SceneNode,
  role: NodeRole,
  valueKey: Key = byMeta,
  progress: readonly number[] = PROGRESS
): Keyframes | undefined {
  const [from] = findAll(previous, { role } as { role?: NodeRole });
  const [to] = findAll(next, { role } as { role?: NodeRole });
  return builtInKeyframes(
    from,
    to,
    progress,
    contextOf(previous, next, valueKey)
  );
}

/** The end points of a path's commands. */
const endPoints = (d: unknown) =>
  new SvgPath().parse(String(d)).pathElements.map(({ x, y }) => ({ x, y }));

/** Each value's point in a line, by its meta. */
function pointsByMeta(scene: SceneNode) {
  const [line] = findAll(scene, { role: 'line' });
  return new Map(
    line.ctx.path.pathElements.map(({ x, y, data }) => [
      String(data?.meta),
      { x, y }
    ])
  );
}

const SMOOTHINGS: [string, () => LineInterpolation][] = [
  ['none', () => Interpolation.none()],
  ['simple', () => Interpolation.simple()],
  ['cardinal', () => Interpolation.cardinal()],
  ['monotoneCubic', () => Interpolation.monotoneCubic()]
];

const WINDOW: [string, number][] = [
  ['a', 2],
  ['b', 6],
  ['c', 3],
  ['d', 8],
  ['e', 5]
];
const SLID: [string, number][] = [...WINDOW.slice(1), ['f', 4]];

describe('built-in keyframes of lines', () => {
  it.each(SMOOTHINGS)(
    'starts a sliding window where its keys were, with %s smoothing',
    (_, smoothing) => {
      const previous = lineScene(WINDOW, smoothing());
      const next = lineScene(SLID, smoothing());
      const frames = framesOf(previous, next, 'line')!;
      expect(frames).toHaveLength(PROGRESS.length);

      const before = pointsByMeta(previous);
      const start = endPoints(frames[0].d);
      // b to e where they were, f growing out of e, its neighbor before.
      const expected = ['b', 'c', 'd', 'e', 'e'].map(id => before.get(id)!);
      expect(start).toHaveLength(expected.length);
      start.forEach((point, index) => {
        expect(point.x).toBeCloseTo(expected[index].x, 2);
        expect(point.y).toBeCloseTo(expected[index].y, 2);
      });

      const [line] = findAll(next, { role: 'line' });
      expect(frames[PROGRESS.length - 1].d).toBe(line.attrs.d);
    }
  );

  it.each(SMOOTHINGS)(
    'keeps the new path commands in every frame, with %s smoothing',
    (_, smoothing) => {
      const [line] = findAll(lineScene(SLID, smoothing()), { role: 'line' });
      const commands = (d: unknown) => String(d).replace(/[-\d.,e]+/g, '');
      const frames = framesOf(
        lineScene(WINDOW, smoothing()),
        lineScene(SLID, smoothing()),
        'line'
      )!;
      for (const frame of frames) {
        expect(commands(frame.d)).toBe(commands(line.attrs.d));
      }
    }
  );

  it('moves a sliding line left', () => {
    const frames = framesOf(
      lineScene(WINDOW, Interpolation.none()),
      lineScene(SLID, Interpolation.none()),
      'line'
    )!;
    const xs = frames.map(frame => endPoints(frame.d)[0].x);
    for (let index = 1; index < xs.length; index++) {
      expect(xs[index]).toBeLessThan(xs[index - 1]);
    }
  });

  it('grows an appended value out of the last one', () => {
    const previous = lineScene(WINDOW, Interpolation.none());
    const next = lineScene([...WINDOW, ['f', 4]], Interpolation.none());
    const frames = framesOf(previous, next, 'line')!;
    const before = pointsByMeta(previous);
    const start = endPoints(frames[0].d);
    expect(start).toHaveLength(6);
    expect(start[4]).toEqual(before.get('e'));
    expect(start[5].x).toBeCloseTo(before.get('e')!.x, 2);
    expect(start[5].y).toBeCloseTo(before.get('e')!.y, 2);
    expect(frames[PROGRESS.length - 1].d).toBe(
      findAll(next, { role: 'line' })[0].attrs.d
    );
  });

  it('starts a value added in front at its neighbor after it', () => {
    const previous = lineScene(WINDOW, Interpolation.none());
    const next = lineScene([['z', 1], ...WINDOW], Interpolation.none());
    const start = endPoints(framesOf(previous, next, 'line')![0].d);
    const before = pointsByMeta(previous);
    // Both at a's place; the later one a thousandth of a px to its right,
    // so the line keeps its direction.
    expect(start[0]).toEqual(before.get('a'));
    expect(start[1].x).toBeCloseTo(before.get('a')!.x, 2);
    expect(start[1].y).toBe(before.get('a')!.y);
  });

  it('leaves lines that keep their keys to number by number animation', () => {
    expect(
      framesOf(
        lineScene(WINDOW, Interpolation.monotoneCubic()),
        lineScene(
          WINDOW.map(([id, value]) => [id, 10 - value]),
          Interpolation.monotoneCubic()
        ),
        'line'
      )
    ).toBeUndefined();
  });

  it('gives nothing for a path a listener changed', () => {
    const previous = lineScene(WINDOW, Interpolation.none());
    const next = lineScene(SLID, Interpolation.none());
    const [from] = findAll(previous, { role: 'line' });
    const [to] = findAll(next, { role: 'line' });
    expect(
      builtInKeyframes(
        from,
        to.attr({ d: 'M0,0L10,10' }),
        PROGRESS,
        contextOf(previous, next, byMeta)
      )
    ).toBeUndefined();
  });

  it('gives nothing when no key is kept', () => {
    expect(
      framesOf(
        lineScene(WINDOW, Interpolation.none()),
        lineScene(
          WINDOW.map(([id, value]) => [`${id}2`, value]),
          Interpolation.none()
        ),
        'line'
      )
    ).toBeUndefined();
  });

  it('draws areas down to their baseline', () => {
    const previous = lineScene(WINDOW, Interpolation.monotoneCubic(), {
      showArea: true
    });
    const next = lineScene(SLID, Interpolation.monotoneCubic(), {
      showArea: true,
      low: -10
    });
    const frames = framesOf(previous, next, 'area')!;
    const [fromArea] = findAll(previous, { role: 'area' });
    const [toArea] = findAll(next, { role: 'area' });
    const base = (d: unknown) => endPoints(d)[0].y;
    expect(base(frames[0].d)).toBeCloseTo(base(fromArea.attrs.d), 2);
    expect(base(frames[2].d)).toBeCloseTo(
      (base(fromArea.attrs.d) + base(toArea.attrs.d)) / 2,
      2
    );
    expect(frames[PROGRESS.length - 1].d).toBe(toArea.attrs.d);
  });
});

describe('built-in keyframes of bands', () => {
  const bandScene = (count: number) => {
    const values = (offset: number) =>
      Array.from({ length: count }, (_, index) => offset + (index % 3));
    const config: ChartConfig = lineChartConfig(
      {
        series: [
          { name: 'lo', data: values(1) },
          { name: 'hi', data: values(5) }
        ]
      },
      {
        low: 0,
        high: 10,
        showPoint: false,
        layers: { below: [band({ low: 'lo', high: 'hi' })] }
      }
    );
    return toScene(config, SIZE);
  };

  it('follows its series when a value is appended', () => {
    const previous = bandScene(4);
    const next = bandScene(5);
    const frames = framesOf(previous, next, 'band', byIndex)!;
    const [to] = findAll(next, { role: 'band' });
    expect(frames[PROGRESS.length - 1].d).toBe(to.attrs.d);

    // The upper edge moves as the line of the series it follows.
    const [, from] = findAll(previous, { role: 'line' });
    const [, line] = findAll(next, { role: 'line' });
    const lineFrames = builtInKeyframes(
      from,
      line,
      PROGRESS,
      contextOf(previous, next, byIndex)
    )!;
    frames.forEach((frame, index) => {
      expect(String(frame.d).startsWith(String(lineFrames[index].d))).toBe(
        true
      );
    });

    // Every frame keeps the new outline's commands.
    const commands = (d: unknown) => String(d).replace(/[-\d.,e]+/g, '');
    for (const frame of frames) {
      expect(commands(frame.d)).toBe(commands(to.attrs.d));
    }
  });

  it('gives nothing when its values keep their keys', () => {
    expect(
      framesOf(bandScene(4), bandScene(4), 'band', byIndex)
    ).toBeUndefined();
  });
});

describe('built-in keyframes of pie slices', () => {
  const pieScene = (values: number[], donut = false) =>
    toScene(pieChartConfig({ series: values }, { donut }), SIZE);

  const onRadius = (d: unknown, slice: SceneNode) => {
    const { center, radius } = (slice as Extract<SceneNode, { role: 'slice' }>)
      .ctx;
    const points = new SvgPath()
      .parse(String(d))
      .pathElements.filter(({ command }) => command !== 'L');
    for (const { x, y } of points) {
      expect(Math.hypot(x - center.x, y - center.y)).toBeCloseTo(radius, 2);
    }
  };

  it.each([
    ['pie', false],
    ['donut', true]
  ])('keeps a growing %s slice on its radius', (_, donut) => {
    const previous = pieScene([10, 90], donut);
    const next = pieScene([60, 40], donut);
    const frames = framesOf(previous, next, 'slice')!;
    const [slice] = findAll(next, { role: 'slice' });
    expect(frames).toHaveLength(PROGRESS.length);
    for (const frame of frames) {
      onRadius(frame.d, slice);
    }
    expect(frames[0].d).toBe(findAll(previous, { role: 'slice' })[0].attrs.d);
    expect(frames[PROGRESS.length - 1].d).toBe(slice.attrs.d);
  });

  it('draws the second slice with its overlap', () => {
    const next = pieScene([60, 40]);
    const frames = framesOf(pieScene([10, 90]), next, 'slice')!;
    expect(frames).toBeDefined();
    const [first, second] = findAll(next, { role: 'slice' });
    const [, from] = findAll(pieScene([10, 90]), { role: 'slice' });
    const secondFrames = builtInKeyframes(
      from,
      second,
      PROGRESS,
      contextOf(pieScene([10, 90]), next, byMeta)
    )!;
    expect(secondFrames[PROGRESS.length - 1].d).toBe(second.attrs.d);
    expect(secondFrames[0].d).toBe(from.attrs.d);
    expect(first).toBeDefined();
  });

  it('turns past the target angle when the progress overshoots', () => {
    const next = pieScene([60, 40]);
    const frames = framesOf(
      pieScene([10, 90]),
      next,
      'slice',
      byMeta,
      [0, 1.2, 1]
    )!;
    const [slice] = findAll(next, { role: 'slice' });
    const { center } = slice.ctx;
    // The slice is drawn from its end: its first point.
    const [end] = endPoints(frames[1].d);
    const angle =
      (Math.atan2(end.y - center.y, end.x - center.x) * 180) / Math.PI + 90;
    // From 36° to 216°, overshooting by a fifth: 252°.
    expect((angle + 360) % 360).toBeCloseTo(252, 1);
    onRadius(frames[1].d, slice);
  });

  it('moves the labels around the pie with their slices', () => {
    const previous = pieScene([10, 90]);
    const next = pieScene([60, 40]);
    const frames = framesOf(previous, next, 'label', byMeta, [0, 0.5, 1])!;
    const [fromLabel] = findAll(previous, { role: 'label' });
    const [label] = findAll(next, { role: 'label' });
    const [slice] = findAll(next, { role: 'slice' });
    expect(frames[0]).toEqual({
      dx: expect.closeTo(Number(fromLabel.attrs.dx), 6),
      dy: expect.closeTo(Number(fromLabel.attrs.dy), 6)
    });
    expect(frames[2].dx).toBeCloseTo(Number(label.attrs.dx), 6);
    expect(frames[2].dy).toBeCloseTo(Number(label.attrs.dy), 6);

    // Halfway: at the middle angle between 18° and 108°, on the label radius.
    const { center } = slice.ctx;
    const x = Number(frames[1].dx) - center.x;
    const y = Number(frames[1].dy) - center.y;
    expect((Math.atan2(y, x) * 180) / Math.PI + 90).toBeCloseTo(63, 1);
    expect(Math.hypot(x, y)).toBeCloseTo(
      Math.hypot(
        Number(label.attrs.dx) - center.x,
        Number(label.attrs.dy) - center.y
      ),
      6
    );
  });

  it('leaves axis labels and other nodes to number by number animation', () => {
    const previous = lineScene(WINDOW, Interpolation.none());
    const next = lineScene(SLID, Interpolation.none());
    expect(framesOf(previous, next, 'label')).toBeUndefined();
    expect(framesOf(previous, next, 'point')).toBeUndefined();
  });
});
