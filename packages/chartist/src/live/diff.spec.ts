// @vitest-environment node
import {
  axisGrid,
  axisLabels,
  barChartConfig,
  cartesianAxes,
  findAll,
  fixedScaleAxis,
  line,
  lineChartConfig,
  node,
  pieChartConfig,
  stepAxis,
  toScene,
  type SceneChange,
  type SceneNode
} from '../index';
import { diffScenes } from './diff';
import type { DiffOptions } from './types';

const SIZE = { width: 600, height: 300 };

/** A field of a node's context. */
const field = (current: SceneNode, name: string) =>
  (current.ctx as Record<string, unknown> | undefined)?.[name];

/** The changes of the nodes of one role, as `op key`. */
function ops(changes: readonly SceneChange[], role: string) {
  return changes
    .filter(change => change.node.role === role)
    .map(change => `${change.op} ${change.node.key}`);
}

/** The added and removed X labels, as `op text`. */
function labelOps(changes: readonly SceneChange[]) {
  return changes
    .filter(
      ({ op, node: current }) =>
        op !== 'update' &&
        current.role === 'label' &&
        current.ctx.kind === 'axis' &&
        current.ctx.axis.dimension === 'x'
    )
    .map(({ op, node: current }) => `${op} ${String(field(current, 'text'))}`);
}

function line5(labels: string[], values: number[]) {
  return toScene(lineChartConfig({ labels, series: [values] }), SIZE);
}

const week = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
const shifted = ['Tu', 'We', 'Th', 'Fr', 'Sa'];

