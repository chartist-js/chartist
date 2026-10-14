import { withFields, type RoleNode, type SceneNode } from './node';
import type { NodeRole } from './roles';

/** Matches nodes by role, key and data context fields. */
export interface NodeQuery {
  readonly role?: NodeRole;
  readonly key?: string;
  readonly seriesIndex?: number;
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
 * Returns all nodes of a tree that match the query, in document order.
 * With a `role`, the nodes are typed as that role's nodes.
 * @experimental
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
 * @experimental
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
