/**
 * Line layer: points, line and area per series, drawn like 1.x
 * `LineChart` (element order, classes and `ct:` attributes).
 */
import { getMetaData } from '../core/data/data';
import { alphaNumerate } from '../core/lang';
import { serialize } from '../core/data/serialize';
import type {
  NormalizedSeries,
  SegmentData,
  Series,
  SeriesObject
} from '../core/types';
import { monotoneCubic } from '../interpolation/monotoneCubic';
import { none } from '../interpolation/none';
import type { LineInterpolation } from '../charts/LineChart/LineChart.types';
import type { Layer, PreparedSeries } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import { isNumeric, safeHasProperty } from '../utils/utils';

/** Options that can be overridden per series (by series name). */
export interface LineSeriesOptions {
  readonly lineSmooth?: boolean | LineInterpolation;
  readonly showPoint?: boolean;
  readonly showLine?: boolean;
  readonly showArea?: boolean;
  readonly areaBase?: number;
}

/** @experimental */
export interface LineLayerOptions extends LineSeriesOptions {
  /** Overrides per series name, as in 1.x. */
  readonly series?: Readonly<Record<string, LineSeriesOptions>>;
  /** Iterate the series in reverse (1.x `reverseData`). */
  readonly reverseData?: boolean;
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
    options.series?.[series.name]
  ) {
    const value = options.series[series.name][key];
    return (value === undefined ? fallback : value) as NonNullable<
      LineSeriesOptions[K]
    >;
  }
  return fallback;
}

/**
 * Draws series as lines with points and optional areas. Needs an x and a
 * y axis.
 * @experimental
 */
export function line(options: LineLayerOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  return {
    type: 'line',
    coordinates: ['cartesian'],
    compose({ data, area, axes, normalized }) {
      const { x: axisX, y: axisY } = axes;
      if (!axisX || !axisY || !normalized) {
        throw new Error('Layer "line" needs an x and a y axis');
      }
      const order = data.series.map((_, i) => i);
      if (options.reverseData) {
        order.reverse();
      }

      return order.map((dataIndex, seriesIndex) => {
        const series = rawSeries(data.series[dataIndex]);
        const values = normalized.series[seriesIndex] as NormalizedSeries;
        const seriesName = safeHasProperty(series, 'name') && series.name;
        const seriesClassName =
          safeHasProperty(series, 'className') && series.className;
        const seriesMeta = safeHasProperty(series, 'meta')
          ? series.meta
          : undefined;

        const pathCoordinates: number[] = [];
        const pathData: SegmentData[] = [];
        values.forEach((value, valueIndex) => {
          pathCoordinates.push(
            area.x1 + axisX.project(value, valueIndex, values),
            area.y1 - axisY.project(value, valueIndex, values)
          );
          pathData.push({
            value,
            valueIndex,
            meta: getMetaData(series, valueIndex)
          });
        });

        const lineSmooth = seriesOption(series, options, 'lineSmooth');
        const smoothing =
          typeof lineSmooth === 'function'
            ? lineSmooth
            : lineSmooth
              ? monotoneCubic()
              : none();
        const path = smoothing(pathCoordinates, pathData);
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
