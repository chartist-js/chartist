/**
 * Parity: the v2 `lineChart` preset must render the same DOM as the
 * published chartist@1.5.0 `LineChart` for the same data and options.
 * Fixtures cover the line examples (packages/examples/line) and the 1.x
 * LineChart spec cases.
 */
// The published 1.5.0 build; it accepts the local axis classes and
// interpolations, which are the same 1.x code.
import { LineChart } from 'chartist-v1';
import type {
  LineChartData,
  LineChartOptions
} from '../../src/charts/LineChart/LineChart.types';
import { lineChart } from '../../src/presets/lineChart';
import { markup } from '../markup';
import { container, useBrowserSizes, withV1Axes } from './helpers';
import { FIXTURES } from './line-fixtures';

useBrowserSizes();

async function render1x(data: LineChartData, options?: LineChartOptions) {
  const element = container();
  const chart = new LineChart(
    element,
    structuredClone(data),
    withV1Axes(options) as never
  );
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return element.querySelector('svg')!;
}

function renderV2(data: LineChartData, options?: LineChartOptions) {
  const element = container();
  lineChart(element, structuredClone(data), options);
  return element.querySelector('svg')!;
}

describe('lineChart renders like 1.x LineChart', () => {
  it.each(FIXTURES)('%s', async (_name, data, options) => {
    const expected = markup(await render1x(data, options));
    expect(markup(renderV2(data, options))).toBe(expected);
  });
});
