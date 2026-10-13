/**
 * Renders the site's charts: every element with `data-chart` gets a live
 * Chartist chart (functional API) when it comes near the viewport.
 */
import {
  barChart,
  lineChart,
  pieChart,
  type ChartHandle,
  type ChartPlugin
} from 'chartist';

/**
 * Draw-in: lines, bars and donut slices get pathLength="1", so CSS can
 * animate their dash offset (`.ct-draw`, see chart-theme.css).
 */
export const drawIn: ChartPlugin = {
  name: 'draw-in',
  install(chart) {
    chart.on('compose', node =>
      node.role === 'line' || node.role === 'bar' || node.role === 'slice'
        ? node.attr({ pathLength: 1 })
        : undefined
    );
  }
};

const PRESETS = { line: lineChart, bar: barChart, pie: pieChart } as const;

export interface ChartSpec {
  type: keyof typeof PRESETS;
  data: unknown;
  options?: Record<string, unknown>;
}

export function renderChart(
  element: HTMLElement,
  spec: ChartSpec
): ChartHandle {
  const preset = PRESETS[spec.type] as (
    target: Element,
    data: unknown,
    options: Record<string, unknown>
  ) => ChartHandle;
  return preset(element, spec.data, {
    ...spec.options,
    plugins: [drawIn]
  });
}

function mount(element: HTMLElement) {
  const spec = JSON.parse(element.dataset.chart!) as ChartSpec;
  renderChart(element, spec);
}

/** Renders charts once they are within a screen of the viewport. */
export function mountCharts(root: ParentNode = document) {
  const elements = [...root.querySelectorAll<HTMLElement>('[data-chart]')];
  if (!('IntersectionObserver' in window)) {
    elements.forEach(mount);
    return;
  }
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          mount(entry.target as HTMLElement);
        }
      }
    },
    { rootMargin: '100% 0px' }
  );
  elements.forEach(element => observer.observe(element));
}
