import type { SceneChange, SceneNode } from '../index';
import type { DiffOptions, ValueKeyContext } from './types';

/**
 * The value key of a value, as the `key` option says. `index` is the
 * position the `index` mode uses: the value's index, or a slice's series.
 */
export type ValueKeyOf = (value: ValueKeyContext, index?: number) => string;

/** The changes of two scenes, and the previous node of each kept node. */
export interface SceneMatch {
  readonly changes: SceneChange[];
  /** The previous node of each node of the new scene that was kept. */
  readonly matched: Map<SceneNode, SceneNode>;
}

/** The value key function of a `key` option. */
export function valueKeyOf(key: DiffOptions['key'] = 'index'): ValueKeyOf {
  return key === 'index'
    ? (value, index = value.valueIndex) => String(index)
    : key === 'label'
      ? ({ label }) => String(label)
      : value => String(key(value));
}

/** The context fields identities are made of. */
interface IdentityFields {
  readonly seriesIndex?: unknown;
  readonly valueIndex?: unknown;
  readonly value?: unknown;
  readonly meta?: unknown;
  readonly kind?: unknown;
  readonly index?: unknown;
  readonly axis?: {
    readonly id?: string;
    readonly dimension: string;
    readonly ticks: readonly unknown[];
  };
}

/** What a node stands for, before repeats among its siblings are counted. */
function identityOf(
  current: SceneNode,
  valueKey: ValueKeyOf,
  labels: readonly unknown[]
): string {
  const ctx = (current.ctx ?? {}) as IdentityFields;
  const { seriesIndex, valueIndex, axis, index } = ctx;
  const role = current.role ?? current.name;
  if (typeof seriesIndex === 'number') {
    // The layer is the first part of the pipeline key (`layer/…`).
    const own = current.key ?? '';
    const end = own.indexOf('/');
    const layer = end < 0 ? own : own.slice(0, end);
    // In flat pie data, every value is a series: a slice, its series
    // group and its label are keyed by the slice's label and position.
    const slice =
      current.role === 'slice' || ctx.kind === 'pie'
        ? ctx
        : current.role === 'series' &&
            current.children.length === 1 &&
            current.children[0].role === 'slice'
          ? (current.children[0].ctx as IdentityFields)
          : undefined;
    if (slice) {
      const key = valueKey(
        {
          seriesIndex,
          valueIndex: 0,
          value: slice.value,
          label: labels[seriesIndex],
          meta: slice.meta
        },
        seriesIndex
      );
      return `v:${layer}/pie/${key}:${role}`;
    }
    if (typeof valueIndex !== 'number') {
      return `s:${layer}/${seriesIndex}:${role}`;
    }
    const key = valueKey({
      seriesIndex,
      valueIndex,
      value: ctx.value,
      label: labels[valueIndex],
      meta: ctx.meta
    });
    return `v:${layer}/${seriesIndex}/${key}:${role}`;
  }
  if (axis && typeof index === 'number') {
    return `t:${axis.id ?? axis.dimension}:${role}:${String(axis.ticks[index])}`;
  }
  if (current.key !== undefined) {
    return `k:${current.key}`;
  }
  return `p:${current.name}.${current.classes[0] ?? ''}`;
}

/** The identities of sibling nodes, with `#2`, `#3` for repeats. */
function identities(
  nodes: readonly SceneNode[],
  valueKey: ValueKeyOf,
  labels: readonly unknown[]
): string[] {
  const seen = new Map<string, number>();
  return nodes.map(current => {
    const identity = identityOf(current, valueKey, labels);
    const count = (seen.get(identity) ?? 0) + 1;
    seen.set(identity, count);
    return count > 1 ? `${identity}#${count}` : identity;
  });
}

/** Whether a node's classes, attributes or text changed. */
function differs(previous: SceneNode, next: SceneNode) {
  if (
    previous.content !== next.content ||
    previous.classes.length !== next.classes.length ||
    previous.classes.some((name, i) => next.classes[i] !== name)
  ) {
    return true;
  }
  const names = Object.keys(next.attrs);
  return (
    names.length !== Object.keys(previous.attrs).length ||
    names.some(name => previous.attrs[name] !== next.attrs[name])
  );
}

/** Lists a node and every node below it, in document order. */
function every(
  op: 'add' | 'remove',
  current: SceneNode,
  changes: SceneChange[]
) {
  changes.push({ op, node: current });
  current.children.forEach(child => every(op, child, changes));
}

/**
 * Matches two scenes per parent and lists the changes in the new scene's
 * document order, `remove` entries after their former parent's kept
 * children. Roots with different element names aren't matched.
 */
export function matchScenes(
  previous: SceneNode,
  next: SceneNode,
  options: DiffOptions = {}
): SceneMatch {
  const valueKey = valueKeyOf(options.key);
  const labels = options.labels ?? [];
  const previousLabels = options.previousLabels ?? labels;
  const changes: SceneChange[] = [];
  const matched = new Map<SceneNode, SceneNode>();

  const visit = (before: SceneNode, after: SceneNode) => {
    matched.set(after, before);
    if (differs(before, after)) {
      changes.push({ op: 'update', node: after, previous: before });
    }
    const kept = new Map<string, SceneNode>();
    identities(before.children, valueKey, previousLabels).forEach(
      (identity, i) => kept.set(identity, before.children[i])
    );
    const removed = new Set(before.children);
    identities(after.children, valueKey, labels).forEach((identity, i) => {
      const child = after.children[i];
      const match = kept.get(identity);
      if (match && match.name === child.name) {
        removed.delete(match);
        visit(match, child);
      } else {
        every('add', child, changes);
      }
    });
    removed.forEach(child => every('remove', child, changes));
  };

  if (previous.name === next.name) {
    visit(previous, next);
  } else {
    every('add', next, changes);
    every('remove', previous, changes);
  }
  return { changes, matched };
}

/**
 * The changes between two scenes, matched by what each node stands for:
 * `add`, `update` (with the previous node) and `remove`, in the new
 * scene's document order, with the `remove` entries after their former
 * parent's kept children. Every node of an added or removed subtree has
 * its own entry. The live renderer patches its SVG with them; other
 * renderers that change their output in place can use them too.
 *
 * Nodes are matched among the children of matched parents: values by
 * their layer, series and key (see `key`), series by layer and index,
 * grid lines and axis labels by axis and tick, nodes with their own
 * `key` by it, and the rest by element name and first class, in order.
 *
 * @example
 * ```ts
 * import { lineChartConfig, toScene } from 'chartist';
 * import { diffScenes } from 'chartist/live';
 *
 * const size = { width: 600, height: 300 };
 * const labels = ['Mo', 'Tu', 'We'];
 * const before = toScene(lineChartConfig({ labels, series: [[1, 2, 3]] }), size);
 * const after = toScene(lineChartConfig({ labels, series: [[1, 5, 3]] }), size);
 *
 * for (const { op, node } of diffScenes(before, after, { labels })) {
 *   console.log(op, node.role, node.key);
 * }
 * ```
 * @param previous The previous scene
 * @param next The new scene
 * @param options How values are identified, and the data's labels
 * @returns The changes, in the new scene's document order
 * @experimental
 */
export function diffScenes(
  previous: SceneNode,
  next: SceneNode,
  options: DiffOptions = {}
): SceneChange[] {
  return matchScenes(previous, next, options).changes;
}
