import type { AttrValue, SceneNode } from '../scene/node';
import type { LabelMode, MeasureStyle, MeasureText } from './measure';

/**
 * Why a chart rendered: `create` for its first render, `update` for
 * `update()` (and the presets' `setOptions()`), `resize` when its
 * container's size changed, `responsive` when its matching `responsive`
 * entries changed, `fonts` when web fonts finished loading.
 */
export type RenderCause =
  | 'create'
  | 'update'
  | 'resize'
  | 'responsive'
  | 'fonts';

/**
 * What a render did to one node of the output: `add` for a node the
 * previous scene didn't have, `update` for a node whose attributes,
 * classes or text changed (with its `previous` node), `remove` for a node
 * of the previous scene that's gone.
 */
export interface SceneChange {
  /** What happened to the node. */
  readonly op: 'add' | 'update' | 'remove';
  /** The node: of the new scene, or of the previous one for `remove`. */
  readonly node: SceneNode;
  /** The node in the previous scene, for `update`. */
  readonly previous?: SceneNode;
}

/**
 * The keyframes of a node's update animation: one set of attributes per
 * progress point, in the order of the points.
 */
export type Keyframes = readonly Readonly<Record<string, AttrValue>>[];

/**
 * The timing of a render's update animation: its duration in ms and its
 * easing as a CSS easing, such as `ease-out`.
 */
export interface UpdateAnimation {
  /** The duration in ms. */
  readonly duration: number;
  /** The CSS easing, such as `ease-out` or `cubic-bezier(0.3, 0, 0.2, 1)`. */
  readonly easing: string;
}

/**
 * What a renderer gets about the previous render, from a chart's second
 * render on. A renderer can change its previous output in place with it,
 * instead of replacing it; renderers keep no state themselves.
 */
export interface RenderUpdate<TOutput extends RenderOutput = RenderOutput> {
  /** What this renderer returned for the previous render. */
  readonly previous: TOutput;
  /** The previous render's scene. */
  readonly previousScene: SceneNode;
  /** Why the chart renders. */
  readonly cause: RenderCause;
  /** The data's labels, for keys from labels. */
  readonly labels: readonly unknown[];
  /** The previous render's labels, for keys from labels in the previous scene. */
  readonly previousLabels: readonly unknown[];
  /**
   * Asks the chart's plugins, then the layer that drew the node, for the
   * keyframes of a node's update at the given progress points (0 is the
   * previous node, 1 the new one; points may lie beyond them when the
   * easing overshoots). Returns nothing when none of them has any.
   */
  readonly keyframes: (
    previous: SceneNode,
    next: SceneNode,
    progress: readonly number[]
  ) => Keyframes | undefined;
}

/**
 * What a renderer returns from `render()`. The `render` and `mount` phase
 * events pass it on as `output`.
 */
export interface RenderOutput {
  /** The rendered element of a scene node, if the output is DOM. */
  readonly elementOf?: (node: SceneNode) => Element | undefined;
  /** Removes the output again. */
  readonly remove?: () => void;
  /**
   * `true` when the renderer changed its previous output in place with
   * the `update` it got, instead of replacing it. Then `changes` says what
   * it did.
   */
  readonly patched?: boolean;
  /**
   * What the renderer did to each changed node, with `patched`. Without
   * them, the chart describes the render as a replacement.
   */
  readonly changes?: readonly SceneChange[];
  /**
   * The timing of the update animation the renderer started, if any. The
   * `mount` event passes it on as `animation`.
   */
  readonly animation?: UpdateAnimation;
}

/**
 * Turns a scene into output. `chart()` renders inline SVG into its
 * container with the DOM renderer, unless its config sets a `renderer`.
 * To get markup instead, without a DOM, use `toScene()` and
 * {@link renderToString}.
 */
export interface Renderer<TOutput extends RenderOutput = RenderOutput> {
  /**
   * Renders a scene into the chart's container, after the `scene` phase
   * and on every update and resize. From the second render on, it gets
   * the previous render as `update`: a renderer that changes its previous
   * output in place returns `patched: true` and its `changes`; one that
   * ignores `update` replaces its output, as the DOM renderer does.
   * @param scene The scene to render, its root the `svg`
   * @param target The chart's container element
   * @param update The previous render, from the chart's second render on
   */
  render(
    scene: SceneNode,
    target: Element,
    update?: RenderUpdate<TOutput>
  ): TOutput;
  /**
   * Measures text for layout, in the container so its CSS applies;
   * without it, Chartist estimates text sizes.
   */
  readonly measureText?: MeasureText;
  /**
   * Reads computed styles for layout, in the container so its CSS
   * applies; without it, layout uses its defaults (a donut's ring is
   * laid out for 60 px).
   */
  readonly measureStyle?: MeasureStyle;
  /** The default label mode of this renderer; `html` if omitted. */
  readonly labels?: LabelMode;
}
