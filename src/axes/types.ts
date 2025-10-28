import type { AutoScaleAxis } from './AutoScaleAxis';
import { AutoScalePolarAxis } from './AutoScalePolarAxis';
import type { FixedScaleAxis } from './FixedScaleAxis';
import { PolarStepAxis } from './PolarStepAxis';
import type { StepAxis } from './StepAxis';

export type CartesianAxisType =
  | typeof AutoScaleAxis
  | typeof FixedScaleAxis
  | typeof StepAxis;

export type PolarAxisType = typeof AutoScalePolarAxis | typeof PolarStepAxis;

export type AxisType = CartesianAxisType | PolarAxisType;
