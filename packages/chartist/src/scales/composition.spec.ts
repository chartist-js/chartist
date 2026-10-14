import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import type { Layer, LayerContext } from '../pipeline/types';
import { bar } from '../layers/bar';
import { line } from '../layers/line';
import { axisGrid, axisLabels, placeOnSide } from '../layers/axes';
import { findAll } from '../scene/tree';
import { axisArea } from './axis';
import { cartesianAxes } from './cartesian';
import { autoScaleAxis, stepAxis } from './factories';
import { axisNodes } from './grid';

const PADDING = { top: 15, right: 15, bottom: 5, left: 10 };
const data = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: 'revenue', data: [120, 150, 170, 210] },
    { name: 'margin', data: [0.12, 0.18, 0.15, 0.22] }
  ]
};
const axes = () =>
  cartesianAxes([
    {
      id: 'quarters',
      side: 'bottom',
      type: stepAxis(),
      ticks: ['Q1', 'Q2', 'Q3', 'Q4']
    },
    { id: 'revenue', side: 'left', type: autoScaleAxis() },
    { id: 'margin', side: 'right', type: autoScaleAxis() }
  ]);

function run(layers: Layer[], chartAxes = axes()) {
  return runPipeline(
    createPhaseEmitter(),
    { data, axes: chartAxes, layers },
    { width: 600, height: 300, measureText: estimateText }
  );
}

function probe(binding: Partial<Layer> = {}) {
  let context: LayerContext | undefined;
  const layer: Layer = {
    type: 'probe',
    coordinates: ['cartesian'],
    ...binding,
    compose: ctx => {
      context = ctx;
      return [];
    }
  };
  return { layer, context: () => context! };
}

describe('composition: axes', () => {
  it('the { x, y } shorthand computes the same area as before', () => {
    const shorthand = {
      x: { type: stepAxis(), offset: 30, position: 'end' as const },
      y: { type: autoScaleAxis(), offset: 40, position: 'start' as const }
    };
    const list = cartesianAxes(shorthand).definitions;
    expect(list.map(d => [d.id, d.side])).toEqual([
      ['x', 'bottom'],
      ['y', 'left']
    ]);
    expect(axisArea(600, 300, PADDING, list)).toEqual(
      axisArea(600, 300, PADDING, shorthand)
    );
  });

  it('stacks axes on one side and reserves their offsets', () => {
    const stacked = cartesianAxes([
      { id: 'a', side: 'left', type: autoScaleAxis(), offset: 40 },
      { id: 'b', side: 'left', type: autoScaleAxis(), offset: 30 },
      { id: 'x', side: 'bottom', type: stepAxis() }
    ]);
    const { area } = stacked.area(600, 300, PADDING);
    expect(area.x1).toBe(PADDING.left + 70);
    const { axes: created } = stacked.create(
      { labels: [], series: [{ values: [1] }] },
      area
    );
    expect(created.all!.map(a => [a.id, a.inset])).toEqual([
      ['a', 0],
      ['b', 40],
      ['x', 0]
    ]);
  });

  it('list-form axes get the 1.x default offsets', () => {
    expect(axes().definitions.map(d => d.offset)).toEqual([30, 40, 40]);
  });

  it('rejects duplicate ids and unknown bindings', () => {
    expect(() =>
      cartesianAxes([
        { id: 'a', side: 'left', type: autoScaleAxis() },
        { id: 'a', side: 'right', type: autoScaleAxis() }
      ])
    ).toThrow('the axis id "a" is used twice');
    expect(() => run([probe({ axes: { y: 'nope' } }).layer])).toThrow(
      'unknown axis "nope" in layer "probe"'
    );
  });

  it('each axis range covers only the series bound to it', () => {
    const revenue = probe({
      axes: { x: 'quarters', y: 'revenue' },
      series: ['revenue']
    });
    const margin = probe({ axes: { x: 'quarters', y: 'margin' }, series: [1] });
    run([revenue.layer, margin.layer]);
    expect(revenue.context().axes.y!.range!.max).toBeGreaterThanOrEqual(210);
    expect(margin.context().axes.y!.range!.max).toBeLessThan(1);
  });

  it('grid and label layers draw no series and do not widen axis ranges', () => {
    // The grid binds to the first Y axis by default; here that's margin.
    const marginFirst = cartesianAxes([
      {
        id: 'quarters',
        side: 'bottom',
        type: stepAxis(),
        ticks: ['Q1', 'Q2', 'Q3', 'Q4']
      },
      { id: 'margin', side: 'left', type: autoScaleAxis() },
      { id: 'revenue', side: 'right', type: autoScaleAxis() }
    ]);
    const margin = probe({ axes: { y: 'margin' }, series: ['margin'] });
    const revenue = probe({ axes: { y: 'revenue' }, series: ['revenue'] });
    run([axisGrid(), margin.layer, revenue.layer, axisLabels()], marginFirst);
    expect(margin.context().axes.y!.range!.max).toBeLessThan(1);
  });

  it('an axis no series layer is bound to uses all series', () => {
    const grid = probe({ axes: { y: 'margin' }, series: [] });
    run([grid.layer]);
    expect(grid.context().axes.y!.range!.max).toBeGreaterThanOrEqual(210);
  });

  it('layers get their series with chart-wide indexes', () => {
    const margin = probe({ series: ['margin'] });
    run([margin.layer]);
    expect(margin.context().seriesIndexes).toEqual([1]);
    expect(margin.context().data.series.map(s => s.name)).toEqual(['margin']);
    expect(() => run([probe({ series: ['nope'] }).layer])).toThrow(
      'unknown series "nope"'
    );
  });
});

