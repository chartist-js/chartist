import type {
  ChartRect,
  AxisOptions,
  NormalizedSeries,
  NormalizedSeriesPrimitiveValue
} from '../core';
import { getMultiValue, getHighLow } from '../core/data';
import { times } from '../utils';
import { AxisUnits, Axis } from './Axis';

/** The 1.x axis with fixed ticks: the `ticks` option, or `divisor` equal steps from low to high, with a tick at both ends. */
export class FixedScaleAxis extends Axis {
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
    const highLow = options.highLow || getHighLow(data, options, axisUnit.pos);
    const divisor = options.divisor || 1;
    // `divisor` parts have `divisor + 1` ends, `high` included (#1022).
    const ticks = (
      options.ticks ||
      times(
        divisor + 1,
        index => highLow.low + ((highLow.high - highLow.low) / divisor) * index
      )
    ).sort((a, b) => Number(a) - Number(b));
    const range = {
      min: highLow.low,
      max: highLow.high
    };

    super(axisUnit, chartRect, ticks);

    this.range = range;
  }

  projectValue(value: NormalizedSeriesPrimitiveValue) {
    const finalValue = Number(getMultiValue(value, this.units.pos));

    return (
      (this.axisLength * (finalValue - this.range.min)) /
      (this.range.max - this.range.min)
    );
  }
}
