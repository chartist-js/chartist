import { Axis } from './axis';

export class StepAxis extends Axis {
  constructor(axisUnit, data, chartRect, options) {
    super();
    super.initialize(axisUnit, chartRect, options.ticks, options);

    const calc = Math.max(1, options.ticks.length - (options.stretch ? 1 : 0));
    this.stepLength = this.axisLength / calc;
  }

  projectValue(value, index) {
    return this.stepLength * index;
  }
}
