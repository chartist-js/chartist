/**
 * Parity: the v2 `pieChart` preset must render the same DOM as the
 * published chartist@1.5.0 `PieChart` for the same data and options.
 */
import { PieChart } from 'chartist-v1';
import type {
  PieChartData,
  PieChartOptions
} from '../../src/charts/PieChart/PieChart.types';
import { pieChart } from '../../src/presets/pieChart';
import { markup } from '../markup';
import { container, useBrowserSizes } from './helpers';
import { PIE_FIXTURES } from './pie-fixtures';

useBrowserSizes();

async function render1x(data: PieChartData, options?: PieChartOptions) {
  const element = container();
  const chart = new PieChart(element, structuredClone(data), options as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return element.querySelector('svg')!;
}

function renderV2(data: PieChartData, options?: PieChartOptions) {
  const element = container();
  pieChart(element, structuredClone(data), options);
  return element.querySelector('svg')!;
}

describe('pieChart renders like 1.x PieChart', () => {
  it.each(PIE_FIXTURES)('%s', async (_name, data, options) => {
    const expected = markup(await render1x(data, options));
    expect(markup(renderV2(data, options))).toBe(expected);
  });
});
