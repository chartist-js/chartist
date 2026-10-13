import { normalizeData } from '../core/data/normalize';
import type { ChartPadding, Data, NormalizedSeries } from '../core/types';
import type {
  Area,
  NormalizedChartData,
  PreparedData
} from '../pipeline/types';
import {
  axisArea,
  type AxesConfig,
  type AxisDimension,
  type AxisSetup,
  type CartesianAxes
} from './axis';
import { isLegacyAxisClass, legacyAxis } from './legacy';

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
  dimension: AxisDimension,
  setup: AxisSetup,
  normalized: NormalizedChartData,
  area: Area
) {
  const { type, ...options } = setup;
  const factory = isLegacyAxisClass(type) ? legacyAxis(type) : type;
  return factory.create({
    dimension,
    series: normalized.series as NormalizedSeries[],
    labels: normalized.labels,
    area,
    options
  });
}

/**
 * An x and/or y axis for a chart: `chart(el, { axes: cartesianAxes({ x, y }) })`.
 * Axis types are v2 factories (`stepAxis()`, …) or 1.x axis classes.
 * @experimental
 */
export function cartesianAxes(config: AxesConfig): CartesianAxes {
  return {
    config,
    area: (width: number, height: number, padding: ChartPadding) =>
      axisArea(width, height, padding, config),
    create(data, area) {
      const normalized = normalizeForAxes(
        data,
        config.reverseData,
        config.normalize
      );
      return {
        normalized,
        axes: {
          x: config.x && createAxis('x', config.x, normalized, area),
          y: config.y && createAxis('y', config.y, normalized, area)
        }
      };
    }
  };
}
