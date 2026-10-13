import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import { findAll } from '../scene/tree';
import {
  determineAnchorPosition,
  moveLabel,
  pie,
  type PieLayerOptions
} from './pie';

function scene(
  series: unknown[],
  options: PieLayerOptions = {},
  labels?: string[]
) {
  return runPipeline(
    createPhaseEmitter(),
    {
      data: { labels, series },
      coordinates: 'polar',
      padding: 0,
      layers: [pie(options)]
    },
    { width: 200, height: 200, measureText: estimateText }
  ).scene;
}

describe('layers/pie', () => {
  it('draws in polar coordinates only', () => {
    expect(() =>
      runPipeline(
        createPhaseEmitter(),
        { data: { series: [1] }, layers: [pie()] },
        { width: 100, height: 100, measureText: estimateText }
      )
    ).toThrow('Layer "pie" does not support cartesian coordinates');
  });

  it('slices carry the 1.x draw data', () => {
    const [first] = findAll(scene([1, 3]), { role: 'slice' });
    expect(first.ctx).toMatchObject({
      value: 1,
      totalDataSum: 4,
      index: 0,
      startAngle: 0,
      endAngle: 90,
      radius: 100
    });
    expect(first.ctx?.center).toEqual({ x: 100, y: 100 });
  });

  it('donut widths in px and percent shrink the radius by half the width', () => {
    expect(
      findAll(scene([1], { donut: true, donutWidth: 20 }), { role: 'slice' })[0]
        .ctx?.radius
    ).toBe(90);
    expect(
      findAll(scene([1], { donut: true, donutWidth: '50%' }), {
        role: 'slice'
      })[0].ctx?.radius
    ).toBe(75);
    expect(
      findAll(scene([1], { donut: true, donutWidth: 20 }), { role: 'slice' })[0]
        .attrs.style
    ).toBe('stroke-width: 20px');
  });

  it('a single value puts its label in the center', () => {
    const [label] = findAll(scene([5]), { role: 'label' });
    expect([label.attrs.dx, label.attrs.dy]).toEqual([100, 100]);
  });

  it('ignoreEmptyValues keeps an empty group for the zero value', () => {
    const result = scene([1, 0, 2], { ignoreEmptyValues: true });
    expect(findAll(result, { role: 'slice' })).toHaveLength(2);
    expect(result.children).toHaveLength(4);
    expect(result.children[1].children).toHaveLength(0);
  });

  it('label anchors follow the side and direction', () => {
    const center = { x: 0, y: 0 };
    expect(determineAnchorPosition(center, { x: 1, y: 0 }, 'explode')).toBe(
      'start'
    );
    expect(determineAnchorPosition(center, { x: -1, y: 0 }, 'explode')).toBe(
      'end'
    );
    expect(determineAnchorPosition(center, { x: 1, y: 0 }, 'neutral')).toBe(
      'middle'
    );
  });

  it('moveLabel shifts overlapping labels up and left', () => {
    const label = { x: 10, y: 10 };
    moveLabel(label, { x: 10, y: 10 }, 5, 2);
    expect(label).toEqual({ x: 5, y: 5 });
  });
});
