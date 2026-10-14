import { normalizeData } from '../core/data/normalize';
import type { ChartPadding, Data, NormalizedSeries } from '../core/types';
import type {
  Area,
  Layer,
  NormalizedChartData,
  PreparedData
} from '../pipeline/types';
import {
  axisArea,
  definitionsOf,
  directionOf,
  insetsOf,
  type AxesConfig,
  type AxisDefinition,
  type CartesianAxes,
  type LayerBinding,
  type PlacedScaleAxis
} from './axis';
import { isLegacyAxisClass, legacyAxis } from './legacy';

/** Resolves every layer's axis ids and series selection. */
function bindLayers(
  definitions: readonly AxisDefinition[],
  layers: readonly Layer[],
  data: PreparedData
): LayerBinding[] {
  const firstOf = (dimension: 'x' | 'y') =>
    definitions.find(d => directionOf(d.side) === dimension)?.id;
  const ids = new Set(definitions.map(d => d.id));
  return layers.map(layer => {
    for (const id of [layer.axes?.x, layer.axes?.y]) {
      if (id !== undefined && !ids.has(id)) {
        throw new Error(
          `Chartist: unknown axis "${id}" in layer "${layer.type}"`
        );
      }
    }
    const series = layer.series?.map(selector => {
      const index =
        typeof selector === 'number'
          ? selector
          : data.series.findIndex(s => s.name === selector);
      if (index < 0 || index >= data.series.length) {
        throw new Error(
          `Chartist: unknown series ${JSON.stringify(selector)} in layer "${layer.type}"`
        );
      }
      return index;
    });
    return {
      x: layer.axes?.x ?? firstOf('x'),
      y: layer.axes?.y ?? firstOf('y'),
      series
    };
  });
}

/**
 * The series indexes bound to each axis id. Axes no series layer is bound
 * to are missing, so they cover all series.
 */
function boundSeries(
  bindings: readonly LayerBinding[],
  seriesCount: number
): Map<string, number[]> {
  const all = Array.from({ length: seriesCount }, (_, i) => i);
  const bound = new Map<string, Set<number>>();
  for (const binding of bindings) {
    // Layers without series (grids, labels) don't shape axis ranges.
    if (binding.series?.length === 0) {
      continue;
    }
    for (const id of [binding.x, binding.y]) {
      if (id === undefined) {
        continue;
      }
      const set = bound.get(id) ?? new Set<number>();
      (binding.series ?? all).forEach(i => set.add(i));
      bound.set(id, set);
    }
  }
  return new Map(
    [...bound].map(([id, set]) => [id, [...set].sort((a, b) => a - b)])
  );
}

/** The data as axes see it: multi values, padded labels, optional reverse. */
function normalizeForAxes(
  data: PreparedData,
  reverse = false,
  normalize: AxesConfig['normalize'] = {}
): NormalizedChartData {
  const raw = {
    labels: data.labels,
    series: data.series.map(series => ({
      name: series.name,
      className: series.className,
      meta: series.meta,
      data: series.values
    }))
  } as unknown as Data;
  // A flat series (e.g. distributed bars) stays flat for normalizeData.
  const input = data.flat
    ? ({
        labels: data.labels,
        series: data.series[0].values
      } as unknown as Data)
    : raw;
  const normalized = normalizeData(
    input,
    reverse,
    normalize.multi ?? true,
    normalize.distributed as true
  );
  return {
    labels: normalized.labels,
    series: normalized.series as NormalizedSeries[]
  };
}

function createAxis(
  definition: AxisDefinition,
  inset: number,
  series: NormalizedSeries[],
  normalized: NormalizedChartData,
  area: Area
): PlacedScaleAxis {
  const { type, id, side, ...options } = definition;
  const factory = isLegacyAxisClass(type) ? legacyAxis(type) : type;
  const axis = factory.create({
    dimension: directionOf(side),
    series,
    labels: normalized.labels,
    area,
    options
  });
  return { ...axis, id, side, inset, options };
}

/**
 * The axes of a `{ x, y }` config, without layer binding: what presets use.
 * `cartesianAxes()` adds the binding, so presets don't bundle it.
 * @internal
 */
