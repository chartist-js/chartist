import type {
  MeasureStyle,
  RenderUpdate,
  SceneChange,
  SceneNode,
  UpdateAnimation
} from '../index';

/**
 * What {@link ValueKey} functions get about a value: where it is, the
 * value itself, the label at its position and its meta.
 * @experimental
 */
export interface ValueKeyContext {
  /** The series' index in the chart's data. */
  readonly seriesIndex: number;
  /** The value's index in its series (for pie data, 0). */
  readonly valueIndex: number;
  /** The value, as the layer drew it. */
  readonly value: unknown;
  /** The label at the value's position: `labels[valueIndex]`, or the slice's label in pie data. */
  readonly label: unknown;
  /** The value's meta, if any. */
  readonly meta: unknown;
}

/**
 * What identifies a value across updates: `'index'` (the default) its
 * position in its series, `'label'` the label at its position, or a
 * function of the value, such as `({ meta }) => meta.id`.
 * @experimental
 */
export type ValueKey =
  | 'index'
  | 'label'
  | ((value: ValueKeyContext) => string | number);

/**
 * The options of {@link diffScenes}: how values are identified, and the
 * labels for `key: 'label'`.
 * @experimental
 */
export interface DiffOptions {
  /** What identifies a value across updates; `'index'` by default. */
  readonly key?: ValueKey;
  /** The new scene's labels, for `key: 'label'`. */
  readonly labels?: readonly unknown[];
  /** The previous scene's labels, for `key: 'label'`; `labels` if omitted. */
  readonly previousLabels?: readonly unknown[];
}

/**
 * What the live renderer hands its {@link LiveAnimations} after patching
 * the SVG of an update.
 * @experimental
 */
export interface LiveAnimationContext {
  /** The changes the render made, in document order. */
  readonly changes: readonly SceneChange[];
  /** The element of a node of the new scene. */
  readonly elementOf: (node: SceneNode) => Element | undefined;
  /** The previous render, with the cause and the keyframes lookup. */
  readonly update: RenderUpdate;
  /** The chart's container. */
  readonly container: Element;
  /** The new scene. */
  readonly scene: SceneNode;
  /** Reads computed styles in the container, with the chart's root classes. */
  readonly measureStyle?: MeasureStyle;
  /**
   * The key that identifies a value across updates, as the renderer's
   * `key` option says: for the value at `valueIndex` of series
   * `seriesIndex`, with its value and meta, in the previous scene or the
   * new one (labels differ between them).
   */
  readonly valueKey: (
    context: Omit<ValueKeyContext, 'label'>,
    scene: 'previous' | 'next'
  ) => string;
}

/**
 * Update animations for the live renderer, such as {@link smilAnimations}:
 * called after the SVG of an update was patched, it starts the animations
 * and returns their timing, or nothing when the render doesn't animate.
 * @experimental
 */
export interface LiveAnimations {
  /** Starts the update animations of a render. */
  animate(context: LiveAnimationContext): UpdateAnimation | undefined;
}

/**
 * The options of {@link liveDomRenderer}.
 * @experimental
 */
export interface LiveDomRendererOptions {
  /** What identifies a value across updates; `'index'` by default. */
  readonly key?: ValueKey;
  /** Update animations, such as `smilAnimations()`; none by default. */
  readonly animations?: LiveAnimations;
}
