/**
 * Scene nodes: the renderer-independent tree that v2 charts produce.
 * Nodes are immutable. Builder methods keep the 1.x `Svg` names but return
 * a new node and share every field they don't change.
 *
 * @experimental The v2 API may change until v2.0.
 */

import type { NodeRole, NodeRoles } from './roles';

export type AttrValue = string | number;

/** Data attached to a node without a role. Never rendered. */
export interface NodeContext {
  readonly seriesIndex?: number;
  readonly valueIndex?: number;
  readonly value?: unknown;
  readonly meta?: unknown;
  readonly [key: string]: unknown;
}

/** Semantic node fields that aren't attributes. */
export interface NodeMeta {
  readonly key?: string;
  readonly role?: NodeRole;
  readonly ctx?: object;
}

/** The fields every node has, whatever its role. */
export interface SceneNodeFields {
  /** SVG element name, e.g. `g`, `path`, `line`. */
  readonly name: string;
  readonly attrs: Readonly<Record<string, AttrValue>>;
  readonly classes: readonly string[];
  readonly children: readonly SceneNode[];
  /** Text content, set with `text()`. */
  readonly content?: string;
  readonly key?: string;
}

/** The builder methods. Each returns a changed copy of the same type. */
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

/** A node of a role: its context and attributes are that role's. */
export type RoleNode<R extends NodeRole> = SceneNodeFields &
  SceneNodeMethods & {
    readonly role: R;
    /** Indexes read as `number | undefined` on any node, declared or not. */
    readonly ctx: NodeRoles[R]['ctx'] & {
      readonly seriesIndex?: number;
      readonly valueIndex?: number;
    };
    /** As the built-in layers set them; `attr()` can change them. */
    readonly attrs: Readonly<Record<string, AttrValue>> & NodeRoles[R]['attrs'];
  };

/** A node without a role: groups, decorations, anything a plugin adds. */
export type PlainNode = SceneNodeFields &
  SceneNodeMethods & {
    readonly role?: undefined;
    readonly ctx?: NodeContext;
  };

/**
 * A scene node: a node of one of the roles in `NodeRoles`, or a plain one.
 * Check `role` to narrow it, e.g. `if (node.role === 'point') node.ctx.x`.
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

/** What `node()` takes for a node of role `R`: its context, if it has one. */
export type RoleMeta<R extends NodeRole> = {
  readonly role: R;
  readonly key?: string;
} & (object extends NodeRoles[R]['ctx']
  ? { readonly ctx?: NodeRoles[R]['ctx'] }
  : { readonly ctx: NodeRoles[R]['ctx'] });

/**
 * Creates a scene node.
 * @param name SVG element name
 * @param attributes Attributes; `undefined` and `null` values are skipped
 * @param className Space-separated class names
 * @param meta Role, data context and key of the node
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
