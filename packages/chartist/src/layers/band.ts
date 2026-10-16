/**
 * Band layer: fills the area between a low and a high edge, each a
 * constant, values of its own or a series, or between the minimum and
 * maximum of a group of series.
 */
import type { NormalizedSeries, NormalizedSeriesValue } from '../core/types';
import type { LineInterpolation } from '../charts/LineChart/LineChart.types';
import type { Layer, LayerContext } from '../pipeline/types';
import { node, withFields } from '../scene/node';
import type { BandEdge } from '../scene/roles';
import { SvgPath } from '../svg/SvgPath';
import { isNumeric } from '../utils/utils';
import { centerShift, interpolationOf, reversePath, seriesPath } from './path';

/**
 * A value of a {@link band} edge given as values: a number, `{ x, y }`
 * on a scale X axis, or `null` for a hole.
 */
export type BandEdgeValue =
  | number
  | { readonly x: number; readonly y: number }
  | null
  | undefined;

/**
 * An edge of a {@link band}: a constant value, values of its own (one per
 * label, like a series that isn't in the data), a series by name, or a
 * series by index or name as `{ series }`.
 */
export type BandEdgeOption =
  | number
  | readonly BandEdgeValue[]
  | string
  | { readonly series: number | string };

/**
 * The options of the {@link band} layer: `low` and `high` edges, or a
 * `series` group.
 */
export interface BandOptions {
  /** The low edge: a constant value, values or a series. */
  readonly low?: BandEdgeOption;
  /** The high edge: a constant value, values or a series. */
  readonly high?: BandEdgeOption;
  /**
   * A group of series, by index or name: the band covers their minimum to
   * their maximum at each value index. Can't be combined with `low` and
   * `high`.
   */
  readonly series?: readonly (number | string)[];
  /** The id of the X axis to draw on; default: the first X axis. */
  readonly x?: string;
  /** The id of the Y axis to draw on; default: the first Y axis. */
  readonly y?: string;
  /**
   * How the edges run between values, as `lineSmooth` of the line layer:
   * `true` smooths them with `Interpolation.monotoneCubic`, `false` draws
   * straight segments, or pass an interpolation.
   */
  readonly lineSmooth?: boolean | LineInterpolation;
  /**
   * Edge position on a step axis: `start` of each step (1.x) or its
   * `center`, where bars are centered.
   */
  readonly align?: 'start' | 'center';
  /** A class added to the band's group, such as `ct-series-c` for a color. */
  readonly className?: string;
  /**
   * Gives the points and bars of every layer `ct-in-band` when their value
   * at their value index lies between the band's edges (edges included),
   * else `ct-out-band`. The value is `y`, or `x` when a value has no `y`
   * (the bars of a horizontal bar chart). Nodes at an index where the band
   * has a hole are left alone.
   */
  readonly mark?: boolean;
  /**
   * Replaces the classes of what the layer draws and marks: `band`
   * (`ct-band`), `area` (`ct-band-area`), `inBand` (`ct-in-band`) and
   * `outBand` (`ct-out-band`).
   */
  readonly classNames?: {
    readonly band?: string;
    readonly area?: string;
    readonly inBand?: string;
    readonly outBand?: string;
  };
}

const CLASS_NAMES = {
  band: 'ct-band',
  area: 'ct-band-area',
  inBand: 'ct-in-band',
  outBand: 'ct-out-band'
};

/** The band's edges at one value index, and the X of its values. */
interface EdgesAt {
  readonly x?: number;
  readonly low: number;
  readonly high: number;
}

/** The band's edges per value index, worked out from a layer context. */
interface Edges {
  /** Both edges are constants: no series, no holes. */
  readonly constant: boolean;
  /** The number of value indexes the series edges have. */
  readonly length: number;
  /** The edges at a value index, or `undefined` for a hole. */
  at(valueIndex: number): EdgesAt | undefined;
}

/** The series an edge follows, if it's a series. */
function selectorOf(edge: BandEdgeOption): number | string | undefined {
  return typeof edge === 'number' || isValues(edge)
    ? undefined
    : typeof edge === 'string'
      ? edge
      : edge.series;
}

function isValues(edge: BandEdgeOption): edge is readonly BandEdgeValue[] {
  return Array.isArray(edge);
}

/** An edge's own values, normalized like a series' values. */
function normalizedValues(values: readonly BandEdgeValue[]): NormalizedSeries {
  return values.map(value =>
    isNumeric(value)
      ? ({ y: Number(value) } as NormalizedSeriesValue)
      : value && typeof value === 'object'
        ? (value as NormalizedSeriesValue)
        : undefined
  );
}

/** The value of a normalized value along Y, or `undefined` for a hole. */
function yOf(value: NormalizedSeriesValue): number | undefined {
  const y =
    value !== null && typeof value === 'object'
      ? (value as { y?: unknown }).y
      : value;
  return isNumeric(y) ? Number(y) : undefined;
}

