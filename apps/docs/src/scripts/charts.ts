/**
 * Renders the site's charts: every element with `data-chart` gets a live
 * Chartist chart (functional API) when it comes near the viewport.
 */
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  bar,
  barChart,
  cartesianAxes,
  chart,
  line,
  lineChart,
  pieChart,
  stepAxis,
  type ChartHandle,
  type ChartPlugin
} from 'chartist';

/**
 * Draw-in: lines, bars and donut slices get pathLength="1", so CSS can
 * animate their dash offset (`.ct-draw`, see chart-theme.css).
 */
export const drawIn: ChartPlugin = {
  name: 'draw-in',
  install(handle) {
    handle.on('compose', node =>
      node.role === 'line' || node.role === 'bar' || node.role === 'slice'
        ? node.attr({ pathLength: 1 })
        : undefined
    );
  }
};

interface ComposedData {
  labels: string[];
  /** Bars on the left axis, a line on the right axis. */
  series: [number[], number[]];
}

/** Bars on a left Y axis and a line on a right Y axis, each to its own scale. */
function composedChart(
  target: Element,
  data: ComposedData,
  options: Record<string, unknown> = {}
) {
  return chart(target, {
    data: {
      labels: data.labels,
      series: [
        { name: 'bars', data: data.series[0] },
        { name: 'line', className: 'ct-series-g', data: data.series[1] }
      ]
    },
    axes: cartesianAxes([
      { id: 'x', side: 'bottom', type: stepAxis(), ticks: data.labels },
      { id: 'left', side: 'left', type: autoScaleAxis(), low: 0 },
      { id: 'right', side: 'right', type: autoScaleAxis(), low: 0 }
    ]),
    layers: [
      axisGrid({ axes: ['x', 'left'] }),
      bar({ series: ['bars'], x: 'x', y: 'left' }),
      line({ series: ['line'], x: 'x', y: 'right', align: 'center' }),
      axisLabels()
    ],
    plugins: [drawIn],
    ...options
  });
}

const PRESETS = {
  line: lineChart,
  bar: barChart,
  pie: pieChart,
  composed: composedChart
} as const;

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
