import { toScene } from '../chart/toScene';
import { lineChartConfig } from '../presets/lineChart';
import { pieChartConfig } from '../presets/pieChart';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import type { SceneNode } from '../scene/node';
import { findAll } from '../scene/tree';
import { axisLabels } from './axes';
import { labelTransformOf } from './label';
import { line } from './line';

const SIZE = { width: 400, height: 300 };
const data = { labels: ['Mon', 'Tue', 'Wed'], series: [[1, 5, 3]] };

/** The texts of the axis labels of one direction (`x` or `y`). */
function labels(scene: SceneNode, dimension: 'x' | 'y') {
  return findAll(scene, { role: 'label' })
    .filter(
      label =>
        label.ctx.kind === 'axis' && label.ctx.axis.dimension === dimension
    )
    .map(label => String(label.ctx.text));
}

describe('label transform', () => {
  it('uses labelTransform, else labelInterpolationFnc, else the label', () => {
    const transform = () => 'new';
    const legacy = () => 'old';
    expect(
      labelTransformOf({
        labelTransform: transform,
        labelInterpolationFnc: legacy
      })
    ).toBe(transform);
    expect(labelTransformOf({ labelInterpolationFnc: legacy })).toBe(legacy);
    expect(labelTransformOf({})('Mon', 0)).toBe('Mon');
  });

  it('formats preset axis labels with labelTransform', () => {
    const scene = toScene(
      lineChartConfig(data, {
        labels: 'svg',
        axisY: { labelTransform: value => `${value} °C` }
      }),
      SIZE
    );
    expect(labels(scene, 'y').every(text => text.endsWith(' °C'))).toBe(true);
  });

  it('prefers labelTransform over labelInterpolationFnc', () => {
    const scene = toScene(
      lineChartConfig(data, {
        labels: 'svg',
        axisX: {
          labelInterpolationFnc: () => 'old',
          labelTransform: () => 'new'
        }
      }),
      SIZE
    );
    expect(labels(scene, 'x')).toEqual(['new', 'new', 'new']);
  });

  it('keeps labelInterpolationFnc working on its own', () => {
    const scene = toScene(
      lineChartConfig(data, {
        labels: 'svg',
        axisX: { labelInterpolationFnc: value => String(value).toUpperCase() }
      }),
      SIZE
    );
    expect(labels(scene, 'x')).toEqual(['MON', 'TUE', 'WED']);
  });

  it('formats the axes of cartesianAxes()', () => {
    const scene = toScene(
      {
        data,
        axes: cartesianAxes({
          x: { type: stepAxis(), labelTransform: value => `[${value}]` },
          y: { type: autoScaleAxis() }
        }),
        layers: [line(), axisLabels({ labels: 'svg' })]
      },
      SIZE
    );
    expect(labels(scene, 'x')).toEqual(['[Mon]', '[Tue]', '[Wed]']);
  });

  it('formats pie labels, the new name first', () => {
    const scene = toScene(
      pieChartConfig(
        { labels: ['A', 'B'], series: [1, 2] },
        {
          labelInterpolationFnc: () => 'old',
          labelTransform: (label, index) => `${label} (${index})`
        }
      ),
      SIZE
    );
    expect(
      findAll(scene, { role: 'label' }).map(label => String(label.ctx.text))
    ).toEqual(['A (0)', 'B (1)']);
  });
});
