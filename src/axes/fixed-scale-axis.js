import {getMultiValue, getHighLow} from '../core/data';
import {times} from '../core/functional';
import {Axis} from './axis';

export class FixedScaleAxis extends Axis {
  constructor(axisUnit, data, chartRect, options) {
    super();

    const highLow = options.highLow || getHighLow(data, options, axisUnit.pos);
    this.divisor = options.divisor || 1;
    this.ticks = options.ticks ||
      times(this.divisor).map(
        (value, index) => highLow.low + (highLow.high - highLow.low) / this.divisor * index
      );
    this.ticks.sort((a, b) => a - b);
    this.range = {
      min: highLow.low,
      max: highLow.high
    };

    super.initialize(axisUnit, chartRect, this.ticks, options);

    this.stepLength = this.axisLength / this.divisor;
  }

  projectValue(value) {
    return this.axisLength * (+getMultiValue(value, this.units.pos) - this.range.min) /
      (this.range.max - this.range.min);
  }
}
