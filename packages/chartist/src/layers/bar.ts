/**
 * Bar layer: bars per series, drawn like 1.x `BarChart` (geometry, stacking,
 * classes and `ct:` attributes).
 */
import { getMetaData } from '../core/data/data';
import { serialize } from '../core/data/serialize';
import { alphaNumerate } from '../core/lang';
import type { NormalizedSeries, Series, SeriesObject } from '../core/types';
import type { Layer, PreparedSeries } from '../pipeline/types';
import type { AxisExtent } from '../scales/axis';
import { node, withFields, type SceneNode } from '../scene/node';
import { isNumeric, safeHasProperty } from '../utils/utils';

/**
 * The options of the {@link bar} layer. Without them, it draws the bars of
 * each label side by side, 15 px apart, on the first X and Y axis.
 */
export interface BarLayerOptions {
  /** Series to draw, by index or name; default: all series. */
  readonly series?: readonly (number | string)[];
  /** The id of the X axis to draw on; default: the first X axis. */
  readonly x?: string;
  /** The id of the Y axis to draw on; default: the first Y axis. */
  readonly y?: string;
  /** Values on the X axis, labels on the Y axis. */
  readonly horizontalBars?: boolean;
  /**
   * Stacks the bars of a label on each other; `stackMode` says how. The
   * value axis grows to fit the stacks (see {@link Layer.extent}).
   */
  readonly stackBars?: boolean;
  /**
   * How stacked bars stack: `accumulate` (default) adds each value to the
   * ones before, `accumulate-relative` stacks positive values up and
   * negative values down from zero, and `overlap` (or `true`) draws every
   * bar from zero, on top of each other.
   */
  readonly stackMode?:
    | 'accumulate'
    | 'accumulate-relative'
    | 'overlap'
    | boolean;
  /** Distance between the bars of different series, in px. */
  readonly seriesBarDistance?: number;
  /**
   * Moves all bars of the layer along the label axis, in px: to the right
   * for vertical bars, down for horizontal bars (negative values move them
   * the other way). Two stacked bar layers with opposite offsets draw
   * grouped stacks.
   */
  readonly offset?: number;
  /** One series per value of a flat series (1.x `distributeSeries`). */
  readonly distributeSeries?: boolean;
  /**
   * Draws the series in reverse order (1.x `reverseData`). Can't be
   * combined with `series`.
   */
  readonly reverseData?: boolean;
  /**
   * Replaces the classes of what the layer draws: `series` (`ct-series`)
   * and `bar` (`ct-bar`).
   */
  readonly classNames?: { readonly series?: string; readonly bar?: string };
}

/** A value along one dimension; holes and missing values count as 0. */
function valueAlong(value: unknown, dimension: 'x' | 'y') {
  const raw =
    value !== null && typeof value === 'object'
      ? (value as Record<string, unknown>)[dimension]
      : value;
  return isNumeric(raw) ? Number(raw) : 0;
}

/**
 * The range stacked bars reach on the value axis: per index, the running
 * sums of the values in series order (`accumulate`), or of the positive
 * and the negative values apart (`accumulate-relative`). Undefined
 * without values.
 */
export function stackedExtent(
  series: readonly NormalizedSeries[],
  dimension: 'x' | 'y',
  relative = false
): AxisExtent | undefined {
  const positive: number[] = [];
  const negative: number[] = [];
  let low = Infinity;
  let high = -Infinity;
  for (const values of series) {
    values.forEach((value, index) => {
      const amount = valueAlong(value, dimension);
      const sums = relative && amount < 0 ? negative : positive;
      sums[index] = (sums[index] ?? 0) + amount;
      low = Math.min(low, sums[index]);
      high = Math.max(high, sums[index]);
    });
  }
  return low <= high ? { low, high } : undefined;
}

function rawSeries(series: PreparedSeries): Series | SeriesObject {
  return {
    name: series.name,
    className: series.className,
    meta: series.meta,
    data: series.values
  } as SeriesObject;
}

