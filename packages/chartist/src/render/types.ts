import type { SceneNode } from '../scene/node';
import type { LabelMode, MeasureText } from './measure';

/**
 * What a renderer returns from `render()`. The `render` and `mount` phase
 * events pass it on as `output`.
 */
export interface RenderOutput {
  /** The rendered element of a scene node, if the output is DOM. */
  readonly elementOf?: (node: SceneNode) => Element | undefined;
  /** Removes the output again. */
  readonly remove?: () => void;
}

/**
 * Turns a scene into output. `chart()` renders inline SVG into its
 * container with the DOM renderer, unless its config sets a `renderer`.
 * To get markup instead, without a DOM, use `toScene()` and
 * {@link renderToString}.
 * @experimental
 */
export interface Renderer<TOutput extends RenderOutput = RenderOutput> {
  /**
   * Renders a scene into the chart's container, after the `scene` phase
   * and on every update and resize.
   * @param scene The scene to render, its root the `svg`
   * @param target The chart's container element
   */
  render(scene: SceneNode, target: Element): TOutput;
  /**
   * Measures text for layout, in the container so its CSS applies;
   * without it, Chartist estimates text sizes.
   */
  readonly measureText?: MeasureText;
  /** The default label mode of this renderer; `html` if omitted. */
  readonly labels?: LabelMode;
}
