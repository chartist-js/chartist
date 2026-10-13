/**
 * Event parity: `new LineChart` with the compat plugin must emit the same
 * 1.x events as the published chartist@1.5.0, in the same order, with the
 * same payload fields and the same element markup.
 */
import { LineChart as LineChartV1 } from 'chartist-v1';
import { LineChart } from '../../src/charts/LineChart/LineChart';
import type {
  LineChartData,
  LineChartOptions
} from '../../src/charts/LineChart/LineChart.types';
import { compat } from '../../src/compat';
import { record } from './events';
import { container, useBrowserSizes, withV1Axes } from './helpers';
import { FIXTURES } from './line-fixtures';

useBrowserSizes();

async function events1x(data: LineChartData, options?: LineChartOptions) {
  const chart = new LineChartV1(
    container(),
    structuredClone(data),
    withV1Axes(options) as never
  );
  const events = record(chart as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return events;
}

async function eventsV2(data: LineChartData, options?: LineChartOptions) {
  const chart = new LineChart(container(), structuredClone(data), {
    ...options,
    plugins: [compat]
  });
  const events = record(chart as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return events;
}

describe('LineChart with compat emits the 1.x events of 1.5.0', () => {
  it.each(FIXTURES)('%s', async (_name, data, options) => {
    const expected = await events1x(data, options);
    expect(await eventsV2(data, options)).toEqual(expected);
  });
});
