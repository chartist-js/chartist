/**
 * Scene nodes: the renderer-independent tree that v2 charts produce.
 * Nodes are immutable. Builder methods keep the 1.x `Svg` names but return
 * a new node and share every field they don't change.
 *
 * @experimental The v2 API may change until v2.0.
 */

import type { NodeRole, NodeRoles } from './roles';

/**
 * The value of a node attribute. Numbers are written as they are, e.g.
 * `x1="12.5"`.
 */
export type AttrValue = string | number;

/**
 * Data attached to a node without a role, e.g. by a plugin. Never rendered.
 * Any fields are allowed; the ones below have a meaning to Chartist.
 */
export interface NodeContext {
  /**
   * The index of the series the node belongs to. With it, the node gets a
   * `key` and {@link findAll} can find it by series.
   */
  readonly seriesIndex?: number;
  /** The index of the value in its series the node stands for. */
  readonly valueIndex?: number;
  /** The value the node stands for. */
  readonly value?: unknown;
  /** The `meta` of the value or series, as given in the data. */
  readonly meta?: unknown;
  /** Any other data you want to keep with the node. */
  readonly [key: string]: unknown;
}

/**
 * What a node means, next to how it looks: its key, role and data
 * context. None of it is rendered.
 */
export interface NodeMeta {
  /** A stable id, e.g. `0/1/3` (layer, series, value). */
  readonly key?: string;
  /** What the node draws, e.g. `point` or `bar`: a key of {@link NodeRoles}. */
  readonly role?: NodeRole;
  /** The node's data: what its role declares, or anything for plain nodes. */
  readonly ctx?: object;
}

/** The fields every node has, whatever its role. */
export interface SceneNodeFields {
  /** SVG element name, e.g. `g`, `path`, `line`. */
  readonly name: string;
  /**
   * The element's attributes, without `class`. Names with a `ct:` prefix
   * (`ct:value`, `ct:meta`) are written in the Chartist namespace.
   */
  readonly attrs: Readonly<Record<string, AttrValue>>;
  /** The element's class names, each once, in the order they were added. */
  readonly classes: readonly string[];
  /** The child nodes, in document order. */
  readonly children: readonly SceneNode[];
  /** Text content, set with `text()`. */
  readonly content?: string;
  /**
   * A stable id that survives updates. The pipeline keys data nodes that
   * have none: `layer/series/value` for a value's node (e.g. `0/1/3`),
   * `layer/series` for a series' node.
   */
  readonly key?: string;
}

/**
 * The builder methods of every node. Each returns a changed copy of the
 * same type and leaves the node it's called on as it was.
 */
export interface SceneNodeMethods {
  /** Sets attributes; `undefined` or `null` removes one. */
  attr(attributes: Record<string, AttrValue | undefined | null>): this;
  /** Adds space-separated class names that aren't present yet. */
  addClass(names: string): this;
  /** Removes space-separated class names. */
  removeClass(names: string): this;
  /** Adds a child at the end, or at the start with `insertFirst`. */
  append(child: SceneNode, insertFirst?: boolean): this;
  /** Removes a direct child (by identity). */
  remove(child: SceneNode): this;
  /** Replaces a direct child (by identity). */
  replace(child: SceneNode, next: SceneNode): this;
  /** Sets the text content. */
  text(content: string): this;
  /** Removes all children and text content. */
  empty(): this;
}

/**
 * A node of a role, such as `RoleNode<'point'>`: its context and
 * attributes are the ones {@link NodeRoles} declares for that role.
 * {@link findAll} with a `role` returns these.
 */
export type RoleNode<R extends NodeRole> = SceneNodeFields &
  SceneNodeMethods & {
    /** What the node draws, e.g. `point`. */
    readonly role: R;
    /**
     * The node's data, as its role declares it. `seriesIndex` and
     * `valueIndex` read as `number | undefined` on any node, declared or
     * not.
     */
    readonly ctx: NodeRoles[R]['ctx'] & {
      readonly seriesIndex?: number;
      readonly valueIndex?: number;
    };
    /**
     * The element's attributes, typed as the built-in layers set them;
     * `attr()` can change them.
     */
    readonly attrs: Readonly<Record<string, AttrValue>> & NodeRoles[R]['attrs'];
  };

/** A node without a role: groups, decorations, anything a plugin adds. */
export type PlainNode = SceneNodeFields &
  SceneNodeMethods & {
    /** Always absent: plain nodes have no role. */
    readonly role?: undefined;
    /** Data you attach to the node, if any. */
    readonly ctx?: NodeContext;
  };

/**
 * A scene node: a node of one of the roles in {@link NodeRoles}, or a plain
 * one. Check `role` to narrow it, e.g. `if (node.role === 'point') node.ctx.x`.
 *
 * Nodes are immutable: the builder methods ({@link SceneNodeMethods}) return
 * a new node. The `compose` and `scene` phase events pass nodes to your
 * listeners, and the renderers turn them into SVG.
 */
export type SceneNode = { [R in NodeRole]: RoleNode<R> }[NodeRole] | PlainNode;

const splitClasses = (names: string) => names.split(/\s+/).filter(Boolean);

/** The node fields as stored, for copying. */
type StoredFields = SceneNodeFields & NodeMeta;

