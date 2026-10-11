import type { AutoScaleAxis } from './AutoScaleAxis';
import type { FixedScaleAxis } from './FixedScaleAxis';
import type { StepAxis } from './StepAxis';

export type AxisType =
  | typeof AutoScaleAxis
  | typeof FixedScaleAxis
  | typeof StepAxis;
