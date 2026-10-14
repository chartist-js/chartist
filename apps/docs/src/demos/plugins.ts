import type { ChartPlugin, RoleNode, SceneNode } from 'chartist';
import { node } from 'chartist';

/**
 * Decorates every bar of a series. Series are composed after their bars,
 * so decorations see each bar as other plugins left it, and plugins that
 * decorate combine in any order.
 */
function decorateBars(
  series: SceneNode,
  decorate: (bar: RoleNode<'bar'>) => SceneNode | undefined
): SceneNode {
  return series.children
    .filter(child => child.role === 'bar')
    .reduce((result, bar) => {
      const decoration = decorate(bar);
      return decoration ? result.append(decoration) : result;
    }, series);
}

/** A bar's value: bar charts normalize values to { x, y }. */
function barValue(bar: RoleNode<'bar'>): number | undefined {
  const { value } = bar.ctx;
  return typeof value === 'number'
    ? value
    : value && 'y' in value
      ? value.y
      : undefined;
}

/** Lollipop bars: a dot on each bar; CSS makes the stick thin. */
export const lollipop = (): ChartPlugin => ({
  name: 'lollipop',
  install(chart) {
    chart.on('compose', series => {
      if (series.role !== 'series') {
        return;
      }
      return decorateBars(series.addClass('ct-lollipops'), bar => {
        const { x2, y2, style } = bar.attrs;
        return node('circle', { cx: x2, cy: y2, r: 6, style }, 'ct-lollipop');
      });
    });
  }
});

/** The value above each bar. */
export const valueLabels = (): ChartPlugin => ({
  name: 'value-labels',
  install(chart) {
    chart.on('compose', series => {
      if (series.role !== 'series') {
        return;
      }
      return decorateBars(series, bar => {
        const { x2, y2 } = bar.attrs;
        return node(
          'text',
          { x: x2, y: y2 - 12, 'text-anchor': 'middle' },
          'ct-value-label'
        ).text(String(barValue(bar)));
      });
    });
  }
});

/** Bars at or above a value take another series color. */
export const threshold = (limit: number): ChartPlugin => ({
  name: 'threshold',
  install(chart) {
    chart.on('compose', bar => {
      if (bar.role !== 'bar') {
        return;
      }
      const value = barValue(bar);
      if (value === undefined || value < limit) {
        return;
      }
      return bar.attr({ style: '--ct-color: var(--ct-series-g)' });
    });
  }
});
