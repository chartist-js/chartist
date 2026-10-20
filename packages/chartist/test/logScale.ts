/**
 * A minimal base 10 log axis for the core's tests of minor ticks and axis
 * transforms: the range is `low` to `high`, or 1 to 1,000.
 */
import { getMultiValue } from '../src/core/data/data';
import type { NormalizedSeriesPrimitiveValue } from '../src/core/types';
import type { AxisFactory, AxisTransform } from '../src/scales/axis';
import { axisLength } from '../src/scales/axis';

export const log10: AxisTransform = {
  forward: value => Math.log10(value),
  inverse: value => 10 ** value
};

export function logScale(minorTicks?: readonly number[]): AxisFactory {
  return {
    kind: 'log',
    transform: log10,
    create({ dimension, area, options }) {
      const min = options.low ?? 1;
      const max = options.high ?? 1000;
      const length = axisLength(dimension, area);
      const span = Math.log10(max / min);
      return {
        dimension,
        kind: 'log',
        transform: log10,
        ticks:
          options.ticks ?? [1, 10, 100, 1000].filter(t => t >= min && t <= max),
        ...(minorTicks && { minorTicks }),
        range: { min, max },
        length,
        project: value => {
          const v = Number(
            getMultiValue(value as NormalizedSeriesPrimitiveValue, dimension)
          );
          return v > 0 ? (length * Math.log10(v / min)) / span : 0;
        }
      };
    }
  };
}
