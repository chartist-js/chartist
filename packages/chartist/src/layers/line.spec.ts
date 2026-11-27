import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { findAll } from '../scene/tree';
import { SvgPath } from '../svg/SvgPath';
import type { CurveParams, PathCommand } from '../svg/types';
import { line, type LineLayerOptions } from './line';

function render(series: unknown[], options: LineLayerOptions = {}) {
  return runPipeline(
    createPhaseEmitter(),
    {
      data: { labels: ['a', 'b', 'c'], series },
      axes: cartesianAxes({
        x: { type: stepAxis(), ticks: ['a', 'b', 'c'] },
        y: { type: autoScaleAxis() },
        reverseData: options.reverseData
      }),
      layers: [line(options)]
    },
    { width: 400, height: 200, measureText: estimateText }
  );
}

function scene(series: unknown[], options: LineLayerOptions = {}) {
  return render(series, options).scene;
}

describe('layers/line', () => {
  it('needs both axes', () => {
    expect(() =>
      runPipeline(
        createPhaseEmitter(),
        { data: { series: [[1]] }, layers: [line()] },
        { width: 100, height: 100, measureText: estimateText }
      )
    ).toThrow('Layer "line" needs an x and a y axis');
  });

  it('series nodes carry name, meta and letter classes', () => {
    const result = scene([{ name: 'a', meta: { m: 1 }, data: [1, 2] }, [3, 4]]);
    const groups = findAll(result, { role: 'series' });
    expect(groups.map(g => g.classes)).toEqual([
      ['ct-series', 'ct-series-a'],
      ['ct-series', 'ct-series-b']
    ]);
    expect(groups[0].attrs['ct:series-name']).toBe('a');
    expect(groups[0].attrs['ct:meta']).toBe(
      '{&quot;data&quot;:{&quot;m&quot;:1}}'
    );
    expect(groups.map(g => g.key)).toEqual(['0/0', '0/1']);
  });

  it('orders areas, line and points as 1.x and keys data nodes', () => {
    const group = findAll(scene([[1, 2, 3]], { showArea: true }), {
      role: 'series'
    })[0];
    expect(group.children.map(c => c.role)).toEqual([
      'area',
      'line',
      'point',
      'point',
      'point'
    ]);
    expect(findAll(group, { role: 'point' }).map(p => p.key)).toEqual([
      '0/0/0',
      '0/0/1',
      '0/0/2'
    ]);
  });

  it('point context has what 1.x draw events expose', () => {
    const [point] = findAll(scene([[{ value: 5, meta: 'm' }]]), {
      role: 'point'
    });
    expect(point.ctx).toMatchObject({
      seriesIndex: 0,
      valueIndex: 0,
      value: { x: undefined, y: 5 },
      meta: 'm'
    });
    expect(typeof point.ctx?.x).toBe('number');
    expect(typeof point.ctx?.y).toBe('number');
    expect(point.attrs['ct:value']).toBe('5');
    expect(point.attrs['ct:meta']).toBe('m');
  });

  it('line and area context carry the values and a path copy', () => {
    const result = scene([[1, 2]], { showArea: true });
    for (const role of ['line', 'area'] as const) {
      const [shape] = findAll(result, { role });
      expect(shape.ctx.path).toBeInstanceOf(SvgPath);
      // Padded to the three labels, as 1.x normalizes.
      expect(shape.ctx.values).toEqual([
        { x: undefined, y: 1 },
        { x: undefined, y: 2 },
        undefined
      ]);
    }
  });

  it('per-series options override by series name', () => {
    const result = scene(
      [
        { name: 'hidden', data: [1, 2] },
        { name: 'shown', data: [1, 2] }
      ],
      { overrides: { hidden: { showPoint: false, showLine: false } } }
    );
    expect(findAll(result, { role: 'point', seriesIndex: 0 })).toHaveLength(0);
    expect(findAll(result, { role: 'line', seriesIndex: 0 })).toHaveLength(0);
    expect(findAll(result, { role: 'point', seriesIndex: 1 })).toHaveLength(2);
  });

  it('reverseData iterates the series from the end', () => {
    const result = scene(
      [
        { name: 'first', data: [1] },
        { name: 'second', data: [2] }
      ],
      {
        reverseData: true
      }
    );
    expect(
      findAll(result, { role: 'series' }).map(g => g.attrs['ct:series-name'])
    ).toEqual(['second', 'first']);
  });
});

describe('layers/line meta', () => {
  it('reverses the meta with the values for reverseData (#1534)', () => {
    const meta = (value: number, name: string) => ({ value, meta: name });
    const points = findAll(
      scene([[meta(1, 'a'), meta(2, 'b'), meta(3, 'c')]], {
        reverseData: true
      }),
      { role: 'point' }
    );
    expect(points.map(point => [point.ctx.value, point.ctx.meta])).toEqual([
      [{ x: undefined, y: 3 }, 'c'],
      [{ x: undefined, y: 2 }, 'b'],
      [{ x: undefined, y: 1 }, 'a']
    ]);
  });
});

