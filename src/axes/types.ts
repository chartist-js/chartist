import type { AutoScaleAxis } from './AutoScaleAxis';
import type { AutoScalePolarAxis } from './AutoScalePolarAxis';
import type { FixedScaleAxis } from './FixedScaleAxis';
import type { FixedScalePolarAxis } from './FixedScalePolarAxis';
import type { StepPolarAxis } from './StepPolarAxis';
import type { StepAxis } from './StepAxis';

export type CartesianAxisType =
  | typeof AutoScaleAxis
  | typeof FixedScaleAxis
  | typeof StepAxis;

export type PolarAxisType =
  | typeof AutoScalePolarAxis
  | typeof FixedScalePolarAxis
  | typeof StepPolarAxis;

export type AxisType = CartesianAxisType | PolarAxisType;
