import { freezeDeep } from '../../test/freeze';
import { node } from './node';
import { assignKeys, findAll, mapNodes } from './tree';

function sample() {
  const point = (seriesIndex: number, valueIndex: number) =>
    node('line', {}, 'ct-point', {
      role: 'point',
      ctx: { seriesIndex, valueIndex }
    });
  const series = (seriesIndex: number) =>
    node('g', {}, 'ct-series', { role: 'series', ctx: { seriesIndex } })
      .append(point(seriesIndex, 0))
      .append(point(seriesIndex, 1));
  return freezeDeep(
    node('svg')
      .append(node('g', {}, 'ct-grids'))
      .append(series(0))
      .append(series(1))
  );
}

describe('scene/tree', () => {
  it('findAll matches role and data context in document order', () => {
    const scene = sample();
    expect(findAll(scene, { role: 'point' })).toHaveLength(4);
    expect(
      findAll(scene, { role: 'point', seriesIndex: 1 }).map(
        p => p.ctx?.valueIndex
      )
    ).toEqual([0, 1]);
    expect(findAll(scene, { role: 'series' })).toHaveLength(2);
    expect(findAll(scene)).toHaveLength(8);
  });

  it('mapNodes reuses untouched subtrees and rebuilds changed paths', () => {
    const scene = sample();
    const result = mapNodes(scene, current =>
      current.role === 'point' && current.ctx?.seriesIndex === 1
        ? current.addClass('marked')
        : undefined
    )!;

    expect(result).not.toBe(scene);
    expect(result.children[0]).toBe(scene.children[0]);
    expect(result.children[1]).toBe(scene.children[1]);
    expect(result.children[2]).not.toBe(scene.children[2]);
    expect(
      findAll(result, { role: 'point', seriesIndex: 1 })[0].classes
    ).toEqual(['ct-point', 'marked']);
  });

  it('mapNodes returns the same tree when nothing changes', () => {
    const scene = sample();
    expect(mapNodes(scene, () => undefined)).toBe(scene);
  });

  it('mapNodes drops nodes for null and passes mapped children up', () => {
    const scene = sample();
    const seen: number[] = [];
    const result = mapNodes(scene, current => {
      if (current.role === 'series') {
        seen.push(current.children.length);
      }
      return current.role === 'point' && current.ctx?.valueIndex === 0
        ? null
        : undefined;
    })!;
    expect(seen).toEqual([1, 1]);
    expect(findAll(result, { role: 'point' })).toHaveLength(2);
  });

  it('assignKeys keys series and value nodes, keeping existing keys', () => {
    const keyed = node('line', {}, '', {
      key: 'mine',
      ctx: { seriesIndex: 0, valueIndex: 0 }
    });
    const scene = freezeDeep(sample().append(keyed));
    const result = assignKeys(scene, 2);
    expect(findAll(result, { role: 'point' }).map(p => p.key)).toEqual([
      '2/0/0',
      '2/0/1',
      '2/1/0',
      '2/1/1'
    ]);
    expect(findAll(result, { role: 'series' }).map(s => s.key)).toEqual([
      '2/0',
      '2/1'
    ]);
    expect(findAll(result, { key: 'mine' })).toHaveLength(1);
    expect(result.key).toBeUndefined();
  });
});
