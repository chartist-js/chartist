/**
 * Event parity: `new BarChart` with the compat plugin must emit the same
 * 1.x events as the published chartist@1.5.0, in the same order, with the
 * same payload fields and the same element markup.
 */
import { BarChart as BarChartV1 } from 'chartist-v1';
import { BarChart } from '../../src/charts/BarChart/BarChart';
import type {
  BarChartData,
  BarChartOptions
} from '../../src/charts/BarChart/BarChart.types';
import { compat } from '../../src/compat';
import { BAR_FIXTURES } from './bar-fixtures';
import { record } from './events';
import { container, useBrowserSizes, withV1Axes } from './helpers';

useBrowserSizes();

async function events1x(data: BarChartData, options?: BarChartOptions) {
  const chart = new BarChartV1(
    container(),
    structuredClone(data),
    withV1Axes(options as never) as never
  );
  const events = record(chart as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return events;
}

async function eventsV2(data: BarChartData, options?: BarChartOptions) {
  const chart = new BarChart(container(), structuredClone(data), {
    ...options,
    plugins: [compat]
  });
  const events = record(chart as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return events;
}

describe('BarChart with compat emits the 1.x events of 1.5.0', () => {
  it.each(BAR_FIXTURES)('%s', async (_name, data, options) => {
    const expected = await events1x(data, options);
    expect(await eventsV2(data, options)).toEqual(expected);
  });
});
