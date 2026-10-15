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
import { useDonutStylesheet } from '../donut-css';
import { container, useBrowserSizes } from './helpers';
import { fullCircles1x, fullCirclesV2, hasFullSlice } from './pie-circle';
import { PIE_FIXTURES } from './pie-fixtures';

useBrowserSizes();
useDonutStylesheet();

async function render1x(data: PieChartData, options?: PieChartOptions) {
  const element = container();
  const chart = new PieChart(element, structuredClone(data), options as never);
  await new Promise(resolve => chart.on('created', resolve));
  chart.detach();
  return element.querySelector('svg')!;
}

/**
 * 1.x writes the default donut width (60px) on every slice; v2 leaves it
 * to the stylesheet's `--ct-donut-width`, also 60px, unless `donutWidth`
 * is set (#1474). The drawn width is the same.
 */
function withoutDefaultDonutWidth(svg: Element, options?: PieChartOptions) {
  if (options?.donut && options.donutWidth === undefined) {
    svg.querySelectorAll('.ct-slice-donut').forEach(slice => {
      expect(slice.getAttribute('style')).toBe('stroke-width: 60px');
      slice.removeAttribute('style');
    });
  }
  return svg;
}

function renderV2(data: PieChartData, options?: PieChartOptions) {
  const element = container();
  pieChart(element, structuredClone(data), options);
  return element.querySelector('svg')!;
}

// A slice that fills the circle is compared in a shared form: v2 draws it
// as two half circles, so the ring stays centred (see `pie-circle.ts`).
describe('pieChart renders like 1.x PieChart', () => {
  it.each(PIE_FIXTURES)('%s', async (_name, data, options) => {
    const expected = fullCircles1x(
      markup(withoutDefaultDonutWidth(await render1x(data, options), options)),
      hasFullSlice(data, options)
    );
    expect(fullCirclesV2(markup(renderV2(data, options)))).toBe(expected);
  });
});
