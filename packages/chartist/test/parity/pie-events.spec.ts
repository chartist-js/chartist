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
import { record, type Recorded } from './events';
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
  return withoutDefaultDonutWidth(events, options);
}

/**
 * 1.x writes the default donut width (60px) on every slice; v2 leaves it
 * to the stylesheet's `--ct-donut-width`, also 60px, unless `donutWidth`
 * is set (#1474).
 */
function withoutDefaultDonutWidth(
  events: Recorded[],
  options?: PieChartOptions
) {
  if (!options?.donut || options.donutWidth !== undefined) {
    return events;
  }
  return events.map(event =>
    event.element
      ? {
          ...event,
          element: event.element.replace(' style="stroke-width: 60px"', '')
        }
      : event
  );
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
