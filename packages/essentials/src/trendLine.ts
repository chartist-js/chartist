/**
 * Trend line layer: a least-squares straight line through each series'
 * values, drawn in the series' color.
 */
import {
  alphaNumerate,
  getMultiValue,
  isDataHoleValue,
  node,
  type AxisTransform,
  type Layer,
  type NormalizedSeries
} from 'chartist';
import { centerShift } from './centerShift.ts';

/**
 * The options of the {@link trendLine} layer. Without them, it draws a
 * trend line for every series, on the first X and Y axis.
 */
export interface TrendLineOptions {
  /** Series to draw a trend line for, by index or name; default: all series. */
  readonly series?: readonly (number | string)[];
  /** The id of the X axis to draw on; default: the first X axis. */
  readonly x?: string;
  /** The id of the Y axis to draw on; default: the first Y axis. */
  readonly y?: string;
  /**
   * Where the line's ends sit on a step axis: at the `start` of their
   * steps, as the points of `line()`, or at the `center`, where bars
   * are centered.
   */
  readonly align?: 'start' | 'center';
  /**
   * Replaces the classes of what the layer draws: `series` (`ct-series`)
   * and `line` (`ct-trend-line`).
   */
  readonly classNames?: {
    readonly series?: string;
    readonly line?: string;
  };
}

const CLASS_NAMES = {
  series: 'ct-series',
  line: 'ct-trend-line'
};

/**
 * A fitted line `y = slope * x + intercept`, from `x1` to `x2`, in the
 * axes' transformed values when they have transforms.
 */
interface Fit {
  readonly slope: number;
  readonly intercept: number;
  /** Pearson's r of the values; absent when they're all equal. */
  readonly correlation?: number;
  readonly x1: number;
  readonly x2: number;
}

/**
 * Fits a straight line through a series' values by least squares: X is
 * the value's index (`byIndex`, for step axes) or its `x`, and both go
 * through their axis's transform when it has one, so the line is straight
 * on that axis. Holes and values without a finite number for X or Y are
 * skipped. Fewer than two values, or values that all share one X, fit no
 * line.
 */
function fit(
  values: NormalizedSeries,
  byIndex: boolean,
  tx?: AxisTransform,
  ty?: AxisTransform
): Fit | undefined {
  const xs: number[] = [];
  const ys: number[] = [];
  values.forEach((value, index) => {
    let y = isDataHoleValue(value) ? NaN : getMultiValue(value, 'y');
    let x = byIndex ? index : getMultiValue(value, 'x');
    if (typeof x === 'number' && typeof y === 'number') {
      x = tx && !byIndex ? tx.forward(x) : x;
      y = ty ? ty.forward(y) : y;
      if (Number.isFinite(x) && Number.isFinite(y)) {
        xs.push(x);
        ys.push(y);
      }
    }
  });
  if (xs.length < 2) {
    return undefined;
  }
  const mean = (list: number[]) =>
    list.reduce((sum, value) => sum + value, 0) / list.length;
  const meanX = mean(xs);
  const meanY = mean(ys);
  let covariance = 0;
  let variance = 0;
  let varianceY = 0;
  xs.forEach((x, i) => {
    covariance += (x - meanX) * (ys[i] - meanY);
    variance += (x - meanX) ** 2;
    varianceY += (ys[i] - meanY) ** 2;
  });
  if (variance === 0) {
    return undefined;
  }
  const slope = covariance / variance;
  return {
    slope,
    intercept: meanY - slope * meanX,
    // Undefined for values that are all equal (0 / 0): left out.
    ...(varianceY > 0 && {
      correlation: covariance / Math.sqrt(variance * varianceY)
    }),
    x1: Math.min(...xs),
    x2: Math.max(...xs)
  };
}

/** A fitted number as a value on its axis. */
const valueOf = (transform: AxisTransform | undefined, value: number) =>
  transform ? transform.inverse(value) : value;

