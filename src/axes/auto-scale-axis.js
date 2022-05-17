import { getBounds, getHighLow, getMultiValue } from '../core/data';
import { Axis } from './axis';

export class AutoScaleAxis extends Axis {
  constructor(axisUnit, data, chartRect, options) {
    super();
    // Usually we calculate highLow based on the data but this can be overriden by a highLow object in the options
    const highLow = options.highLow || getHighLow(data, options, axisUnit.pos);
    this.bounds = getBounds(
      chartRect[axisUnit.rectEnd] - chartRect[axisUnit.rectStart],
      highLow,
      options.scaleMinSpace || 20,
      options.onlyInteger
    );
    this.range = {
      min: this.bounds.min,
      max: this.bounds.max
    };

    super.initialize(axisUnit, chartRect, this.bounds.values, options);
  }

  projectValue(value) {
    return (
      (this.axisLength *
        (+getMultiValue(value, this.units.pos) - this.bounds.min)) /
      this.bounds.range
    );
  }
}
