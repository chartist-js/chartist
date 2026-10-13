/**
 * Parity: the v2 `barChart` preset must render the same DOM as the
 * published chartist@1.5.0 `BarChart` for the same data and options.
 */
import { BarChart } from 'chartist-v1';
import type {
  BarChartData,
  BarChartOptions
} from '../../src/charts/BarChart/BarChart.types';
import { barChart } from '../../src/presets/barChart';
import { markup } from '../markup';
import { BAR_FIXTURES } from './bar-fixtures';
import { container, useBrowserSizes, withV1Axes } from './helpers';

useBrowserSizes();

async function render1x(data: BarChartData, options?: BarChartOptions) {
  const element = container();
  const chart = new BarChart(
    element,
    structuredClone(data),
    withV1Axes(options as never) as never
  );
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return element.querySelector('svg')!;
}

function renderV2(data: BarChartData, options?: BarChartOptions) {
  const element = container();
  barChart(element, structuredClone(data), options as never);
  return element.querySelector('svg')!;
}

describe('barChart renders like 1.x BarChart', () => {
  it.each(BAR_FIXTURES)('%s', async (_name, data, options) => {
    const expected = markup(await render1x(data, options));
    expect(markup(renderV2(data, options))).toBe(expected);
  });
});
