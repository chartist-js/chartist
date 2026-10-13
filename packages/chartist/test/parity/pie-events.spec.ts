/**
 * Event parity: `new PieChart` with the compat plugin must emit the same
 * 1.x events as the published chartist@1.5.0.
 */
import { PieChart as PieChartV1 } from 'chartist-v1';
import { PieChart } from '../../src/charts/PieChart/PieChart';
import type {
  PieChartData,
  PieChartOptions
} from '../../src/charts/PieChart/PieChart.types';
import { compat } from '../../src/compat';
import { record } from './events';
import { container, useBrowserSizes } from './helpers';
import { PIE_FIXTURES } from './pie-fixtures';

useBrowserSizes();

async function events1x(data: PieChartData, options?: PieChartOptions) {
  const chart = new PieChartV1(
    container(),
    structuredClone(data),
    options as never
  );
  const events = record(chart as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return events;
}

async function eventsV2(data: PieChartData, options?: PieChartOptions) {
  const chart = new PieChart(container(), structuredClone(data), {
    ...options,
    plugins: [compat]
  });
  const events = record(chart as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return events;
}

describe('PieChart with compat emits the 1.x events of 1.5.0', () => {
  it.each(PIE_FIXTURES)('%s', async (_name, data, options) => {
    const expected = await events1x(data, options);
    expect(await eventsV2(data, options)).toEqual(expected);
  });
});
