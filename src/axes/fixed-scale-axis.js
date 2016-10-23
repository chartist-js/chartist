import {getMultiValue, getHighLow} from '../core/data';
import {times} from '../core/functional';
import {Axis} from './axis';

export class FixedScaleAxis extends Axis {
  constructor(axisUnit, data, chartRect, options) {
    super();

    var highLow = options.highLow || getHighLow(data, options, axisUnit.pos);
    this.divisor = options.divisor || 1;
    this.ticks = options.ticks || times(this.divisor).map(function(value, index) {
        return highLow.low + (highLow.high - highLow.low) / this.divisor * index;
      }.bind(this));
    this.ticks.sort(function(a, b) {
      return a - b;
    });
    this.range = {
      min: highLow.low,
      max: highLow.high
    };

    super.initialize(axisUnit, chartRect, this.ticks, options);

    this.stepLength = this.axisLength / this.divisor;
  }

  projectValue(value) {
    return this.axisLength * (+getMultiValue(value, this.units.pos) - this.range.min) / (this.range.max - this.range.min);
  }
}
