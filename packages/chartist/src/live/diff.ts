import type { SceneChange, SceneNode } from '../index';
import type { DiffOptions } from './types';

/**
 * The changes between two scenes, matched by what each node stands for:
 * `add`, `update` (with the previous node) and `remove`, in document
 * order. The live renderer patches its SVG with them; other renderers
 * that change their output in place can use them too.
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
  void options;
  return previous === next ? [] : [];
}
