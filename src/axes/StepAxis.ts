import type { ChartRect, AxisOptions } from '../core';
import { AxisUnits, Axis } from './Axis';

export class StepAxis extends Axis {
  private readonly stepLength: number;
  public readonly stretch: boolean;

  constructor(
    axisUnit: AxisUnits,
    _data: unknown,
    chartRect: ChartRect,
    options: AxisOptions
  ) {
    const ticks = options.ticks || [];

    super(axisUnit, chartRect, ticks);

    const calc = Math.max(1, ticks.length - (options.stretch ? 1 : 0));
    this.stepLength = this.axisLength / calc;
    this.stretch = Boolean(options.stretch);
  }

  projectValue(_value: unknown, index: number) {
    return this.stepLength * index;
  }
}
