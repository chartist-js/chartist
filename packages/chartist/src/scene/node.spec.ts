import { pointContext } from '../../test/contexts';
import { freezeDeep } from '../../test/freeze';
import { node } from './node';

describe('scene/node', () => {
  it('creates nodes with attributes, unique classes and meta', () => {
    const point = node('line', { x1: 1, y1: undefined, y2: null }, 'a  b a', {
      role: 'point',
      ctx: pointContext({ valueIndex: 2 })
    });
    expect(point.name).toBe('line');
    expect(point.attrs).toEqual({ x1: 1 });
    expect(point.classes).toEqual(['a', 'b']);
    expect(point.children).toEqual([]);
    expect(point.role).toBe('point');
    expect(point.ctx).toEqual(pointContext({ valueIndex: 2 }));
    expect(Object.keys(point)).not.toContain('key');
  });

  it('builder methods return new nodes and leave the original unchanged', () => {
    const original = freezeDeep(node('circle', { r: 2 }, 'dot'));
    const changed = original
      .attr({ r: 8, cx: 1 })
      .addClass('highlight')
      .removeClass('dot')
      .text('label');

    expect(original.attrs).toEqual({ r: 2 });
    expect(original.classes).toEqual(['dot']);
    expect(original.content).toBeUndefined();
    expect(changed.attrs).toEqual({ r: 8, cx: 1 });
    expect(changed.classes).toEqual(['highlight']);
    expect(changed.content).toBe('label');
  });

  it('attr removes attributes set to undefined or null', () => {
    const line = freezeDeep(node('line', { x1: 1, x2: 2, y1: 3 }));
    expect(line.attr({ x1: undefined, x2: null }).attrs).toEqual({ y1: 3 });
  });

  it('addClass returns the same node when nothing is added', () => {
    const group = freezeDeep(node('g', {}, 'a b'));
    expect(group.addClass('b a')).toBe(group);
  });

  it('shares unchanged fields between versions', () => {
    const child = node('line');
    const group = freezeDeep(node('g', { id: 'x' }).append(child));
    const renamed = group.attr({ id: 'y' });
    expect(renamed.children).toBe(group.children);
    expect(renamed.classes).toBe(group.classes);
    const marked = group.addClass('m');
    expect(marked.attrs).toBe(group.attrs);
  });

  it('append, remove and replace work on direct children by identity', () => {
    const a = node('line', {}, 'a');
    const b = node('line', {}, 'b');
    const c = node('circle', {}, 'c');
    const group = freezeDeep(node('g').append(a).append(b));

    expect(group.append(c, true).children).toEqual([c, a, b]);
    expect(group.remove(a).children).toEqual([b]);
    expect(group.replace(b, c).children).toEqual([a, c]);
    expect(group.children).toEqual([a, b]);
  });

  it('empty removes children and text', () => {
    const label = freezeDeep(node('text').text('x').append(node('tspan')));
    const emptied = label.empty();
    expect(emptied.children).toEqual([]);
    expect(emptied.content).toBeUndefined();
    expect(emptied.text('y').content).toBe('y');
  });

  it('keeps the builder working on nodes that have text content', () => {
    const label = node('text').text('a');
    expect(label.text('b').content).toBe('b');
  });
});
