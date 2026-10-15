import { node, type ChartPlugin } from 'chartist';

/**
 * Keeps a circle on each value that reaches the target. The other points
 * go.
 */
export const reached = (target: number): ChartPlugin => ({
  name: 'reached',
  install(chart) {
    chart.on('compose', current => {
      if (current.role !== 'point') {
        return;
      }
      const { x, y, value } = current.ctx;
      const hit =
        value && typeof value === 'object' && 'y' in value
          ? (value.y ?? 0) >= target
          : false;
      // A circle with the point's role, context and key, or null to drop it.
      return hit
        ? node('circle', { cx: x, cy: y, r: 6 }, 'ct-hit', {
            role: current.role,
            ctx: current.ctx,
            key: current.key
          })
        : null;
    });
  }
});
