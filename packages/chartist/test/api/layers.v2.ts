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
          (group, value, valueIndex) => {
            const x =
              area.x1 + (area.width / series.values.length) * valueIndex;
            const y = area.y1 - Number(value);
            return group.append(
              node(
                'circle',
                { cx: x, cy: y, r: 3, 'ct:value': String(value) },
                className,
                {
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
                }
              )
            );
          },
          node('g', {}, 'ct-series', {
            role: 'series',
            ctx: { series: series.values, seriesIndex, meta: undefined }
          })
        )
      );
    }
  };
}