const builder: SceneNodeMethods = {
  attr(this: SceneNode, attributes) {
    const attrs: Record<string, AttrValue> = { ...this.attrs };
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || value === null) {
        delete attrs[name];
      } else {
        attrs[name] = value;
      }
    }
    return withFields(this as SceneNode, { attrs });
  },
  addClass(this: SceneNode, names) {
    const added = splitClasses(names).filter(
      (name, i, all) => !this.classes.includes(name) && all.indexOf(name) === i
    );
    return added.length
      ? withFields(this as SceneNode, { classes: [...this.classes, ...added] })
      : this;
  },
  removeClass(this: SceneNode, names) {
    const removed = splitClasses(names);
    return withFields(this as SceneNode, {
      classes: this.classes.filter(name => !removed.includes(name))
    });
  },
  append(this: SceneNode, child, insertFirst = false) {
    return withFields(this as SceneNode, {
      children: insertFirst
        ? [child, ...this.children]
        : [...this.children, child]
    });
  },
  remove(this: SceneNode, child) {
    return withFields(this as SceneNode, {
      children: this.children.filter(existing => existing !== child)
    });
  },
  replace(this: SceneNode, child, next) {
    return withFields(this as SceneNode, {
      children: this.children.map(existing =>
        existing === child ? next : existing
      )
    });
  },
  text(this: SceneNode, content) {
    return withFields(this as SceneNode, { content });
  },
  empty(this: SceneNode) {
    return withFields(this as SceneNode, { children: [], content: undefined });
  }
};

function create(fields: StoredFields): SceneNode {
  const created = Object.create(builder) as SceneNode;
  for (const [field, value] of Object.entries(fields)) {
    if (value !== undefined) {
      (created as unknown as Record<string, unknown>)[field] = value;
    }
  }
  return created;
}

/**
 * Copies a node with some fields replaced. Shares all other fields. The
 * copy has the source's type unless the changes give it another role.
 */
export function withFields<T extends SceneNode>(
  source: T,
  changes: Partial<Omit<SceneNodeFields, 'attrs'>> & {
    readonly attrs?: Readonly<Record<string, AttrValue>>;
  }
): T;
export function withFields<R extends NodeRole>(
  source: SceneNode,
  changes: Partial<SceneNodeFields> & {
    readonly role: R;
    /** Indexes read as `number | undefined` on any node, declared or not. */
    readonly ctx: NodeRoles[R]['ctx'] & {
      readonly seriesIndex?: number;
      readonly valueIndex?: number;
    };
  }
): RoleNode<R>;
export function withFields(
  source: SceneNode,
  changes: Partial<StoredFields>
): SceneNode {
  return create({ ...(source as StoredFields), ...changes });
}

/**
 * What {@link node} takes as `meta` for a node of role `R`: the role, a key,
 * and the role's context (required when the role declares fields).
 */
export type RoleMeta<R extends NodeRole> = {
  /** The node's role, e.g. `point`. */
  readonly role: R;
  /** A stable id; the pipeline sets one for data nodes that have none. */
  readonly key?: string;
} & (object extends NodeRoles[R]['ctx']
  ? { readonly ctx?: NodeRoles[R]['ctx'] }
  : { readonly ctx: NodeRoles[R]['ctx'] });

/**
 * Creates a scene node: an SVG element with attributes and classes, and,
 * for a node with a role, its data context. Use it in `compose` listeners
 * and custom layers to add or replace elements. With a `role` in `meta`,
 * the node is typed as that role's node and the context is checked.
 *
 * @param name SVG element name, e.g. `circle`, `g` or `text`
 * @param attributes Attributes; `undefined` and `null` values are skipped
 * @param className Space-separated class names
 * @param meta Role, data context and key of the node
 * @returns A new node without children
 * @example
 * ```ts
 * import { lineChart, node } from 'chartist';
 *
 * // Circles instead of the line chart's points.
 * lineChart(
 *   '#chart',
 *   { series: [[1, 3, 2, 4]] },
 *   {
 *     plugins: [
 *       {
 *         name: 'circles',
 *         install(chart) {
 *           chart.on('compose', current => {
 *             if (current.role !== 'point') {
 *               return;
 *             }
 *             const { x, y } = current.ctx;
 *             return node('circle', { cx: x, cy: y, r: 5 }, 'ct-circle', {
 *               role: 'point',
 *               ctx: current.ctx,
 *               key: current.key
 *             });
 *           });
 *         }
 *       }
 *     ]
 *   }
 * );
 * ```
 */
export function node<R extends NodeRole>(
  name: string,
  attributes: Record<string, AttrValue | undefined | null>,
  className: string,
  meta: RoleMeta<R>
): RoleNode<R>;
export function node(
  name: string,
  attributes?: Record<string, AttrValue | undefined | null>,
  className?: string,
  meta?: { readonly key?: string; readonly ctx?: NodeContext }
): PlainNode;
export function node(
  name: string,
  attributes: Record<string, AttrValue | undefined | null> = {},
  className = '',
  meta: NodeMeta = {}
): SceneNode {
  const attrs: Record<string, AttrValue> = {};
  for (const [attr, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      attrs[attr] = value;
    }
  }
  return create({
    name,
    attrs,
    classes: [...new Set(splitClasses(className))],
    children: [],
    ...meta
  });
}
