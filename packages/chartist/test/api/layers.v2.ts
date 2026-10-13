/**
 * A custom layer written only against the public API, like a user would:
 * one `g` per series (role `series`) with a `circle` per value (`point`).
 */
import { node, type Coordinates, type Layer, type SceneNode } from 'chartist';

export function dotsLayer(
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
                  r: 3,
                  'ct:value': String(value)
                },
                className,
                { role: 'point', ctx: { seriesIndex, valueIndex, value } }
              )
            ),
          node('g', {}, 'ct-series', { role: 'series', ctx: { seriesIndex } })
        )
      );
    }
  };
}