function xOf(value: NormalizedSeriesValue): number | undefined {
  return value !== null && typeof value === 'object'
    ? (value as { x?: number }).x
    : undefined;
}

/**
 * The position of a series in the layer's data: the layer gets only the
 * series it selects, with their chart-wide indexes in `seriesIndexes`.
 */
function localIndex(selector: number | string, context: LayerContext) {
  const { data, seriesIndexes } = context;
  if (typeof selector === 'string') {
    return data.series.findIndex(series => series.name === selector);
  }
  return seriesIndexes ? seriesIndexes.indexOf(selector) : selector;
}

function chartIndex(selector: number | string, context: LayerContext) {
  const index = localIndex(selector, context);
  return context.seriesIndexes?.[index] ?? index;
}

/**
 * Works out the band's edges from the data in the context.
 * @param constant Changes a constant edge before it's used, e.g. to keep it
 * within the axis range for drawing.
 */
function bandEdges(
  options: BandOptions,
  context: LayerContext,
  constant: (value: number) => number = value => value
): Edges {
  const all = context.normalized?.series ?? [];
  const seriesOf = (selector: number | string): NormalizedSeries =>
    all[localIndex(selector, context)] ?? [];

  if (options.series) {
    const group = options.series.map(seriesOf);
    return {
      constant: false,
      length: Math.max(0, ...group.map(values => values.length)),
      at(valueIndex) {
        const defined = group
          .map(values => values[valueIndex])
          .filter(value => yOf(value) !== undefined);
        if (defined.length === 0) {
          return undefined;
        }
        const ys = defined.map(value => yOf(value) as number);
        return {
          x: xOf(defined[0]),
          low: Math.min(...ys),
          high: Math.max(...ys)
        };
      }
    };
  }

  const edge = (
    option: BandEdgeOption | undefined
  ): { readonly value: number } | { readonly values: NormalizedSeries } => {
    if (option !== undefined && isValues(option)) {
      return { values: normalizedValues(option) };
    }
    const selector = option === undefined ? undefined : selectorOf(option);
    return selector === undefined
      ? { value: constant(option as number) }
      : { values: seriesOf(selector) };
  };
  const low = edge(options.low);
  const high = edge(options.high);
  const lengths = [low, high].flatMap(e =>
    'values' in e ? [e.values.length] : []
  );
  return {
    constant: lengths.length === 0,
    length: Math.max(0, ...lengths),
    at(valueIndex) {
      const lowValue = 'values' in low ? low.values[valueIndex] : undefined;
      const highValue = 'values' in high ? high.values[valueIndex] : undefined;
      const lowY = 'value' in low ? low.value : yOf(lowValue);
      const highY = 'value' in high ? high.value : yOf(highValue);
      if (lowY === undefined || highY === undefined) {
        return undefined;
      }
      // A constant edge takes the X of the series edge's value.
      return {
        x: xOf(lowValue) ?? xOf(highValue),
        low: lowY,
        high: highY
      };
    }
  };
}

/** The value a mark compares with the band: `y`, else `x`. */
function markValue(value: NormalizedSeriesValue): number | undefined {
  if (value !== null && typeof value === 'object') {
    const { x, y } = value as { x?: unknown; y?: unknown };
    return isNumeric(y) ? Number(y) : isNumeric(x) ? Number(x) : undefined;
  }
  return isNumeric(value) ? Number(value) : undefined;
}

function edgeContext(
  option: BandEdgeOption | undefined,
  context: LayerContext
): BandEdge | undefined {
  if (option === undefined) {
    return undefined;
  }
  if (isValues(option)) {
    return { values: normalizedValues(option).map(yOf) };
  }
  const selector = selectorOf(option);
  return selector === undefined
    ? { value: option as number }
    : { seriesIndex: chartIndex(selector, context) };
}

/**
 * Creates a layer that fills the area between a low and a high edge
 * (`g.ct-band` with a `path.ct-band-area` per piece; the band breaks at
 * holes). Each edge is a constant value, values of its own (one per
 * label) or a series, or `series` names a group and the band covers their
 * minimum to their maximum at each value index. Constants and own values
 * widen the Y axis to include them. List the band
 * before the series layers to draw it behind them. It needs an X and a Y
 * axis, from {@link cartesianAxes}.
 *
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   band,
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
 *     series: [{ name: 'visits', data: [12, 9, 7, 8, 5] }]
 *   },
 *   axes: cartesianAxes([
 *     { id: 'day', side: 'bottom', type: stepAxis(), ticks: days },
 *     { id: 'count', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [
 *     axisGrid(),
 *     band({ low: 6, high: 10, mark: true }),
 *     line(),
 *     axisLabels()
 *   ]
 * });
 * ```
 */