/** True when every value that isn't a hole has a number for X. */
function hasX(values: NormalizedSeries): boolean {
  const present = values.filter(value => !isDataHoleValue(value));
  return (
    present.length > 0 &&
    present.every(value => typeof getMultiValue(value, 'x') === 'number')
  );
}

/**
 * Creates a layer that draws a trend line for each series: the straight
 * line that fits its values best (least squares), from its smallest to its
 * largest X, as a `line.ct-trend-line` in a series group
 * (`g.ct-series.ct-series-a`), so it takes the series' color. On a step
 * axis X is the value's index, on a scale axis the value's `x`. Holes are
 * skipped, and a series with fewer than two values gets no line. The Y
 * axis widens to include the line's ends. On an axis with a transform,
 * such as a log axis, the line is fitted to the transformed values, so
 * it's straight on that axis: an exponential trend on a log Y axis. Add
 * it next to the `line()` or `bar()` layer that draws the values.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { trendLine } from '@chartist-js/essentials';
 * import 'chartist/styles.css';
 * import '@chartist-js/essentials/styles.css';
 *
 * lineChart(
 *   '#chart',
 *   {
 *     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
 *     series: [{ name: 'sales', data: [620, 810, 740, 930, 880, 1020] }]
 *   },
 *   { layers: { above: [trendLine()] } }
 * );
 * ```
 */
export function trendLine(options: TrendLineOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  return {
    type: 'trendLine',
    coordinates: ['cartesian'],
    axes: { x: options.x, y: options.y },
    series: options.series,
    extent({ normalized, axes, transforms: { x: tx, y: ty } = {} }) {
      if (axes.y === undefined) {
        return {};
      }
      // The axes don't exist yet: values with an `x` are read as on a
      // scale axis, others by index, as a step axis places them.
      const ends = normalized.series.flatMap(values => {
        const fitted = fit(values, !hasX(values), tx, ty);
        return fitted
          ? [fitted.x1, fitted.x2].map(x =>
              valueOf(ty, fitted.slope * x + fitted.intercept)
            )
          : [];
      });
      return ends.length > 0
        ? { [axes.y]: { low: Math.min(...ends), high: Math.max(...ends) } }
        : {};
    },
    compose({ data, area, axes, normalized, seriesIndexes }) {
      const { x: axisX, y: axisY } = axes;
      if (!axisX || !axisY || !normalized) {
        throw new Error('Layer "trendLine" needs an x and a y axis');
      }
      const byIndex = axisX.kind === 'step';
      const shift = centerShift(axisX, options.align);
      const tx = byIndex ? undefined : axisX.transform;
      const ty = axisY.transform;

      return data.series.flatMap((series, localIndex) => {
        const fitted = fit(normalized.series[localIndex], byIndex, tx, ty);
        if (!fitted) {
          return [];
        }
        const seriesIndex = seriesIndexes?.[localIndex] ?? localIndex;
        const { slope, intercept, correlation } = fitted;
        const at = (x: number) => ({
          x: area.x1 + shift + axisX.project(valueOf(tx, x), x),
          y: area.y1 - axisY.project(valueOf(ty, slope * x + intercept))
        });
        const start = at(fitted.x1);
        const end = at(fitted.x2);
        const ends = { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
        const rawSeries = {
          name: series.name,
          className: series.className,
          meta: series.meta,
          data: series.values
        };
        const seriesContext = {
          series: rawSeries,
          seriesIndex,
          meta: series.meta
        };
        const group = node(
          'g',
          {},
          `${classNames.series} ${
            series.className ||
            `${classNames.series}-${alphaNumerate(seriesIndex)}`
          }`,
          { role: 'series', ctx: seriesContext }
        );
        return [
          group.append(
            node('line', ends, classNames.line, {
              role: 'trendLine',
              ctx: {
                seriesIndex,
                slope,
                intercept,
                ...(correlation !== undefined && { correlation }),
                ...ends
              }
            })
          )
        ];
      });
    }
  };
}
