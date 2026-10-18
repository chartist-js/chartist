/**
 * Trend line layer: a least-squares straight line through each series'
 * values, drawn in the series' color.
 */
import { getMultiValue, isDataHoleValue } from '../core/data/data';
import { alphaNumerate } from '../core/lang';
import type { NormalizedSeries } from '../core/types';
import type { Layer } from '../pipeline/types';
import { node, withFields } from '../scene/node';
import { centerShift } from './path';

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
   * steps, as the points of {@link line}, or at the `center`, where bars
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

/** A fitted line `y = slope * x + intercept`, from `x1` to `x2`. */
interface Fit {
  readonly slope: number;
  readonly intercept: number;
  readonly x1: number;
  readonly x2: number;
}

/**
 * Fits a straight line through a series' values by least squares: X is
 * the value's index (`byIndex`, for step axes) or its `x`. Holes and
 * values without a number for X are skipped. Fewer than two values, or
 * values that all share one X, fit no line.
 */
function fit(values: NormalizedSeries, byIndex: boolean): Fit | undefined {
  const xs: number[] = [];
  const ys: number[] = [];
  values.forEach((value, index) => {
    const y = isDataHoleValue(value) ? undefined : getMultiValue(value, 'y');
    const x = byIndex ? index : getMultiValue(value, 'x');
    if (typeof x === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y as number);
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
  xs.forEach((x, i) => {
    covariance += (x - meanX) * (ys[i] - meanY);
    variance += (x - meanX) ** 2;
  });
  if (variance === 0) {
    return undefined;
  }
  const slope = covariance / variance;
  return {
    slope,
    intercept: meanY - slope * meanX,
    x1: Math.min(...xs),
    x2: Math.max(...xs)
  };
}

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
 * axis widens to include the line's ends. Add it next to the {@link line}
 * or {@link bar} layer that draws the values.
 *
 * @example
 * ```ts
 * import { lineChart, trendLine } from 'chartist';
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
    extent({ normalized, axes }) {
      if (axes.y === undefined) {
        return {};
      }
      // The axes don't exist yet: values with an `x` are read as on a
      // scale axis, others by index, as a step axis places them.
      const ends = normalized.series.flatMap(values => {
        const fitted = fit(values, !hasX(values));
        return fitted
          ? [
              fitted.slope * fitted.x1 + fitted.intercept,
              fitted.slope * fitted.x2 + fitted.intercept
            ]
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

      return data.series.flatMap((series, localIndex) => {
        const fitted = fit(normalized.series[localIndex], byIndex);
        if (!fitted) {
          return [];
        }
        const seriesIndex = seriesIndexes?.[localIndex] ?? localIndex;
        const { slope, intercept } = fitted;
        const at = (x: number) => ({
          x: area.x1 + shift + axisX.project(x, x),
          y: area.y1 - axisY.project(slope * x + intercept)
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
          withFields(group, {
            children: [
              node('line', ends, classNames.line, {
                role: 'trendLine',
                ctx: { seriesIndex, slope, intercept, ...ends }
              })
            ]
          })
        ];
      });
    }
  };
}