export function presetAxes(
  config: AxesConfig,
  boundOf?: typeof boundSeries
): CartesianAxes {
  const definitions = definitionsOf(config);
  const insets = insetsOf(definitions);
  return {
    config,
    definitions,
    area: (width: number, height: number, padding: ChartPadding) =>
      axisArea(width, height, padding, definitions),
    create(data, area, bindings) {
      const bound = bindings && boundOf?.(bindings, data.series.length);
      const normalized = normalizeForAxes(
        data,
        config.reverseData,
        config.normalize
      );
      const allSeries = normalized.series as NormalizedSeries[];
      const all = definitions.map((definition, index) => {
        const indexes = bound?.get(definition.id);
        const series =
          indexes && !data.flat ? indexes.map(i => allSeries[i]) : allSeries;
        return createAxis(definition, insets[index], series, normalized, area);
      });
      return {
        normalized,
        axes: {
          x: all.find(axis => axis.dimension === 'x'),
          y: all.find(axis => axis.dimension === 'y'),
          all
        }
      };
    }
  };
}

/**
 * Creates the axes for the `axes` option of {@link chart}: a list of axes,
 * each with an `id`, a `side` and a `type`, several per side if needed.
 * Axis types are v2 factories ({@link stepAxis}, {@link autoScaleAxis},
 * {@link fixedScaleAxis}) or 1.x axis classes; the other fields are the
 * 1.x axis options (`offset`, `low`, `high`, `ticks`, …).
 *
 * Layers pick their axes by id, and each axis scales to the series of the
 * layers drawn on it. In the list form, offsets default to 30 px for X
 * axes and 40 px for Y axes, and axes on the same side stack outward in
 * list order. Unknown or duplicate ids throw.
 *
 * The 1.x-style `{ x, y }` form also works. There, offsets default to 0,
 * and the Y axis sits on the right unless its `position` is `'start'`.
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
 *   line,
 *   stepAxis
 * } from 'chartist';
 *
 * const months = ['Jan', 'Feb', 'Mar', 'Apr'];
 *
 * chart('#chart', {
 *   data: {
 *     labels: months,
 *     series: [
 *       { name: 'eur', data: [120, 180, 150, 210] },
 *       { name: 'usd', data: [130, 195, 160, 230] }
 *     ]
 *   },
 *   axes: cartesianAxes([
 *     { id: 'month', side: 'bottom', type: stepAxis(), ticks: months },
 *     // Both on the left: 'eur' next to the chart, 'usd' outside it.
 *     { id: 'eur', side: 'left', type: autoScaleAxis(), low: 0 },
 *     { id: 'usd', side: 'left', type: autoScaleAxis(), low: 0, offset: 50 }
 *   ]),
 *   layers: [
 *     axisGrid({ axes: ['month', 'eur'] }),
 *     bar({ series: ['eur'], y: 'eur' }),
 *     line({ series: ['usd'], y: 'usd', align: 'center' }),
 *     axisLabels()
 *   ],
 *   className: 'ct-chart-bar'
 * });
 * ```
 * @param input The axes: a list of {@link AxisDefinition}s, or the 1.x
 *   `{ x, y }` form.
 * @param extra `reverseData` and `normalize`, for the list form (the
 *   `{ x, y }` form takes them inline).
 * @experimental
 */
export function cartesianAxes(
  input: AxesConfig | readonly AxisDefinition[],
  extra: Pick<AxesConfig, 'reverseData' | 'normalize'> = {}
): CartesianAxes {
  // The list form gets the 1.x default offsets (30 px for X, 40 px for Y).
  const config: AxesConfig = Array.isArray(input)
    ? {
        ...extra,
        axes: (input as readonly AxisDefinition[]).map(definition => ({
          ...definition,
          offset:
            definition.offset ??
            (directionOf(definition.side) === 'x' ? 30 : 40)
        }))
      }
    : { ...extra, ...(input as AxesConfig) };
  const axes = presetAxes(config, boundSeries);
  const ids = new Set<string>();
  for (const { id } of axes.definitions) {
    if (ids.has(id)) {
      throw new Error(`Chartist: the axis id "${id}" is used twice`);
    }
    ids.add(id);
  }
  return {
    ...axes,
    bind: (layers, data) => bindLayers(axes.definitions, layers, data)
  };
}
