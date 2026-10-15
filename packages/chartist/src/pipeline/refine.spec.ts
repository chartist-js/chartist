import { dots } from '../../test/layers';
import { estimateText } from '../render/measure';
import { node, withFields, type SceneNode } from '../scene/node';
import { findAll } from '../scene/tree';
import { createPhaseEmitter, type PhaseEmitter } from './emitter';
import { runPipeline } from './phases';
import type { Layer } from './types';

const ENV = { width: 400, height: 200, measureText: estimateText };

function run(
  layers: Layer[],
  setup: (emitter: PhaseEmitter) => void = () => undefined
) {
  const emitter = createPhaseEmitter();
  setup(emitter);
  return runPipeline(emitter, { data: { series: [[1, 2, 3]] }, layers }, ENV)
    .scene;
}

/** A layer that draws nothing and refines points. */
function refining(
  refine: (current: SceneNode) => SceneNode | undefined
): Layer {
  return {
    type: 'refining',
    coordinates: ['cartesian'],
    series: [],
    compose: () => [],
    refine
  };
}

const points = (scene: SceneNode) => findAll(scene, { role: 'point' });

describe('pipeline layer refinement', () => {
  it('refines the nodes of layers listed after it', () => {
    const scene = run([
      refining(current =>
        current.role === 'point' ? current.addClass('ct-marked') : undefined
      ),
      dots()
    ]);
    expect(points(scene)).toHaveLength(3);
    for (const point of points(scene)) {
      expect(point.classes).toContain('ct-marked');
    }
  });

  it('runs refiners in the order of the layers', () => {
    const scene = run([
      dots(),
      refining(current =>
        current.role === 'point' ? current.addClass('ct-a') : undefined
      ),
      refining(current =>
        current.role === 'point' && current.classes.includes('ct-a')
          ? current.addClass('ct-b')
          : undefined
      )
    ]);
    for (const point of points(scene)) {
      expect(point.classes).toEqual(expect.arrayContaining(['ct-a', 'ct-b']));
    }
  });

  it('keeps keys and children', () => {
    const scene = run([
      dots(),
      refining(current =>
        current.role === 'series'
          ? withFields(current.addClass('replaced'), { children: [] })
          : current.role === 'point'
            ? (node('circle', { cx: 0, cy: 0, r: 1 }, 'other', {
                role: 'point',
                ctx: current.ctx
              } as never) as SceneNode)
            : undefined
      )
    ]);
    const series = findAll(scene, { role: 'series' });
    expect(series[0].classes).toContain('replaced');
    expect(series[0].key).toBe('0/0');
    expect(series[0].children).toHaveLength(3);
    expect(points(scene).map(point => point.key)).toEqual([
      '0/0/0',
      '0/0/1',
      '0/0/2'
    ]);
  });

  it('leaves the scene alone without refining layers', () => {
    const plain = run([dots()]);
    const withLayer = run([
      dots(),
      {
        type: 'empty',
        coordinates: ['cartesian'],
        series: [],
        compose: () => []
      }
    ]);
    expect(withLayer).toEqual(plain);
  });

  it('emits compose events on refined nodes, in layer order', () => {
    const seen: string[] = [];
    run(
      [
        dots('first'),
        refining(current =>
          current.role === 'point' ? current.addClass('ct-marked') : undefined
        ),
        dots('second')
      ],
      emitter =>
        emitter.on('compose', (current: SceneNode) => {
          seen.push(
            `${current.role}:${current.classes.join(' ')}`.replace(
              / ct-marked/,
              '+'
            )
          );
        })
    );
    expect(seen).toEqual([
      'point:first+',
      'point:first+',
      'point:first+',
      'series:series',
      'point:second+',
      'point:second+',
      'point:second+',
      'series:series'
    ]);
  });

  it('lets compose listeners change refined nodes', () => {
    const scene = run(
      [
        dots(),
        refining(current =>
          current.role === 'point' ? current.addClass('ct-marked') : undefined
        )
      ],
      emitter =>
        emitter.on('compose', (current: SceneNode) =>
          current.role === 'point' ? null : undefined
        )
    );
    expect(points(scene)).toHaveLength(0);
  });
});
