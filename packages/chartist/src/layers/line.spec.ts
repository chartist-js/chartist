import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { findAll } from '../scene/tree';
import { SvgPath } from '../svg/SvgPath';
import { line, type LineLayerOptions } from './line';

function scene(series: unknown[], options: LineLayerOptions = {}) {
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
  ).scene;
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
    for (const role of ['line', 'area']) {
      const [shape] = findAll(result, { role });
      expect(shape.ctx?.path).toBeInstanceOf(SvgPath);
      // Padded to the three labels, as 1.x normalizes.
      expect(shape.ctx?.values).toEqual([
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
