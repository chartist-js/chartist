import { getBounds } from '../core/data/bounds';
import { getMultiValue } from '../core/data/data';
import { getHighLow } from '../core/data/highLow';
import type { NormalizedSeriesPrimitiveValue, Options } from '../core/types';
import { times } from '../utils/functional';
import { axisLength, type AxisFactory } from './axis';

const valueOf = (value: unknown, dimension: 'x' | 'y') =>
  Number(getMultiValue(value as NormalizedSeriesPrimitiveValue, dimension));

/**
 * Creates a step axis: evenly spaced ticks, one per step, that place
 * values by their index rather than by their value. It's the label axis of
 * line and bar charts. Same rules as 1.x `StepAxis`.
 *
 * Its ticks are the data's `labels`, or the axis's `ticks` when you give
 * them. With `stretch`, the last tick sits at the axis end.
 *
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   cartesianAxes,
 *   chart,
 *   line,
 *   stepAxis
 * } from 'chartist';
 *
 * const months = ['Jan', 'Feb', 'Mar', 'Apr'];
 *
 * chart('#chart', {
 *   data: { labels: months, series: [[4, 6, 5, 9]] },
 *   axes: cartesianAxes([
 *     // The months as ticks; stretch: the first and last at the edges.
 *     { id: 'month', side: 'bottom', type: stepAxis(), stretch: true },
 *     { id: 'value', side: 'left', type: autoScaleAxis() }
 *   ]),
 *   layers: [axisGrid(), line(), axisLabels()]
 * });
 * ```
 */
export function stepAxis(): AxisFactory {
  return {
    kind: 'step',
    create({ dimension, area, labels, options }) {
      const ticks = options.ticks ?? [...labels];
      const length = axisLength(dimension, area);
      const stepLength =
        length / Math.max(1, ticks.length - (options.stretch ? 1 : 0));
      return {
        dimension,
        kind: 'step',
        stretch: Boolean(options.stretch),
        step: stepLength,
        ticks,
        length,
        project: (_value, index = 0) => stepLength * index
      };
    }
  };
}

/**
 * Creates an auto-scaled axis: a scale fitted to the data, with round
 * ticks at least `scaleMinSpace` px apart. Set `low`, `high` or
 * `referenceValue` to widen it, and `onlyInteger` for whole-number steps.
 * Same rules as 1.x `AutoScaleAxis`.
 *
 * It's the value axis of line and bar charts. As an X axis, it places
 * `{ x, y }` values at their real distances.
 *
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   cartesianAxes,
 *   chart,
 *   line
 * } from 'chartist';
 *
 * chart('#chart', {
 *   data: {
 *     series: [
 *       [
 *         { x: 1, y: 2 },
 *         { x: 2.5, y: 5 },
 *         { x: 7, y: 3 },
 *         { x: 10, y: 8 }
 *       ]
 *     ]
 *   },
 *   axes: cartesianAxes([
 *     { id: 'x', side: 'bottom', type: autoScaleAxis(), onlyInteger: true },
 *     { id: 'y', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [axisGrid(), line(), axisLabels()]
 * });
 * ```
 */
export function autoScaleAxis(): AxisFactory {
  return {
    kind: 'autoScale',
    create({ dimension, series, area, options, extent }) {
      const length = axisLength(dimension, area);
      const highLow =
        options.highLow ||
        getHighLow(series, options as Options, dimension, extent);
      const bounds = getBounds(
        length,
        highLow,
        options.scaleMinSpace || 20,
        options.onlyInteger
      );
      return {
        dimension,
        kind: 'autoScale',
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
 * Creates a fixed-scale axis: a scale from `low` to `high` (by default the
 * smallest and largest value) with the `ticks` you give. Without `ticks`,
 * `divisor` splits the range into equal parts with a tick at each end, so
 * `divisor: 4` makes 5 ticks from `low` to `high` (1.x left out the one
 * at `high`).
 *
 * @example
 * ```ts
 * import {
 *   axisGrid,
 *   axisLabels,
 *   cartesianAxes,
 *   chart,
 *   fixedScaleAxis,
 *   line,
 *   stepAxis
 * } from 'chartist';
 *
 * const teams = ['Red', 'Blue', 'Green'];
 *
 * chart('#chart', {
 *   data: { labels: teams, series: [[64, 81, 47]] },
 *   axes: cartesianAxes([
 *     { id: 'team', side: 'bottom', type: stepAxis(), ticks: teams },
 *     // A percentage scale with three grid lines.
 *     {
 *       id: 'percent',
 *       side: 'left',
 *       type: fixedScaleAxis(),
 *       ticks: [0, 50, 100],
 *       low: 0,
 *       high: 100
 *     }
 *   ]),
 *   layers: [axisGrid(), line({ showLine: false }), axisLabels()]
 * });
 * ```
 */
export function fixedScaleAxis(): AxisFactory {
  return {
    kind: 'fixedScale',
    create({ dimension, series, area, options, extent }) {
      const length = axisLength(dimension, area);
      const highLow =
        options.highLow ||
        getHighLow(series, options as Options, dimension, extent);
      const divisor = options.divisor || 1;
      // `divisor` parts have `divisor + 1` ends, `high` included (#1022).
      const ticks = (
        options.ticks ||
        times(
          divisor + 1,
          index =>
            highLow.low + ((highLow.high - highLow.low) / divisor) * index
        )
      ).sort((a, b) => Number(a) - Number(b));
      const range = { min: highLow.low, max: highLow.high };
      return {
        dimension,
        kind: 'fixedScale',
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
