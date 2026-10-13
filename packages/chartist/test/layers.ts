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
          (group, value, valueIndex) =>
            group.append(
              node(
                'circle',
                {
                  cx:
                    area.x1 + (area.width / series.values.length) * valueIndex,
                  cy: area.y1 - Number(value),
                  r: 2
                },
                className,
                { role: 'point', ctx: { seriesIndex, valueIndex, value } }
              )
            ),
          node('g', {}, 'series', { role: 'series', ctx: { seriesIndex } })
        )
      );
    }
  };
}
