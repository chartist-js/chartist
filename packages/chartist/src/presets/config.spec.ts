import { toScene } from '../chart/toScene';
import type { PhaseEvents } from '../pipeline/types';
import { domRenderer } from '../render/dom';
import type { SceneNode } from '../scene/node';
import { findAll } from '../scene/tree';
import { barChart, barChartConfig } from './barChart';
import { lineChart, lineChartConfig } from './lineChart';
import { pieChart, pieChartConfig } from './pieChart';

const WIDTH = 400;
const HEIGHT = 200;

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => WIDTH },
    clientHeight: { get: () => HEIGHT }
  });
  document.body.appendChild(element);
  return element;
}

type Scene = PhaseEvents['scene']['scene'];

/**
 * A scene as plain data, without the root's size, which the host sets.
 * Axis contexts hold functions, which differ between two layouts.
 */
const unsized = (scene: SceneNode): unknown =>
  JSON.parse(
    JSON.stringify(scene.attr({ width: null, height: null, style: null }))
  );

/** The scene a preset renders. */
function presetScene(
  create: (element: Element) => {
    on(name: 'scene', listener: (payload: { scene: Scene }) => void): unknown;
    update(changes: object): unknown;
  }
): { scene: unknown; element: Element } {
  const element = sized();
  let scene: Scene | undefined;
  const chart = create(element);
  chart.on('scene', payload => void (scene = payload.scene));
  chart.update({});
  return { scene: unsized(scene!), element };
}

/** Lays out like the DOM renderer in that container, with HTML labels. */
function sizeIn(element: Element) {
  const { measureText } = domRenderer();
  return {
    width: WIDTH,
    height: HEIGHT,
    labels: 'html' as const,
    measureText: (text: string, options = {}) =>
      measureText!(text, { ...options, container: element })
  };
}

describe('presets/config', () => {
  const labels = ['Mon', 'Tue', 'Wed'];
  const series = [
    [5, 2, 4],
    [3, 4, 1]
  ];

  it('lineChartConfig gives the scene of lineChart', () => {
    const options = { showArea: true, low: 0, axisY: { onlyInteger: true } };
    const { scene, element } = presetScene(element =>
      lineChart(element, { labels, series }, options)
    );
    expect(
      unsized(
        toScene(lineChartConfig({ labels, series }, options), sizeIn(element))
      )
    ).toEqual(scene);
  });

  it('barChartConfig gives the scene of barChart, horizontal and stacked', () => {
    const options = { horizontalBars: true, stackBars: true };
    const { scene, element } = presetScene(element =>
      barChart(element, { labels, series }, options)
    );
    const config = toScene(
      barChartConfig({ labels, series }, options),
      sizeIn(element)
    );
    expect(unsized(config)).toEqual(scene);
    expect(findAll(config, { role: 'bar' })[0].attrs.y1).toBe(
      findAll(config, { role: 'bar' })[0].attrs.y2
    );
  });

  it('pieChartConfig gives the scene of pieChart, as a donut', () => {
    const options = { donut: true, donutWidth: 30 };
    const data = { labels, series: [5, 3, 4] };
    const { scene, element } = presetScene(element =>
      pieChart(element, data, options)
    );
    expect(
      unsized(toScene(pieChartConfig(data, options), sizeIn(element)))
    ).toEqual(scene);
  });

  it('works without labels and options', () => {
    const scene = toScene(lineChartConfig({ series: [[1, 2]] }), {
      width: WIDTH,
      height: HEIGHT
    });
    expect(findAll(scene, { role: 'point' })).toHaveLength(2);
    expect(scene.attrs.style).toBeUndefined();
  });

  it('passes plugins and listeners on', () => {
    const install = vi.fn();
    const config = lineChartConfig(
      { series: [[1]] },
      {
        plugins: [{ name: 'probe', install }],
        on: { scene: ({ scene }) => ({ scene: scene.addClass('seen') }) }
      }
    );
    const scene = toScene(config, { width: WIDTH, height: HEIGHT });
    expect(install).toHaveBeenCalled();
    expect(scene.classes).toContain('seen');
  });
});