export function band(options: BandOptions): Layer {
  const hasEdges = options.low !== undefined || options.high !== undefined;
  if (options.series && hasEdges) {
    throw new Error(
      'Layer "band": series can\'t be combined with low and high'
    );
  }
  if (
    !options.series &&
    (options.low === undefined || options.high === undefined)
  ) {
    throw new Error('Layer "band": the band needs low and high, or series');
  }
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  const edgeSelectors = options.series
    ? undefined
    : [options.low, options.high].flatMap(edge => {
        const selector = edge === undefined ? undefined : selectorOf(edge);
        return selector === undefined ? [] : [selector];
      });
  // Constants and an edge's own values aren't in the data, so the band
  // reports them for its Y axis.
  const ownValues = options.series
    ? []
    : [options.low, options.high].flatMap(edge =>
        typeof edge === 'number'
          ? [edge]
          : edge !== undefined && isValues(edge)
            ? normalizedValues(edge).flatMap(value => {
                const y = yOf(value);
                return y === undefined ? [] : [y];
              })
            : []
      );

  const layer: Layer = {
    type: 'band',
    coordinates: ['cartesian'],
    axes: { x: options.x, y: options.y },
    // The series the band draws from count towards its axes' range.
    series: options.series ?? edgeSelectors,
    extent({ axes }) {
      return axes.y !== undefined && ownValues.length > 0
        ? {
            [axes.y]: {
              low: Math.min(...ownValues),
              high: Math.max(...ownValues)
            }
          }
        : {};
    },
    compose(context) {
      const { area, axes } = context;
      const { x: axisX, y: axisY } = axes;
      if (!axisX || !axisY || !context.normalized) {
        throw new Error('Layer "band" needs an x and a y axis');
      }
      const range = axisY.range;
      // A constant edge outside the axis range is drawn at its end.
      const clamp = (value: number) =>
        range ? Math.min(Math.max(value, range.min), range.max) : value;
      const edges = bandEdges(options, context, clamp);

      let pieces: SvgPath[];
      const interpolation = interpolationOf(options.lineSmooth ?? true);
      if (edges.constant) {
        const { low, high } = edges.at(0) as EdgesAt;
        const lowY = area.y1 - axisY.project(low);
        const highY = area.y1 - axisY.project(high);
        pieces = [
          new SvgPath(true)
            .move(area.x1, highY)
            .line(area.x2, highY)
            .line(area.x2, lowY)
            .line(area.x1, lowY)
        ];
      } else {
        // Both edges share their X and their holes, so their pieces match.
        const upper: NormalizedSeries = [];
        const lower: NormalizedSeries = [];
        for (let valueIndex = 0; valueIndex < edges.length; valueIndex++) {
          const at = edges.at(valueIndex);
          upper.push(at && ({ x: at.x, y: at.high } as NormalizedSeriesValue));
          lower.push(at && ({ x: at.x, y: at.low } as NormalizedSeriesValue));
        }
        const shift = centerShift(axisX, options.align);
        const pathOf = (values: NormalizedSeries) =>
          seriesPath(values, { x: axisX, y: axisY }, area, shift, interpolation)
            .splitByCommand('M')
            .filter(piece => piece.pathElements.length > 1);
        const lowerPieces = pathOf(lower);
        pieces = pathOf(upper).flatMap((upperPiece, index) => {
          const lowerPiece = lowerPieces[index];
          if (
            !lowerPiece ||
            lowerPiece.pathElements.length !== upperPiece.pathElements.length
          ) {
            return [];
          }
          // The upper edge forward, then the lower edge back to the start.
          const back = reversePath(lowerPiece);
          const start = back.pathElements[0];
          back.position(0).remove(1).line(start.x, start.y, false, start.data);
          return [SvgPath.join([upperPiece, back], true)];
        });
      }

      const edgesContext = options.series
        ? { series: options.series.map(s => chartIndex(s, context)) }
        : {
            low: edgeContext(options.low, context),
            high: edgeContext(options.high, context)
          };
      const children = pieces.map(path =>
        node('path', { d: path.stringify() }, classNames.area, {
          role: 'band',
          ctx: { ...edgesContext, path: path.clone(), smoothing: interpolation }
        })
      );
      const className = options.className
        ? `${classNames.band} ${options.className}`
        : classNames.band;
      return [withFields(node('g', {}, className), { children })];
    }
  };

  if (!options.mark) {
    return layer;
  }
  return {
    ...layer,
    refine(current, context) {
      if (current.role !== 'point' && current.role !== 'bar') {
        return undefined;
      }
      const value = markValue(current.ctx.value);
      const at = bandEdges(options, context).at(current.ctx.valueIndex);
      if (value === undefined || !at) {
        return undefined;
      }
      const inBand =
        value >= Math.min(at.low, at.high) &&
        value <= Math.max(at.low, at.high);
      return current.addClass(inBand ? classNames.inBand : classNames.outBand);
    }
  };
}
