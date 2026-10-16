import type { SceneChange } from '../render/types';
import type { SceneNode } from '../scene/node';

/** Adds an entry for `current` and each of its descendants, in document order. */
function each(current: SceneNode, op: SceneChange['op'], into: SceneChange[]) {
  into.push({ op, node: current });
  current.children.forEach(child => each(child, op, into));
}

/**
 * The changes of a render that replaced its output: every node of the
 * previous scene removed, every node of the new one added.
 */
export function replacementChanges(
  previous: SceneNode | undefined,
  next: SceneNode
): SceneChange[] {
  const changes: SceneChange[] = [];
  if (previous) {
    each(previous, 'remove', changes);
  }
  each(next, 'add', changes);
  return changes;
}

/**
 * Set on a chart handle by the 1.x classes and the compat plugin: the
 * chart never hands its renderer the previous render, so every render
 * draws new elements, as 1.x code expects. A global symbol, so the compat
 * build sets the same one as the core.
 */
export const REPLACES_OUTPUT = Symbol.for('chartist.replacesOutput');

/** Whether the chart must replace its output on every render. */
export const replacesOutput = (handle: object) =>
  (handle as { [REPLACES_OUTPUT]?: boolean })[REPLACES_OUTPUT] === true;
