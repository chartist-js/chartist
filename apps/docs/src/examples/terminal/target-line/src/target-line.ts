import { node, type ChartPlugin, type SceneNode } from 'chartist';

/**
 * A labeled line at a target value, and a circle on each value that
 * reaches it. The other points go.
 */
export const targetLine = (target: number, label = 'target'): ChartPlugin => ({
  name: 'target-line',
  install(chart) {
    let marker: SceneNode | undefined;
    chart.on('compose', current => {
      // A grid line of the Y axis knows its axis, and so where the target is.
      if (
        current.role === 'grid' &&
        current.ctx.axis.dimension === 'y' &&
        current.ctx.index === 0
      ) {
        const { axis, index, x1, x2, y1 } = current.ctx;
        const y = y1 - (axis.project(target) - axis.project(axis.ticks[index]));
        marker = node('g', {}, 'ct-target')
          .append(node('line', { x1, x2, y1: y, y2: y }))
          .append(node('text', { x: x1, y: y - 6 }).text(label));
        return;
      }
      if (current.role === 'point') {
        const { x, y, value } = current.ctx;
        const reached =
          value && typeof value === 'object' && 'y' in value
            ? (value.y ?? 0) >= target
            : false;
        return reached
          ? node('circle', { cx: x, cy: y, r: 6 }, 'ct-hit', {
              role: current.role,
              ctx: current.ctx,
              key: current.key
            })
          : null;
      }
    });
    // Drawn last, on top of the series.
    chart.on('scene', ({ scene }) =>
      marker ? { scene: scene.append(marker) } : undefined
    );
  }
});
