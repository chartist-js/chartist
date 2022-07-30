import type {
  ChartRect,
  AxisOptions,
  Bounds,
  NormalizedSeries,
  NormalizedSeriesPrimitiveValue
} from '../core';
import { getBounds, getHighLow, getMultiValue } from '../core';
import { AxisUnits, Axis } from './Axis';

export class AutoScaleAxis extends Axis {
  private readonly bounds: Bounds;
  public override readonly range: {
    min: number;
    max: number;
  };

  constructor(
    axisUnit: AxisUnits,
    data: NormalizedSeries[],
    chartRect: ChartRect,
    options: AxisOptions
  ) {
    // Usually we calculate highLow based on the data but this can be overriden by a highLow object in the options
    const highLow = options.highLow || getHighLow(data, options, axisUnit.pos);
    const bounds = getBounds(
      chartRect[axisUnit.rectEnd] - chartRect[axisUnit.rectStart],
      highLow,
      options.scaleMinSpace || 20,
      options.onlyInteger
    );
    const range = {
      min: bounds.min,
      max: bounds.max
    };

    super(axisUnit, chartRect, bounds.values);

    this.bounds = bounds;
    this.range = range;
  }

  projectValue(value: NormalizedSeriesPrimitiveValue) {
    const finalValue = Number(getMultiValue(value, this.units.pos));

    return (
      (this.axisLength * (finalValue - this.bounds.min)) / this.bounds.range
    );
  }
}