describe('live/diffScenes', () => {
  it('finds no changes between equal scenes', () => {
    const before = line5(week, [1, 2, 3, 4, 5]);
    const after = line5(week, [1, 2, 3, 4, 5]);
    expect(diffScenes(before, after)).toEqual([]);
  });

  it('lists one update for a changed bar, with its previous node', () => {
    const before = toScene(
      barChartConfig({ series: [[5, 4, 3, 7]] }, { high: 10, low: 0 }),
      SIZE
    );
    const after = toScene(
      barChartConfig({ series: [[5, 8, 3, 7]] }, { high: 10, low: 0 }),
      SIZE
    );
    const changes = diffScenes(before, after);
    expect(changes).toHaveLength(1);
    const [change] = changes;
    expect(change.op).toBe('update');
    expect(change.node.key).toBe('1/0/1');
    expect(change.node.attrs.y2).not.toBe(change.previous!.attrs.y2);
    expect(change.previous).toBe(findAll(before, { key: '1/0/1' })[0]);
  });

  it('follows labels through a sliding window', () => {
    const changes = diffScenes(
      line5(week, [1, 2, 3, 4, 5]),
      line5(shifted, [2, 3, 4, 5, 6]),
      { key: 'label', labels: shifted, previousLabels: week }
    );
    const points = ops(changes, 'point');
    expect(points.filter(op => op.startsWith('add'))).toEqual(['add 1/0/4']);
    expect(points.filter(op => op.startsWith('remove'))).toEqual([
      'remove 1/0/0'
    ]);
    // The kept points moved left: Tu (index 1 before) is index 0 now.
    const tuesday = changes.find(
      c => c.node.role === 'point' && c.node.key === '1/0/0'
    )!;
    expect(tuesday.op).toBe('update');
    expect(tuesday.previous!.key).toBe('1/0/1');
    expect(labelOps(changes)).toEqual(['add Sa', 'remove Mo']);
  });

  it('keeps every point with index keys', () => {
    const changes = diffScenes(
      line5(week, [1, 2, 3, 4, 5]),
      line5(shifted, [2, 3, 4, 5, 6])
    );
    const points = ops(changes, 'point');
    expect(points).toHaveLength(5);
    expect(points.every(op => op.startsWith('update'))).toBe(true);
    const moved = changes.filter(c => c.node.role === 'point');
    expect(moved.every(c => c.node.key === c.previous!.key)).toBe(true);
  });

  it('keeps the grid lines and labels of ticks that stay', () => {
    const scene = (ticks: number[]) =>
      toScene(
        {
          data: { labels: ['a', 'b'], series: [[0, 10]] },
          axes: cartesianAxes([
            { id: 'x', side: 'bottom', type: stepAxis(), ticks: ['a', 'b'] },
            {
              id: 'y',
              side: 'left',
              type: fixedScaleAxis(),
              ticks,
              low: 0,
              high: 15
            }
          ]),
          layers: [axisGrid(), line(), axisLabels()]
        },
        SIZE
      );
    const changes = diffScenes(scene([0, 5, 10]), scene([0, 5, 10, 15]));
    const onY = changes.filter(
      ({ node: current }) =>
        (current.role === 'grid' || current.role === 'label') &&
        (current.ctx as { axis?: { id: string } }).axis?.id === 'y'
    );
    const added = onY.filter(c => c.op === 'add');
    expect(added.map(c => `${c.node.role} ${field(c.node, 'index')}`)).toEqual([
      'grid 3',
      'label 3'
    ]);
    expect(onY.filter(c => c.op === 'remove')).toEqual([]);
  });

  it('keys values by their meta', () => {
    const scene = (ids: number[]) =>
      toScene(
        lineChartConfig({
          series: [ids.map(id => ({ value: id, meta: { id } }))]
        }),
        SIZE
      );
    const key: DiffOptions['key'] = ({ meta }) => (meta as { id: number }).id;
    // Value 2 moves to the front, 1 is gone and 4 is new.
    const changes = diffScenes(scene([1, 2, 3]), scene([2, 3, 4]), { key });
    const points = changes.filter(c => c.node.role === 'point');
    expect(
      points.map(c => [c.op, (field(c.node, 'meta') as { id: number }).id])
    ).toEqual([
      ['update', 2],
      ['update', 3],
      ['add', 4],
      ['remove', 1]
    ]);
    expect(points[0].previous!.key).toBe('1/0/1');
  });

  it('matches repeated labels in their order, as with index keys', () => {
    const labels = ['A', 'B', 'A'];
    const before = line5(labels, [1, 2, 3]);
    const after = line5(labels, [3, 2, 1]);
    const byLabel = diffScenes(before, after, { key: 'label', labels });
    const byIndex = diffScenes(before, after);
    expect(byLabel).toEqual(byIndex);
    expect(byLabel.some(c => c.op !== 'update')).toBe(false);
  });

  it('keys pie slices, their series and labels by the slice labels', () => {
    const pie = (labels: string[], series: number[]) =>
      toScene(pieChartConfig({ labels, series }), SIZE);
    const changes = diffScenes(
      pie(['A', 'B', 'C'], [1, 2, 3]),
      pie(['B', 'C', 'D'], [2, 3, 4]),
      { key: 'label', labels: ['B', 'C', 'D'], previousLabels: ['A', 'B', 'C'] }
    );
    const slices = changes.filter(c => c.node.role === 'slice');
    expect(slices.map(c => `${c.op} ${field(c.node, 'value')}`)).toEqual([
      'update 2',
      'update 3',
      'add 4',
      'remove 1'
    ]);
    // Kept series groups get the class of their new position.
    const series = changes.filter(c => c.node.role === 'series');
    expect(series.map(c => c.op)).toEqual([
      'update',
      'update',
      'add',
      'remove'
    ]);
  });

  it('lists every node of added and removed subtrees in document order', () => {
    const group = (...children: SceneNode[]) =>
      children.reduce(
        (parent, child) => parent.append(child),
        node('g', {}, 'group')
      );
    const before = node('svg').append(
      group(
        node('line', {}, 'a'),
        node('text', {}, 'gone').append(node('tspan'))
      )
    );
    const after = node('svg').append(
      group(
        node('line', {}, 'a'),
        node('rect', {}, 'new').append(node('title'))
      )
    );
    const changes = diffScenes(before, after);
    expect(changes.map(c => `${c.op} ${c.node.name}`)).toEqual([
      'add rect',
      'add title',
      'remove text',
      'remove tspan'
    ]);
  });

  it('removes and adds a matched node whose element name changed', () => {
    const before = node('svg').append(
      node('circle', { r: 2 }, '', { key: 'dot' })
    );
    const after = node('svg').append(
      node('rect', { width: 2 }, '', { key: 'dot' })
    );
    expect(
      diffScenes(before, after).map(c => `${c.op} ${c.node.name}`)
    ).toEqual(['add rect', 'remove circle']);
  });

  it('matches nodes with their own key wherever they move', () => {
    const a = node('circle', { r: 1 }, 'dot', { key: 'a' });
    const b = node('circle', { r: 2 }, 'dot', { key: 'b' });
    const before = node('svg').append(a).append(b);
    const after = node('svg')
      .append(b.attr({ r: 3 }))
      .append(a);
    const changes = diffScenes(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].previous).toBe(b);
  });

  it('matches other nodes by name and first class, in their order', () => {
    const before = node('svg')
      .append(node('text', {}, 'note').text('one'))
      .append(node('text', {}, 'note').text('two'));
    const after = node('svg')
      .append(node('text', {}, 'other').text('new'))
      .append(node('text', {}, 'note').text('one'))
      .append(node('text', {}, 'note').text('three'));
    const changes = diffScenes(before, after);
    expect(changes.map(c => `${c.op} ${c.node.content}`)).toEqual([
      'add new',
      'update three'
    ]);
    expect(changes[1].previous!.content).toBe('two');
  });

  it('matches series by layer and index', () => {
    const before = toScene(
      lineChartConfig({
        series: [
          [1, 2],
          [3, 4]
        ]
      }),
      SIZE
    );
    const after = toScene(lineChartConfig({ series: [[1, 2]] }), SIZE);
    const series = diffScenes(before, after).filter(
      c => c.node.role === 'series'
    );
    expect(series.map(c => `${c.op} ${c.node.key}`)).toEqual(['remove 1/1']);
  });

  it('lists an update for changed classes and text', () => {
    const before = node('svg').append(node('text', {}, 'label a').text('1'));
    const classes = node('svg').append(node('text', {}, 'label b').text('1'));
    const text = node('svg').append(node('text', {}, 'label a').text('2'));
    expect(diffScenes(before, classes).map(c => c.op)).toEqual(['update']);
    expect(diffScenes(before, text).map(c => c.op)).toEqual(['update']);
  });
});