/**
 * Creates a layer that draws series as bars, in the markup of the 1.x bar
 * chart (`g.ct-series` with a `line.ct-bar` per value). The label axis is
 * X (Y with `horizontalBars`), the value axis the other one; both come
 * from {@link cartesianAxes}.
 *
 * Bars grow from zero on the value axis, so keep zero on it: `low: 0`, or
 * `referenceValue: 0`. On a step axis they sit in the middle of each step.
 *
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   bar,
 *   cartesianAxes,
 *   chart,
 *   stepAxis
 * } from 'chartist';
 *
 * const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
 *
 * chart('#chart', {
 *   data: {
 *     labels: quarters,
 *     series: [
 *       [800, 1200, 1400, 1300],
 *       [200, 400, 500, 300]
 *     ]
 *   },
 *   axes: cartesianAxes([
 *     { id: 'quarter', side: 'bottom', type: stepAxis(), ticks: quarters },
 *     { id: 'sales', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [axisGrid(), bar({ seriesBarDistance: 12 }), axisLabels()],
 *   className: 'ct-chart-bar'
 * });
 * ```
 */
export function bar(options: BarLayerOptions = {}): Layer {
  const classNames = {
    series: 'ct-series',
    bar: 'ct-bar',
    ...options.classNames
  };
  const horizontal = Boolean(options.horizontalBars);
  const seriesBarDistance = options.seriesBarDistance ?? 15;
  const offset = options.offset ?? 0;
  const stackMode = options.stackMode ?? 'accumulate';
  // `overlap` and `true` draw every bar from zero: the values fit them.
  const stacks =
    options.stackBars && stackMode !== 'overlap' && stackMode !== true;
  return {
    type: 'bar',
    coordinates: ['cartesian'],
    axes: { x: options.x, y: options.y },
    series: options.series,
    extent({ normalized, axes }) {
      const id = horizontal ? axes.x : axes.y;
      const extent =
        stacks && id !== undefined
          ? stackedExtent(
              normalized.series,
              horizontal ? 'x' : 'y',
              stackMode === 'accumulate-relative'
            )
          : undefined;
      return id !== undefined && extent ? { [id]: extent } : {};
    },
    compose({ data, area, axes, normalized, seriesIndexes }) {
      const valueAxis = horizontal ? axes.x : axes.y;
      const labelAxis = horizontal ? axes.y : axes.x;
      if (!valueAxis || !labelAxis || !normalized) {
        throw new Error('Layer "bar" needs an x and a y axis');
      }
      const labelPos = horizontal ? 'y' : 'x';
      const counterPos = horizontal ? 'x' : 'y';
      const series = normalized.series as NormalizedSeries[];
      // As 1.x: a flat (distributed) series iterates its values as series.
      const raw: unknown[] = data.flat
        ? [...data.series[0].values]
        : data.series.map(rawSeries);
      const order = raw.map((_, i) => i);
      if (options.reverseData) {
        order.reverse();
      }

      const zeroPoint = horizontal
        ? area.x1 + valueAxis.project(0)
        : area.y1 - valueAxis.project(0);
      const isAccumulate = stackMode === 'accumulate';
      const isAccumulateRelative = stackMode === 'accumulate-relative';
      const posStack: number[] = [];
      const negStack: number[] = [];
      let stack = posStack;

      if (seriesIndexes && options.reverseData) {
        throw new Error(
          'Layer "bar": a series selection can\'t be combined with reverseData'
        );
      }

      return order.map((dataIndex, localIndex) => {
        // The chart-wide index, for classes, keys and contexts.
        const seriesIndex = seriesIndexes?.[dataIndex] ?? localIndex;
        const current = raw[dataIndex] as Series | SeriesObject;
        // Bar offsets count within the layer, as 1.x counts within a chart.
        const biPol = localIndex - (raw.length - 1) / 2;
        let periodHalfLength: number;
        if (options.distributeSeries && !options.stackBars) {
          periodHalfLength = labelAxis.length / series.length / 2;
        } else if (options.distributeSeries && options.stackBars) {
          periodHalfLength = labelAxis.length / 2;
        } else {
          periodHalfLength = labelAxis.length / series[localIndex].length / 2;
        }

        const seriesName = safeHasProperty(current, 'name') && current.name;
        const seriesClassName =
          safeHasProperty(current, 'className') && current.className;
        const seriesMeta = safeHasProperty(current, 'meta')
          ? current.meta
          : undefined;
        const bars: SceneNode[] = [];

        series[localIndex].forEach((value, valueIndex) => {
          const valueX = safeHasProperty(value, 'x') && value.x;
          const valueY = safeHasProperty(value, 'y') && value.y;
          const labelIndex =
            options.distributeSeries && !options.stackBars
              ? localIndex
              : options.distributeSeries && options.stackBars
                ? 0
                : valueIndex;
          const values = series[localIndex];
          const projected = horizontal
            ? {
                x: area.x1 + valueAxis.project(valueX || 0, valueIndex, values),
                y: area.y1 - labelAxis.project(valueY || 0, labelIndex, values)
              }
            : {
                x: area.x1 + labelAxis.project(valueX || 0, labelIndex, values),
                y: area.y1 - valueAxis.project(valueY || 0, valueIndex, values)
              };

          if (labelAxis.kind === 'step') {
            if (!labelAxis.stretch) {
              projected[labelPos] += periodHalfLength * (horizontal ? -1 : 1);
            }
            projected[labelPos] +=
              options.stackBars || options.distributeSeries
                ? 0
                : biPol * seriesBarDistance * (horizontal ? -1 : 1);
          }
          projected[labelPos] += offset;

          if (isAccumulateRelative) {
            // By the value along the value axis only: the other one is
            // missing or a position (#1469).
            stack =
              Number(horizontal ? valueX : valueY) < 0 ? negStack : posStack;
          }
          const previousStack = stack[valueIndex] || zeroPoint;
          stack[valueIndex] =
            previousStack - (zeroPoint - projected[counterPos]);

          if (value === undefined) {
            return;
          }

          const positions = {
            [`${labelPos}1`]: projected[labelPos],
            [`${labelPos}2`]: projected[labelPos]
          } as Record<'x1' | 'y1' | 'x2' | 'y2', number>;
          if (
            options.stackBars &&
            (isAccumulate || isAccumulateRelative || !stackMode)
          ) {
            positions[`${counterPos}1`] = previousStack;
            positions[`${counterPos}2`] = stack[valueIndex];
          } else {
            positions[`${counterPos}1`] = zeroPoint;
            positions[`${counterPos}2`] = projected[counterPos];
          }
          positions.x1 = Math.min(Math.max(positions.x1, area.x1), area.x2);
          positions.x2 = Math.min(Math.max(positions.x2, area.x1), area.x2);
          positions.y1 = Math.min(Math.max(positions.y1, area.y2), area.y1);
          positions.y2 = Math.min(Math.max(positions.y2, area.y2), area.y1);

          const meta = getMetaData(current, valueIndex);
          bars.push(
            node(
              'line',
              {
                ...positions,
                'ct:value': [valueX, valueY].filter(isNumeric).join(','),
                'ct:meta': serialize(meta) as string | undefined
              },
              classNames.bar,
              {
                role: 'bar',
                ctx: {
                  series: current,
                  seriesIndex,
                  valueIndex,
                  value,
                  meta,
                  ...positions
                }
              }
            )
          );
        });

        const group = node(
          'g',
          {
            'ct:series-name': seriesName || undefined,
            'ct:meta': seriesMeta
              ? (serialize(seriesMeta) as string)
              : undefined
          },
          `${classNames.series} ${
            seriesClassName ||
            `${classNames.series}-${alphaNumerate(seriesIndex)}`
          }`,
          {
            role: 'series',
            ctx: { series: current, seriesIndex, meta: seriesMeta }
          }
        );
        return withFields(group, { children: bars });
      });
    }
  };
}
