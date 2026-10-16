/**
 * The label function of an axis or a pie: `labelTransform`, or its 1.x
 * name `labelInterpolationFnc`, or the label itself.
 */
import type { Label } from '../core/types';

type LabelFunction = (value: Label, index: number) => Label | null | undefined;

/** The label function to use; `labelTransform` wins when both are set. */
export function labelTransformOf(options: {
  readonly labelTransform?: LabelFunction;
  readonly labelInterpolationFnc?: LabelFunction;
}): LabelFunction {
  return (
    options.labelTransform ??
    // The 1.x name, still read until 3.0.
    options.labelInterpolationFnc ??
    (value => value)
  );
}
