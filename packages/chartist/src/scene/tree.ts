import { withFields, type RoleNode, type SceneNode } from './node';
import type { NodeRole } from './roles';

/**
 * What {@link findAll} looks for: nodes by role, key and data context
 * fields. A node matches when it matches every field given; an empty query
 * matches every node.
 */
export interface NodeQuery {
  /** Only nodes of this role, e.g. `bar`. */
  readonly role?: NodeRole;
  /** Only the node with this key, e.g. `0/1/3` (layer, series, value). */
  readonly key?: string;
  /** Only nodes of the series with this index (`ctx.seriesIndex`). */
  readonly seriesIndex?: number;
  /** Only nodes of the value with this index (`ctx.valueIndex`). */
  readonly valueIndex?: number;
}

function matches(candidate: SceneNode, query: NodeQuery) {
  return (
    (query.role === undefined || candidate.role === query.role) &&
    (query.key === undefined || candidate.key === query.key) &&
    (query.seriesIndex === undefined ||
      candidate.ctx?.seriesIndex === query.seriesIndex) &&
    (query.valueIndex === undefined ||
      candidate.ctx?.valueIndex === query.valueIndex)
  );
}

/**
 * Finds all nodes of a scene that match the query, in document order, the
 * root included. With a `role`, the nodes are typed as that role's nodes.
 *
 * @param scene The root of the tree to search, e.g. the `scene` payload
 * @param query The fields to match; without one, every node matches
 * @example
 * ```ts
 * import { barChart, findAll } from 'chartist';
 *
 * barChart(
 *   '#chart',
 *   { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [[5, 4, 3, 7]] },
 *   {
 *     plugins: [
 *       {
 *         name: 'log-bars',
 *         install(chart) {
 *           chart.on('scene', ({ scene }) => {
 *             for (const bar of findAll(scene, { role: 'bar' })) {
 *               console.log(bar.key, bar.ctx.value, bar.ctx.y2);
 *             }
 *           });
 *         }
 *       }
 *     ]
 *   }
 * );
 * ```
 */
export function findAll<R extends NodeRole>(
  scene: SceneNode,
  query: NodeQuery & { readonly role: R }
): RoleNode<R>[];
export function findAll(scene: SceneNode, query?: NodeQuery): SceneNode[];
export function findAll(scene: SceneNode, query: NodeQuery = {}): SceneNode[] {
  const found: SceneNode[] = [];
  const visit = (current: SceneNode) => {
    if (matches(current, query)) {
      found.push(current);
    }
    current.children.forEach(visit);
  };
  visit(scene);
  return found;
}

/**
 * Maps a tree bottom-up: children first, then their parent with the mapped
 * children. Return a node to replace, `null` to drop, or `undefined` to
 * keep. Subtrees without changes are reused, not copied.
 *
 * @param scene The root of the tree to map
 * @param mapper Called once per node, with the node's mapped children
 * @returns The mapped tree, or `null` if the mapper dropped the root
 * @example
 * ```ts
 * import { lineChartConfig, mapNodes } from 'chartist';
 * import { renderToString, toScene } from 'chartist/server';
 *
 * const scene = toScene(
 *   lineChartConfig({ labels: ['Mon', 'Tue', 'Wed'], series: [[1, 3, 2]] }),
 *   { width: 600, height: 300 }
 * );
 *
 * // No grid lines, and the points marked for the stylesheet.
 * const mapped = mapNodes(scene, current => {
 *   if (current.role === 'grid') {
 *     return null;
 *   }
 *   if (current.role === 'point') {
 *     return current.addClass('is-marked');
 *   }
 * });
 * const markup = mapped ? renderToString(mapped) : '';
 * ```
 */
export function mapNodes(
  scene: SceneNode,
  mapper: (current: SceneNode) => SceneNode | null | undefined | void
): SceneNode | null {
  let children = scene.children as SceneNode[];
  let changed = false;
  const mapped: SceneNode[] = [];
  for (const child of children) {
    const result = mapNodes(child, mapper);
    if (result !== child) {
      changed = true;
    }
    if (result) {
      mapped.push(result);
    }
  }
  if (changed) {
    children = mapped;
  }
  const current = changed ? withFields(scene, { children }) : scene;
  const result = mapper(current);
  return result === undefined ? current : result;
}

/**
 * Keys data nodes that have none: `layer/series/value` for nodes with a
 * series and value index, `layer/series` for nodes with only a series.
 */
export function assignKeys(scene: SceneNode, layerIndex: number): SceneNode {
  return mapNodes(scene, current => {
    const seriesIndex = current.ctx?.seriesIndex;
    if (current.key !== undefined || seriesIndex === undefined) {
      return undefined;
    }
    const valueIndex = current.ctx?.valueIndex;
    return withFields(current, {
      key:
        valueIndex === undefined
          ? `${layerIndex}/${seriesIndex}`
          : `${layerIndex}/${seriesIndex}/${valueIndex}`
    });
  }) as SceneNode;
}
