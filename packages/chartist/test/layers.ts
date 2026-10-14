import { node, type SceneNode } from '../src/scene/node';
import type { Coordinates, Layer } from '../src/pipeline/types';

/**
 * Test layer: one `g` per series (role `series`) with one `circle` per
 * value (role `point`), spread evenly over the chart area.
 */
export function dots(
  className = 'dot',
  coordinates: Coordinates[] = ['cartesian']
): Layer {
  return {
    type: 'dots',
    coordinates,
    compose({ data, area }) {
      return data.series.map((series, seriesIndex) =>
        series.values.reduce<SceneNode>(
          (group, value, valueIndex) => {
            const x =
              area.x1 + (area.width / series.values.length) * valueIndex;
            const y = area.y1 - Number(value);
            return group.append(
              node('circle', { cx: x, cy: y, r: 2 }, className, {
                role: 'point',
                ctx: {
                  series: series.values,
                  seriesIndex,
                  meta: undefined,
                  valueIndex,
                  value: Number(value),
                  x,
                  y
                }
              })
            );
          },
          node('g', {}, 'series', {
            role: 'series',
            ctx: { series: series.values, seriesIndex, meta: undefined }
          })
        )
      );
    }
  };
}
