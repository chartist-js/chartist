import type { Layer } from '../pipeline/types';
import type { ChartConfig } from './types';

/**
 * The chart type class for a chart's layers, so the stylesheet's chart
 * type rules (label alignment, for one) apply: bar first, since composed
 * charts with bars need the bar label alignment, then pie or donut, else
 * line.
 */
export function chartTypeClass(layers: readonly Layer[]): string {
  const types = layers.map(layer => layer.chartType ?? layer.type);
  if (types.includes('bar')) {
    return 'ct-chart-bar';
  }
  if (types.includes('donut')) {
    return 'ct-chart-donut';
  }
  return types.includes('pie') ? 'ct-chart-pie' : 'ct-chart-line';
}

/** The config with the chart type class when it has no `className`. */
export function withChartTypeClass<T extends ChartConfig>(config: T): T {
  return config.className === undefined
    ? { ...config, className: chartTypeClass(config.layers) }
    : config;
}
