import { findAll, mapNodes, node } from 'chartist';

describe('scene nodes (v2)', () => {
  test('builder calls return new nodes and keep the original', () => {
    const point = node('circle', { r: 2 }, 'dot', { role: 'point' });
    const changed = point.addClass('highlight').attr({ r: 8 });
    expect(point.attrs).toEqual({ r: 2 });
    expect(point.classes).toEqual(['dot']);
    expect(changed.attrs).toEqual({ r: 8 });
    expect(changed.classes).toEqual(['dot', 'highlight']);
    expect(changed.role).toBe('point');
  });

  test('nodes have no parent/root navigation', () => {
    const child = node('line');
    const group = node('g').append(child);
    expect('parent' in group).toBe(false);
    expect('root' in group).toBe(false);
    expect(group.children[0]).toBe(child);
  });

  test('findAll queries by role and series', () => {
    const scene = node('svg')
      .append(node('rect', {}, '', { role: 'bar', ctx: { seriesIndex: 0 } }))
      .append(node('rect', {}, '', { role: 'bar', ctx: { seriesIndex: 1 } }))
      .append(node('line', {}, '', { role: 'grid' }));
    expect(findAll(scene, { role: 'bar', seriesIndex: 0 })).toHaveLength(1);
    expect(findAll(scene, { role: 'bar' })).toHaveLength(2);
  });

  test('mapNodes shares unchanged subtrees with the original', () => {
    const untouched = node('g', {}, 'grids').append(node('line'));
    const scene = node('svg')
      .append(untouched)
      .append(node('g').append(node('rect', {}, '', { role: 'bar' })));
    const mapped = mapNodes(scene, n =>
      n.role === 'bar' ? n.addClass('changed') : undefined
    )!;
    expect(mapped.children[0]).toBe(untouched);
    expect(findAll(mapped, { role: 'bar' })[0].classes).toEqual(['changed']);
    expect(findAll(scene, { role: 'bar' })[0].classes).toEqual([]);
  });
});
