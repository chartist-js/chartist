import { bar } from '../layers/bar';
import { line } from '../layers/line';
import { estimateText } from '../render/measure';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { node, type SceneNode } from '../scene/node';
import { findAll } from '../scene/tree';
import { createPhaseEmitter, type PhaseEmitter } from './emitter';
import { renderToString } from '../server/string';
import { runPipeline } from './phases';
import type { Layer } from './types';

const ENV = { width: 400, height: 200, measureText: estimateText };

function run(
  layers: Layer[],
  setup: (emitter: PhaseEmitter) => void = () => undefined
) {
  const emitter = createPhaseEmitter();
  setup(emitter);
  return runPipeline(
    emitter,
    {
      data: { labels: ['a', 'b', 'c'], series: [[5, 4, 7]] },
      axes: cartesianAxes([
        { id: 'x', side: 'bottom', type: stepAxis() },
        { id: 'y', side: 'left', type: autoScaleAxis(), low: 0 }
      ]),
      layers
    },
    ENV
  ).scene;
}

/** An annotating layer: a text at the end of every bar it gets. */
function barEnds(seen: SceneNode[][] = []): Layer {
  return {
    type: 'barEnds',
    coordinates: ['cartesian'],
    series: [],
    compose: () => [],
    annotate: drawn => {
      seen.push([...drawn]);
      return drawn.flatMap(top =>
        findAll(top, { role: 'bar' }).map(current =>
          node(
            'text',
            { x: current.ctx.x2, y: current.ctx.y2 },
            current.classes.join(' ')
          ).text(String(current.ctx.valueIndex))
        )
      );
    }
  };
}

const texts = (scene: SceneNode) =>
  scene.children.filter(child => child.name === 'text');

describe('pipeline annotating layers', () => {
  it('draws from the bars of a layer listed before it, after them', () => {
    const scene = run([bar(), barEnds()]);
    const bars = findAll(scene, { role: 'bar' });
    const labels = texts(scene);
    expect(labels).toHaveLength(3);
    labels.forEach((label, index) => {
      expect(label.attrs.x).toBe(bars[index].attrs.x2);
      expect(label.attrs.y).toBe(bars[index].attrs.y2);
    });
    expect(scene.children.indexOf(labels[0])).toBeGreaterThan(
      scene.children.findIndex(child => child.role === 'series')
    );
  });

  it('gets the nodes after the compose listeners', () => {
    const seen: SceneNode[][] = [];
    const scene = run([bar(), barEnds(seen)], emitter => {
      emitter.on('compose', (current: SceneNode) =>
        current.role !== 'bar'
          ? current
          : current.ctx.valueIndex === 1
            ? null
            : current.ctx.valueIndex === 2
              ? current.addClass('ct-high')
              : current
      );
    });
    const bars = seen[0].flatMap(top => findAll(top, { role: 'bar' }));
    expect(bars.map(current => current.ctx.valueIndex)).toEqual([0, 2]);
    expect(bars[1].classes).toContain('ct-high');
    expect(texts(scene).map(label => label.children[0])).toHaveLength(2);
  });

  it('keeps the draw order of layers and still sees layers listed after it', () => {
    const seen: SceneNode[][] = [];
    const scene = run([barEnds(seen), line()]);
    // No bars: it sees the line layer's nodes, and draws before them.
    expect(
      seen[0].some(top => findAll(top, { role: 'point' }).length > 0)
    ).toBe(true);
    const withBars = run([barEnds(), bar()]);
    const first = withBars.children.findIndex(child => child.name === 'text');
    const series = withBars.children.findIndex(
      child => child.role === 'series'
    );
    expect(first).toBeLessThan(series);
    expect(texts(scene)).toHaveLength(0);
  });

  it('keys and emits its nodes like any layer', () => {
    const emitted: SceneNode[] = [];
    const labelled: Layer = {
      type: 'labelled',
      coordinates: ['cartesian'],
      series: [],
      compose: () => [],
      annotate: drawn =>
        drawn.flatMap(top =>
          findAll(top, { role: 'bar' }).map(
            current =>
              node('text', { x: 0, y: 0 }, 'ct-mark', {
                role: 'point',
                ctx: { ...current.ctx, x: 0, y: 0 }
              } as never) as SceneNode
          )
        )
    };
    const scene = run([bar(), labelled], emitter => {
      emitter.on('compose', (current: SceneNode) => {
        emitted.push(current);
        return current;
      });
    });
    const marks = scene.children.filter(child => child.name === 'text');
    expect(marks.map(mark => mark.key)).toEqual(['1/0/0', '1/0/1', '1/0/2']);
    expect(emitted.filter(current => current.name === 'text')).toHaveLength(3);
  });

  it("doesn't show annotating layers each other's nodes", () => {
    const first: SceneNode[][] = [];
    const second: SceneNode[][] = [];
    run([bar(), barEnds(first), barEnds(second)]);
    for (const drawn of [first[0], second[0]]) {
      expect(drawn.every(top => top.name !== 'text')).toBe(true);
    }
  });

  it('leaves charts without an annotating layer as they were', () => {
    const plain = run([bar(), line()]);
    const annotated = run([bar(), line(), barEnds()]);
    const withLayer = texts(annotated).reduce(
      (scene, label) => scene.remove(label),
      annotated
    );
    expect(renderToString(withLayer)).toBe(renderToString(plain));
  });
});
