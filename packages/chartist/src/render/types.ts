import type { SceneNode } from '../scene/node';
import type { LabelMode, MeasureText } from './measure';

/** What a renderer returns from `render()`. */
export interface RenderOutput {
  /** The rendered element of a scene node, if the output is DOM. */
  readonly elementOf?: (node: SceneNode) => Element | undefined;
  /** Removes the output again. */
  readonly remove?: () => void;
}

/**
 * Turns a scene into output.
 * @experimental
 */
export interface Renderer<TOutput extends RenderOutput = RenderOutput> {
  render(scene: SceneNode, target: Element): TOutput;
  /** Measures text for layout; renderers without metrics may omit it. */
  readonly measureText?: MeasureText;
  /** The default label mode of this renderer; `html` if omitted. */
  readonly labels?: LabelMode;
}
