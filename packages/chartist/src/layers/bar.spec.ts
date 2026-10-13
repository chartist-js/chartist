import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { findAll } from '../scene/tree';
import { bar, getSerialSums } from './bar';

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

  it('getSerialSums adds values per index', () => {
    expect(
      getSerialSums([
        [
          { x: 1, y: 2 },
          { x: 0, y: 1 }
        ],
        [{ x: 3, y: 4 }]
      ] as never)
    ).toEqual([
      { x: 4, y: 6 },
      { x: 0, y: 1 }
    ]);
  });
});
