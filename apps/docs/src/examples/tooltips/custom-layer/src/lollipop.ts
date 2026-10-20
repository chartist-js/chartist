import { alphaNumerate, node, type Layer } from 'chartist';

// The roles this layer gives its nodes, so listeners and plugins can find
// them with a typed context.
declare module 'chartist' {
  interface NodeRoles {
    lollipop: {
      ctx: {
        readonly seriesIndex: number;
        readonly valueIndex: number;
        readonly value: number;
      };
      attrs: { readonly cx: number; readonly cy: number; readonly r: number };
    };
  }
}

export interface LollipopOptions {
  /** Series to draw, by name or index; default: all. */
  readonly series?: readonly (number | string)[];
  /** Axis ids; default: the first X and the first Y axis. */
  readonly x?: string;
  readonly y?: string;
}

/** A stem from zero and a dot for each value. */
export function lollipop(options: LollipopOptions = {}): Layer {
  return {
    type: 'lollipop',
    // Drawn where bars are, so the chart gets the bar chart's class, which
    // centers the X labels.
    chartType: 'bar',
    coordinates: ['cartesian'],
    axes: { x: options.x, y: options.y },
    series: options.series,
    // The stems start at zero, so the Y axis must include it.
    extent: ({ axes }) => (axes.y ? { [axes.y]: { low: 0, high: 0 } } : {}),
    compose({ area, axes, normalized, seriesIndexes }) {
      const { x, y } = axes;
      if (!x || !y || !normalized) {
        throw new Error('Layer "lollipop" needs an x and a y axis');
      }
      // Centered in each step, where bars sit.
      const shift = x.kind === 'step' ? (x.step ?? 0) / 2 : 0;
      const base = area.y1 - y.project(0);

      return normalized.series.map((values, local) => {
        // The series' index in the whole chart, for its class and color.
        const seriesIndex = seriesIndexes?.[local] ?? local;
        let group = node(
          'g',
          {},
          `ct-series ct-series-${alphaNumerate(seriesIndex)}`
        );
        values.forEach((value, valueIndex) => {
          // Values are normalized to { x, y }, or undefined for a hole.
          const v =
            value && typeof value === 'object' && 'y' in value
              ? value.y
              : undefined;
          if (v === undefined) {
            return;
          }
          const cx = area.x1 + shift + x.project(value, valueIndex, values);
          const cy = area.y1 - y.project(value, valueIndex, values);
          group = group
            .append(
              node('line', { x1: cx, y1: base, x2: cx, y2: cy }, 'ct-stem')
            )
            .append(
              node('circle', { cx, cy, r: 6 }, 'ct-lollipop', {
                role: 'lollipop',
                ctx: { seriesIndex, valueIndex, value: v }
              })
            );
        });
        return group;
      });
    }
  };
}
