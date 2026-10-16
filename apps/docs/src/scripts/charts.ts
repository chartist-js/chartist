/**
 * Renders the site's charts: every element with `data-chart` gets a live
 * Chartist chart (functional API) when it comes near the viewport.
 */
import * as Chartist from 'chartist';
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

/** Small cards: tighter than the library's 15px padding. */
const COMPACT_PADDING = { top: 10, right: 16, bottom: 0, left: 0 };

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
        { name: 'line', className: 'ct-series-e', data: data.series[1] }
      ]
    },
    axes: cartesianAxes([
      {
        id: 'x',
        side: 'bottom',
        type: stepAxis(),
        ticks: data.labels,
        offset: 24
      },
      { id: 'left', side: 'left', type: autoScaleAxis(), low: 0, offset: 30 },
      { id: 'right', side: 'right', type: autoScaleAxis(), low: 0, offset: 30 }
    ]),
    padding: { ...COMPACT_PADDING, right: 0 },
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
  composed: composedChart,
  /** `chart()` itself: `options` is the config without `data`. */
  chart: (target: Element, data: unknown, options: Record<string, unknown>) =>
    chart(target, { ...options, data } as Parameters<typeof chart>[1])
} as const;

export interface ChartSpec {
  type: keyof typeof PRESETS;
  data: unknown;
  /**
   * JSON, so functions are written as `{ $call: 'Interpolation.step',
   * args: [{ postpone: false }] }`: a Chartist export by name, called with
   * the args (themselves revived), e.g. `{ $call: 'autoScaleAxis' }` or a
   * layer like `{ $call: 'line', args: [{ series: ['a'] }] }`.
   */
  options?: Record<string, unknown>;
  /**
   * Exactly as the library draws it: its own padding and label sizes, no
   * draw-in (live example previews, so they match their code).
   */
  plain?: boolean;
}

/** Replaces `{ $call, args }` markers with what the Chartist export returns. */
export function revive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(revive);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const { $call, args = [] } = value as { $call?: string; args?: unknown[] };
  if (typeof $call === 'string') {
    const fn = $call
      .split('.')
      .reduce<unknown>(
        (scope, key) => (scope as Record<string, unknown>)?.[key],
        Chartist
      );
    if (typeof fn !== 'function') {
      throw new Error(`Chartist has no function "${$call}"`);
    }
    return (fn as (...params: unknown[]) => unknown)(
      ...(revive(args) as unknown[])
    );
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, revive(entry)])
  );
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
  const options = revive(spec.options ?? {}) as Record<string, unknown>;
  return preset(
    element,
    spec.data,
    spec.plain
      ? options
      : spec.type !== 'line' && spec.type !== 'bar'
        ? { ...options, plugins: [drawIn] }
        : {
            ...options,
            // Narrower Y labels than the library's 40px; the padding leaves
            // room on the right for the last X label.
            chartPadding: {
              ...COMPACT_PADDING,
              ...(options.chartPadding as object)
            },
            axisY: { offset: 30, ...(options.axisY as object) },
            plugins: [drawIn]
          }
  );
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