describe('composition: layers', () => {
  it('bars and a line from one data set keep chart-wide classes and keys', () => {
    const { scene } = run([
      bar({ series: ['revenue'], x: 'quarters', y: 'revenue' }),
      line({ series: ['margin'], x: 'quarters', y: 'margin' })
    ]);
    const groups = findAll(scene, { role: 'series' });
    expect(groups.map(g => g.classes.join(' '))).toEqual([
      'ct-series ct-series-a',
      'ct-series ct-series-b'
    ]);
    expect(findAll(scene, { role: 'point' })[0].key).toBe('1/1/0');
    expect(findAll(scene, { role: 'bar' })).toHaveLength(4);
  });

  it('centered line points sit on the bar centers', () => {
    const { scene } = run([
      bar({ series: ['revenue'], x: 'quarters', y: 'revenue' }),
      line({ series: ['margin'], x: 'quarters', y: 'margin', align: 'center' })
    ]);
    const bars = findAll(scene, { role: 'bar' }).map(b => b.attrs.x1);
    const points = findAll(scene, { role: 'point' }).map(p => p.attrs.x1);
    expect(points).toEqual(bars);
  });

  it('axisGrid and axisLabels draw the named axes with 1.x classes', () => {
    const { scene } = run([
      axisGrid({ axes: ['quarters', 'revenue'] }),
      axisLabels()
    ]);
    const [grids, labels] = scene.children;
    expect(grids.classes).toEqual(['ct-grids']);
    expect(
      new Set(
        grids.children.map(n =>
          n.role === 'grid' && 'id' in n.ctx.axis ? n.ctx.axis.id : undefined
        )
      )
    ).toEqual(new Set(['quarters', 'revenue']));
    expect(labels.classes).toEqual(['ct-labels']);
    const sides = new Set(
      labels.children.map(n => n.children[0].classes.at(-1))
    );
    expect(sides).toEqual(new Set(['ct-end', 'ct-start']));
  });

  it('placed labels at inset 0 match the 1.x preset geometry', async () => {
    const { area } = axes().area(600, 300, PADDING);
    const { axes: created } = axes().create(
      {
        labels: data.labels,
        series: data.series.map(s => ({ name: s.name, values: s.data }))
      },
      area
    );
    const options = {
      offset: 40,
      position: 'start' as const,
      labelOffset: { x: 0, y: 0 },
      showLabel: true,
      showGrid: true,
      labelInterpolationFnc: (v: unknown) => v as never
    };
    const classNames = {
      grid: 'g',
      label: 'l',
      horizontal: 'h',
      vertical: 'v',
      start: 's',
      end: 'e'
    };
    const revenue = created.all!.find(a => a.id === 'revenue')!;
    const placed = axisNodes(revenue, {
      area,
      padding: PADDING,
      classNames,
      options,
      place: placeOnSide('left', 0),
      atStart: true
    });
    const preset = axisNodes(revenue, {
      area,
      padding: { ...PADDING, left: area.x1 - 40 },
      classNames,
      axisX: options,
      axisY: options
    });
    expect(placed.labels).toEqual(preset.labels);
    expect(placed.grids).toEqual(preset.grids);
  });
});
