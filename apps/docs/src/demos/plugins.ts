import type { ChartPlugin, SceneNode } from 'chartist';
import { node } from 'chartist';

/**
 * Decorates every bar of a series. Series are composed after their bars,
 * so decorations see each bar as other plugins left it, and plugins that
 * decorate combine in any order.
 */
function decorateBars(
  series: SceneNode,
  decorate: (bar: SceneNode) => SceneNode | undefined
): SceneNode {
  return series.children
    .filter(child => child.role === 'bar')
    .reduce((result, bar) => {
      const decoration = decorate(bar);
      return decoration ? result.append(decoration) : result;
    }, series);
}

/** Lollipop bars: a thin stick with a dot on top. */
export const lollipop = (): ChartPlugin => ({
  name: 'lollipop',
  install(chart) {
    chart.on('compose', series => {
      if (series.role !== 'series') {
        return;
      }
      const thin = series.children.reduce(
        (result, bar) =>
          bar.role === 'bar'
            ? result.replace(
                bar,
                bar.attr({ style: `${bar.attrs.style ?? ''};stroke-width:3px` })
              )
            : result,
        series
      );
      return decorateBars(thin, bar => {
        const { x2, y2, style } = bar.attrs;
        // The dot takes the bar's style, so a recolored bar keeps its dot.
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
        const { x2, y2 } = bar.attrs as { x2: number; y2: number };
        const value = (bar.ctx?.value as { y?: number })?.y;
        return node(
          'text',
          { x: x2, y: y2 - 12, 'text-anchor': 'middle' },
          'ct-value-label'
        ).text(String(value));
      });
    });
  }
});

/** Bars at or above a value take another series color. */
export const threshold = (limit: number): ChartPlugin => ({
  name: 'threshold',
  install(chart) {
    chart.on('compose', bar => {
      const value = (bar.ctx?.value as { y?: number })?.y;
      if (bar.role !== 'bar' || value === undefined || value < limit) {
        return;
      }
      return bar.attr({ style: '--ct-color: var(--ct-series-g)' });
    });
  }
});
