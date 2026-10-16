/**
 * Line layer: points, line and area per series, drawn like 1.x
 * `LineChart` (element order, classes and `ct:` attributes).
 */
import { getMetaData } from '../core/data/data';
import { alphaNumerate } from '../core/lang';
import { serialize } from '../core/data/serialize';
import type { NormalizedSeries, Series, SeriesObject } from '../core/types';
import type { LineInterpolation } from '../charts/LineChart/LineChart.types';
import type { Layer, PreparedSeries } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import { isNumeric, safeHasProperty } from '../utils/utils';
import { centerShift, interpolationOf, seriesPath } from './path';

/**
 * The line options you can set per series: in the `overrides` of
 * {@link line}, or the `series` option of `lineChart`.
 */
export interface LineSeriesOptions {
  /**
   * How a line runs between its points: `true` smooths it with
   * `Interpolation.monotoneCubic`, `false` draws straight segments
   * (`Interpolation.none`), or pass an interpolation such as
   * `Interpolation.cardinal()`, `Interpolation.step()` or your own.
   */
  readonly lineSmooth?: boolean | LineInterpolation;
  /** Draws a point at each value. */
  readonly showPoint?: boolean;
  /** Draws the lines. */
  readonly showLine?: boolean;
  /** Fills the area between each line and `areaBase`. */
  readonly showArea?: boolean;
  /**
   * The value the areas close at, usually 0. It's kept within the Y axis
   * range.
   */
  readonly areaBase?: number;
}

/**
 * The options of the {@link line} layer. Without them, it draws every
 * series as a smooth line with points and no area, on the first X and Y
 * axis.
 * @experimental
 */
export interface LineLayerOptions extends LineSeriesOptions {
  /** Series to draw, by index or name; default: all series. */
  readonly series?: readonly (number | string)[];
  /** The id of the X axis to draw on; default: the first X axis. */
  readonly x?: string;
  /** The id of the Y axis to draw on; default: the first Y axis. */
  readonly y?: string;
  /**
   * Point position on a step axis: `start` of each step (1.x) or its
   * `center`, where bars are centered.
   */
  readonly align?: 'start' | 'center';
  /** Option overrides per series name (the 1.x `series` option). */
  readonly overrides?: Readonly<Record<string, LineSeriesOptions>>;
  /**
   * Draws the series in reverse order (1.x `reverseData`). Can't be
   * combined with `series`.
   */
  readonly reverseData?: boolean;
  /**
   * Replaces the classes of what the layer draws: `series` (`ct-series`),
   * `line` (`ct-line`), `point` (`ct-point`) and `area` (`ct-area`).
   */
  readonly classNames?: {
    readonly series?: string;
    readonly line?: string;
    readonly point?: string;
    readonly area?: string;
  };
}

const DEFAULTS = {
  lineSmooth: true,
  showPoint: true,
  showLine: true,
  showArea: false,
  areaBase: 0
};

const CLASS_NAMES = {
  series: 'ct-series',
  line: 'ct-line',
  point: 'ct-point',
  area: 'ct-area'
};

/** The raw series as passed in the chart data (1.x reads names and meta from it). */
function rawSeries(series: PreparedSeries): Series | SeriesObject {
  return {
    name: series.name,
    className: series.className,
    meta: series.meta,
    data: series.values
  } as SeriesObject;
}

function seriesOption<K extends keyof LineSeriesOptions>(
  series: Series | SeriesObject,
  options: LineLayerOptions,
  key: K
): NonNullable<LineSeriesOptions[K]> {
  const fallback = (options[key] ?? DEFAULTS[key]) as NonNullable<
    LineSeriesOptions[K]
  >;
  if (
    safeHasProperty(series, 'name') &&
    series.name &&
    options.overrides?.[series.name]
  ) {
    const value = options.overrides[series.name][key];
    return (value === undefined ? fallback : value) as NonNullable<
      LineSeriesOptions[K]
    >;
  }
  return fallback;
}

/**
 * Creates a layer that draws series as lines, with points and optional
 * areas, in the markup of the 1.x line chart (`g.ct-series` with
 * `path.ct-line`, `line.ct-point` and `path.ct-area`). It needs an X and a
 * Y axis, from {@link cartesianAxes}.
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
 * const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
 *
 * chart('#chart', {
 *   data: {
 *     labels: days,
 *     series: [
 *       { name: 'visits', data: [12, 9, 7, 8, 5] },
 *       { name: 'sales', data: [2, 1, 3.5, 7, 3] }
 *     ]
 *   },
 *   axes: cartesianAxes([
 *     { id: 'day', side: 'bottom', type: stepAxis(), ticks: days },
 *     { id: 'count', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [
 *     axisGrid(),
 *     line({ showArea: true, overrides: { sales: { showArea: false } } }),
 *     axisLabels()
 *   ]
 * });
 * ```
 * @experimental
 */
