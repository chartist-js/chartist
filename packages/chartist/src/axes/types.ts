import type { AutoScaleAxis } from './AutoScaleAxis';
import type { FixedScaleAxis } from './FixedScaleAxis';
import type { StepAxis } from './StepAxis';

/**
 * The 1.x axis classes an axis's `type` option takes: {@link AutoScaleAxis}, {@link FixedScaleAxis} or {@link StepAxis}.
 *
 * @deprecated Use the scale functions `autoScaleAxis()`, `fixedScaleAxis()` and `stepAxis()`. Removed in 3.0.
 */
export type AxisType =
  | typeof AutoScaleAxis
  | typeof FixedScaleAxis
  | typeof StepAxis;
