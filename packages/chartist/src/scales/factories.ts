import { getBounds } from '../core/data/bounds';
import { getMultiValue } from '../core/data/data';
import { getHighLow } from '../core/data/highLow';
import type { NormalizedSeriesPrimitiveValue, Options } from '../core/types';
import { times } from '../utils/functional';
import { axisLength, type AxisFactory } from './axis';

const valueOf = (value: unknown, dimension: 'x' | 'y') =>
  Number(getMultiValue(value as NormalizedSeriesPrimitiveValue, dimension));

/**
 * Evenly spaced ticks (labels), one per step. With `stretch`, the last
 * tick sits at the axis end. Same rules as 1.x `StepAxis`.
 * @experimental
 */
export function stepAxis(): AxisFactory {
  return {
    kind: 'step',
    create({ dimension, area, options }) {
      const ticks = options.ticks || [];
      const length = axisLength(dimension, area);
      const stepLength =
        length / Math.max(1, ticks.length - (options.stretch ? 1 : 0));
      return {
        dimension,
        ticks,
        length,
        project: (_value, index = 0) => stepLength * index
      };
    }
  };
}

/**
 * A scale computed from the data: nice bounds, `scaleMinSpace` between
 * ticks, `onlyInteger`, `low`/`high`. Same rules as 1.x `AutoScaleAxis`.
 * @experimental
 */
export function autoScaleAxis(): AxisFactory {
  return {
    kind: 'autoScale',
    create({ dimension, series, area, options }) {
      const length = axisLength(dimension, area);
      const highLow =
        options.highLow || getHighLow(series, options as Options, dimension);
      const bounds = getBounds(
        length,
        highLow,
        options.scaleMinSpace || 20,
        options.onlyInteger
      );
      return {
        dimension,
        ticks: bounds.values,
        range: { min: bounds.min, max: bounds.max },
        length,
        project: value =>
          (length * (valueOf(value, dimension) - bounds.min)) / bounds.range
      };
    }
  };
}

/**
 * A scale with explicit `ticks`, or `divisor` evenly spaced ticks between
 * low and high. Same rules as 1.x `FixedScaleAxis`.
 * @experimental
 */
export function fixedScaleAxis(): AxisFactory {
  return {
    kind: 'fixedScale',
    create({ dimension, series, area, options }) {
      const length = axisLength(dimension, area);
      const highLow =
        options.highLow || getHighLow(series, options as Options, dimension);
      const divisor = options.divisor || 1;
      const ticks = (
        options.ticks ||
        times(
          divisor,
          index =>
            highLow.low + ((highLow.high - highLow.low) / divisor) * index
        )
      ).sort((a, b) => Number(a) - Number(b));
      const range = { min: highLow.low, max: highLow.high };
      return {
        dimension,
        ticks,
        range,
        length,
        project: value =>
          (length * (valueOf(value, dimension) - range.min)) /
          (range.max - range.min)
      };
    }
  };
}
