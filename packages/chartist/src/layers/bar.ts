/**
 * Bar layer: bars per series, drawn like 1.x `BarChart` (geometry, stacking,
 * classes and `ct:` attributes).
 */
import { getMetaData } from '../core/data/data';
import { serialize } from '../core/data/serialize';
import { alphaNumerate } from '../core/lang';
import type { NormalizedSeries, Series, SeriesObject } from '../core/types';
import type { Layer, PreparedSeries } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import { serialMap } from '../utils/functional';
import { isNumeric, safeHasProperty } from '../utils/utils';

/** @experimental */
export interface BarLayerOptions {
  /** Series to draw, by index or name; default: all series. */
  readonly series?: readonly (number | string)[];
  /** Axis ids to draw on; default: the first X and the first Y axis. */
  readonly x?: string;
  readonly y?: string;
  /** Values on the X axis, labels on the Y axis. */
  readonly horizontalBars?: boolean;
  readonly stackBars?: boolean;
  /** `accumulate` (default), `accumulate-relative`, or `overlap` (or `true`). */
  readonly stackMode?:
    | 'accumulate'
    | 'accumulate-relative'
    | 'overlap'
    | boolean;
  /** Distance between the bars of different series, in px. */
  readonly seriesBarDistance?: number;
  /** One series per value of a flat series (1.x `distributeSeries`). */
  readonly distributeSeries?: boolean;
  readonly reverseData?: boolean;
  readonly classNames?: { readonly series?: string; readonly bar?: string };
}

/** Sums of the values per index across all series (for stacked bounds). */
export function getSerialSums(series: NormalizedSeries[]) {
  return serialMap(series, (...args) =>
    Array.from(args).reduce<{ x: number; y: number }>(
      (prev, curr) => ({
        x: prev.x + (safeHasProperty(curr, 'x') ? (curr.x as number) : 0),
        y: prev.y + (safeHasProperty(curr, 'y') ? (curr.y as number) : 0)
      }),
      { x: 0, y: 0 }
    )
  );
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
 * Draws series as bars. The label axis is X (Y with `horizontalBars`), the
 * value axis the other one.
 * @experimental
 */
export function bar(options: BarLayerOptions = {}): Layer {
  const classNames = {
    series: 'ct-series',
    bar: 'ct-bar',
    ...options.classNames
  };
  const horizontal = Boolean(options.horizontalBars);
  const seriesBarDistance = options.seriesBarDistance ?? 15;
  const stackMode = options.stackMode ?? 'accumulate';
  return {
    type: 'bar',
    coordinates: ['cartesian'],
    axes: { x: options.x, y: options.y },
    series: options.series,
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

          if (isAccumulateRelative) {
            stack =
              Number(valueY) >= 0 || Number(valueX) >= 0 ? posStack : negStack;
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
