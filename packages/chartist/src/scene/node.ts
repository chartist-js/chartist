/**
 * Scene nodes: the renderer-independent tree that v2 charts produce.
 * Nodes are immutable. Builder methods keep the 1.x `Svg` names but return
 * a new node and share every field they don't change.
 *
 * @experimental The v2 API may change until v2.0.
 */

export type AttrValue = string | number;

/** Data a layer attaches to a node. Never rendered. */
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
  readonly role?: string;
  readonly ctx?: NodeContext;
}

export interface SceneNodeFields extends NodeMeta {
  /** SVG element name, e.g. `g`, `path`, `line`. */
  readonly name: string;
  readonly attrs: Readonly<Record<string, AttrValue>>;
  readonly classes: readonly string[];
  readonly children: readonly SceneNode[];
  /** Text content, set with `text()`. */
  readonly content?: string;
}

export interface SceneNode extends SceneNodeFields {
  /** Sets attributes; `undefined` or `null` removes one. */
  attr(attributes: Record<string, AttrValue | undefined | null>): SceneNode;
  /** Adds space-separated class names that aren't present yet. */
  addClass(names: string): SceneNode;
  /** Removes space-separated class names. */
  removeClass(names: string): SceneNode;
  /** Adds a child at the end, or at the start with `insertFirst`. */
  append(child: SceneNode, insertFirst?: boolean): SceneNode;
  /** Removes a direct child (by identity). */
  remove(child: SceneNode): SceneNode;
  /** Replaces a direct child (by identity). */
  replace(child: SceneNode, next: SceneNode): SceneNode;
  /** Sets the text content. */
  text(content: string): SceneNode;
  /** Removes all children and text content. */
  empty(): SceneNode;
}

const splitClasses = (names: string) => names.split(/\s+/).filter(Boolean);

const builder: Omit<SceneNode, keyof SceneNodeFields> = {
  attr(this: SceneNode, attributes) {
    const attrs: Record<string, AttrValue> = { ...this.attrs };
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || value === null) {
        delete attrs[name];
      } else {
        attrs[name] = value;
      }
    }
    return withFields(this, { attrs });
  },
  addClass(this: SceneNode, names) {
    const added = splitClasses(names).filter(
      (name, i, all) => !this.classes.includes(name) && all.indexOf(name) === i
    );
    return added.length
      ? withFields(this, { classes: [...this.classes, ...added] })
      : this;
  },
  removeClass(this: SceneNode, names) {
    const removed = splitClasses(names);
    return withFields(this, {
      classes: this.classes.filter(name => !removed.includes(name))
    });
  },
  append(this: SceneNode, child, insertFirst = false) {
    return withFields(this, {
      children: insertFirst
        ? [child, ...this.children]
        : [...this.children, child]
    });
  },
  remove(this: SceneNode, child) {
    return withFields(this, {
      children: this.children.filter(existing => existing !== child)
    });
  },
  replace(this: SceneNode, child, next) {
    return withFields(this, {
      children: this.children.map(existing =>
        existing === child ? next : existing
      )
    });
  },
  text(this: SceneNode, content) {
    return withFields(this, { content });
  },
  empty(this: SceneNode) {
    return withFields(this, { children: [], content: undefined });
  }
};

function create(fields: SceneNodeFields): SceneNode {
  const created = Object.create(builder) as SceneNode;
  for (const [field, value] of Object.entries(fields)) {
    if (value !== undefined) {
      (created as unknown as Record<string, unknown>)[field] = value;
    }
  }
  return created;
}

/** Copies a node with some fields replaced. Shares all other fields. */
export function withFields(
  source: SceneNode,
  changes: Partial<SceneNodeFields>
): SceneNode {
  return create({ ...(source as SceneNodeFields), ...changes });
}

/**
 * Creates a scene node.
 * @param name SVG element name
 * @param attributes Attributes; `undefined` and `null` values are skipped
 * @param className Space-separated class names
 * @param meta Role, data context and key of the node
 */
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