describe('layers/line stacking', () => {
  it('fits running totals and keeps original point values and metadata', () => {
    const series = [
      [10, 20, 30],
      [{ value: 2, meta: 'two' }, 3, 4]
    ];
    const before = structuredClone(series);
    const result = render(series, { stack: true, lineSmooth: false });
    const axis = result.axes.y!;
    const points = findAll(result.scene, { role: 'point', seriesIndex: 1 });
    expect(points.map(point => point.attrs.y1)).toEqual(
      [12, 23, 34].map(value => result.layout.area.y1 - axis.project(value))
    );
    expect(axis.range!.min).toBeLessThanOrEqual(0);
    expect(axis.range!.max).toBeGreaterThanOrEqual(34);
    expect(points[0].attrs['ct:value']).toBe('2');
    expect(points[0].ctx).toMatchObject({ value: { y: 2 }, meta: 'two' });
    expect(series).toEqual(before);
  });

  it('includes intermediate totals when negative values reduce a stack', () => {
    const result = render(
      [
        [8, -8, 0],
        [8, -8, 0],
        [-8, 8, 0],
        [-8, 8, 0],
        [1, -1, 2]
      ],
      { stack: true, lineSmooth: false }
    );
    const axis = result.axes.y!;
    expect(axis.range!.min).toBeLessThanOrEqual(-16);
    expect(axis.range!.max).toBeGreaterThanOrEqual(16);
    expect(
      findAll(result.scene, { role: 'point', seriesIndex: 4 }).map(
        point => point.attrs.y1
      )
    ).toEqual(
      [1, -1, 2].map(value => result.layout.area.y1 - axis.project(value))
    );
  });

  it('fills between successive totals instead of areaBase', () => {
    const result = render(
      [
        [2, 4, 3],
        [1, 2, 3]
      ],
      { stack: true, showArea: true, areaBase: 100, lineSmooth: false }
    );
    const lower = findAll(result.scene, { role: 'line', seriesIndex: 0 })[0].ctx
      .path;
    const upper = findAll(result.scene, { role: 'line', seriesIndex: 1 })[0].ctx
      .path;
    const area = findAll(result.scene, { role: 'area', seriesIndex: 1 })[0].ctx
      .path;
    expect(area.pathElements.map(({ x, y }) => [x, y])).toEqual([
      ...upper.pathElements.map(({ x, y }) => [x, y]),
      ...lower.pathElements.toReversed().map(({ x, y }) => [x, y])
    ]);
    expect(area.stringify()).toMatch(/z$/i);
  });

  it('leaves holes without discarding earlier or later totals', () => {
    const result = render(
      [
        [2, null, 4],
        [3, 5, null],
        [1, 0, 2]
      ],
      { stack: true, showArea: true, lineSmooth: false }
    );
    const axis = result.axes.y!;
    expect(
      findAll(result.scene, { role: 'point', seriesIndex: 2 }).map(
        point => point.attrs.y1
      )
    ).toEqual(
      [6, 5, 6].map(value => result.layout.area.y1 - axis.project(value))
    );
    expect(
      findAll(result.scene, { role: 'point', seriesIndex: 1 })
    ).toHaveLength(2);
    expect(
      findAll(result.scene, { role: 'area', seriesIndex: 0 })
    ).toHaveLength(0);
    expect(
      findAll(result.scene, { role: 'area', seriesIndex: 1 })
    ).toHaveLength(1);
  });

  it('traces the lower curve backwards when closing a smooth area', () => {
    const result = scene(
      [
        [2, 4, 3],
        [1, 2, 3]
      ],
      { stack: true, showArea: true }
    );
    const lower = findAll(result, { role: 'line', seriesIndex: 0 })[0].ctx.path
      .pathElements;
    const area = findAll(result, { role: 'area', seriesIndex: 1 })[0].ctx.path
      .pathElements;
    expect(area.map(element => element.command)).toEqual([
      'M',
      'C',
      'C',
      'L',
      'C',
      'C'
    ]);
    const curve = lower[2] as PathCommand<CurveParams>;
    expect(area[4]).toMatchObject({
      x: lower[1].x,
      y: lower[1].y,
      x1: curve.x2,
      y1: curve.y2,
      x2: curve.x1,
      y2: curve.y1
    });
  });

  it('stacks only selected series in the requested order', () => {
    const result = render(
      [
        [100, 100, 100],
        [2, 3, 4],
        [5, 6, 7]
      ],
      { stack: true, series: [2, 1], lineSmooth: false }
    );
    const axis = result.axes.y!;
    expect(
      findAll(result.scene, { role: 'point', seriesIndex: 1 }).map(
        point => point.attrs.y1
      )
    ).toEqual(
      [7, 9, 11].map(value => result.layout.area.y1 - axis.project(value))
    );
    expect(
      findAll(result.scene, { role: 'series' }).map(
        group => group.ctx.seriesIndex
      )
    ).toEqual([2, 1]);
  });

  it('fits intermediate negative totals in reversed drawing order', () => {
    const result = render(
      [10, 10, -20, -20, 5].map(value => [value, value, value]),
      {
        stack: true,
        reverseData: true,
        lineSmooth: false
      }
    );
    const axis = result.axes.y!;
    expect(axis.range!.min).toBeLessThanOrEqual(-35);
    expect(
      findAll(result.scene, { role: 'series' }).map(
        group => findAll(group, { role: 'point' })[0].attrs.y1
      )
    ).toEqual(
      [5, -15, -35, -25, -15].map(
        value => result.layout.area.y1 - axis.project(value)
      )
    );
  });

  it('stacks reversed data in its displayed order', () => {
    const result = render(
      [
        [1, 2, 3],
        [4, 5, 6]
      ],
      { stack: true, reverseData: true, lineSmooth: false }
    );
    const axis = result.axes.y!;
    const groups = findAll(result.scene, { role: 'series' });
    expect(
      findAll(groups[0], { role: 'point' }).map(point => point.attrs.y1)
    ).toEqual(
      [6, 5, 4].map(value => result.layout.area.y1 - axis.project(value))
    );
    expect(
      findAll(groups[1], { role: 'point' }).map(point => point.attrs.y1)
    ).toEqual(
      [9, 7, 5].map(value => result.layout.area.y1 - axis.project(value))
    );
  });
});
