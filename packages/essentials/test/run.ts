/**
 * Runs a composed chart without a DOM and returns its scene with the
 * axes and the drawing area, read by a layer at the end of the list.
 */
import {
  cartesianAxes,
  findAll,
  toScene,
  type Area,
  type AxisDefinition,
  type CartesianAxes,
  type ChartAxes,
  type Layer,
  type NodeRole
} from 'chartist';

export function run(
  layers: Layer[],
  axes: readonly AxisDefinition[] | CartesianAxes,
  data: { labels?: string[]; series: unknown[] },
  size = { width: 400, height: 200 }
) {
  let created: ChartAxes | undefined;
  let area: Area | undefined;
  const probe: Layer = {
    type: 'probe',
    coordinates: ['cartesian'],
    series: [],
    compose: context => {
      created = context.axes;
      area = context.area;
      return [];
    }
  };
  const scene = toScene(
    {
      data: data as never,
      axes: Array.isArray(axes)
        ? cartesianAxes(axes as readonly AxisDefinition[])
        : (axes as CartesianAxes),
      layers: [...layers, probe]
    },
    size
  );
  return { scene, axes: created!, layout: { area: area! } };
}

/** The nodes of one role in a scene. */
export const nodesOf = (
  scene: ReturnType<typeof run>['scene'],
  role: NodeRole
) => findAll(scene, { role });