export function line(options: LineLayerOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  return {
    type: 'line',
    coordinates: ['cartesian'],
    axes: { x: options.x, y: options.y },
    series: options.series,
    compose({ data, area, axes, normalized, seriesIndexes }) {
      const { x: axisX, y: axisY } = axes;
      if (!axisX || !axisY || !normalized) {
        throw new Error('Layer "line" needs an x and a y axis');
      }
      if (seriesIndexes && options.reverseData) {
        throw new Error(
          'Layer "line": a series selection can\'t be combined with reverseData'
        );
      }
      // Centered points sit where bars are centered on a step axis.
      const shift = centerShift(axisX, options.align);
      const order = data.series.map((_, i) => i);
      if (options.reverseData) {
        order.reverse();
      }

      return order.map((dataIndex, localIndex) => {
        // The chart-wide index, for classes, keys and contexts.
        const seriesIndex = seriesIndexes?.[dataIndex] ?? localIndex;
        const series = rawSeries(data.series[dataIndex]);
        const values = normalized.series[localIndex] as NormalizedSeries;
        const seriesName = safeHasProperty(series, 'name') && series.name;
        const seriesClassName =
          safeHasProperty(series, 'className') && series.className;
        const seriesMeta = safeHasProperty(series, 'meta')
          ? series.meta
          : undefined;

        const path = seriesPath(
          values,
          { x: axisX, y: axisY },
          area,
          shift,
          interpolationOf(seriesOption(series, options, 'lineSmooth')),
          valueIndex => getMetaData(series, valueIndex)
        );
        const seriesContext = { series, seriesIndex, meta: seriesMeta };

        let children: SceneNode[] = [];

        if (seriesOption(series, options, 'showPoint')) {
          children = path.pathElements.map(pathElement => {
            const { data: pathElementData } = pathElement;
            const value = pathElementData?.value;
            const x = safeHasProperty(value, 'x') ? value.x : undefined;
            const y = safeHasProperty(value, 'y') ? value.y : undefined;
            return node(
              'line',
              {
                x1: pathElement.x,
                y1: pathElement.y,
                x2: pathElement.x + 0.01,
                y2: pathElement.y,
                ...(pathElementData && {
                  'ct:value': [x, y].filter(isNumeric).join(','),
                  'ct:meta': serialize(pathElementData.meta) as
                    | string
                    | undefined
                })
              },
              classNames.point,
              {
                role: 'point',
                ctx: {
                  ...seriesContext,
                  valueIndex: pathElementData?.valueIndex || 0,
                  value,
                  meta: pathElementData?.meta,
                  x: pathElement.x,
                  y: pathElement.y
                }
              }
            );
          });
        }

        if (seriesOption(series, options, 'showLine')) {
          children = [
            node('path', { d: path.stringify() }, classNames.line, {
              role: 'line',
              ctx: { ...seriesContext, values, path: path.clone() }
            }),
            ...children
          ];
        }

        if (seriesOption(series, options, 'showArea') && axisY.range) {
          const areaBase = Math.max(
            Math.min(
              seriesOption(series, options, 'areaBase'),
              axisY.range.max
            ),
            axisY.range.min
          );
          const areaBaseProjected = area.y1 - axisY.project(areaBase);
          path
            .splitByCommand('M')
            .filter(segment => segment.pathElements.length > 1)
            .map(segment => {
              const first = segment.pathElements[0];
              const last =
                segment.pathElements[segment.pathElements.length - 1];
              return segment
                .clone(true)
                .position(0)
                .remove(1)
                .move(first.x, areaBaseProjected)
                .line(first.x, first.y)
                .position(segment.pathElements.length + 1)
                .line(last.x, areaBaseProjected);
            })
            .forEach(areaPath => {
              children = [
                node('path', { d: areaPath.stringify() }, classNames.area, {
                  role: 'area',
                  ctx: { ...seriesContext, values, path: areaPath.clone() }
                }),
                ...children
              ];
            });
        }

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
          { role: 'series', ctx: seriesContext }
        );
        return withFields(group, { children });
      });
    }
  };
}
