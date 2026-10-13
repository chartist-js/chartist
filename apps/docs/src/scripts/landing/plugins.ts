/** The plugin demo: one bar chart, plugins toggled with chips. */
import { barChart, type ChartHandle, type ChartPlugin } from 'chartist';
import { lollipop, threshold, valueLabels } from '../../demos/plugins';

const DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  series: [[5, 4, 6, 8, 3, 9, 6]]
};

const PLUGINS: Record<string, { create: () => ChartPlugin; call: string }> = {
  lollipop: { create: lollipop, call: 'lollipop()' },
  valueLabels: { create: valueLabels, call: 'valueLabels()' },
  threshold: { create: () => threshold(7), call: 'threshold(7)' }
};

export function mountPluginDemo() {
  const target = document.querySelector<HTMLElement>('[data-plugin-chart]');
  if (!target) {
    return;
  }
  const usage = document.querySelector<HTMLElement>('[data-plugin-usage]')!;
  const chips = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-plugin]')
  ];
  let handle: ChartHandle | undefined;

  function render() {
    const active = chips
      .filter(chip => chip.getAttribute('aria-pressed') === 'true')
      .map(chip => PLUGINS[chip.dataset.plugin!]);
    handle?.destroy();
    handle = barChart(target!, DATA, {
      high: 10,
      low: 0,
      axisY: { onlyInteger: true },
      chartPadding: { top: 24 },
      plugins: active.map(plugin => plugin.create())
    });
    usage.textContent = `barChart('#chart', data, {\n  plugins: [${active.map(plugin => plugin.call).join(', ')}]\n});`;
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      chip.setAttribute(
        'aria-pressed',
        String(chip.getAttribute('aria-pressed') !== 'true')
      );
      render();
    });
  }
  // Draw once the box has its size, and again when it changes: drawn
  // before layout, the chart took a default height and overflowed.
  let drawn = '';
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    const size = `${Math.round(width)}x${Math.round(height)}`;
    if (width > 0 && height > 0 && size !== drawn) {
      drawn = size;
      render();
    }
  }).observe(target);
}
