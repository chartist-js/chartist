import { estimateText } from '../render/measure';
import { createPhaseEmitter } from '../pipeline/emitter';
import { runPipeline } from '../pipeline/phases';
import type { Layer } from '../pipeline/types';
import type { AxisDefinition } from '../scales/axis';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { findAll } from '../scene/tree';
import { line } from './line';
import { trendLine } from './trendLine';
import { logScale } from '../../test/logScale';

const stepAxes = (count: number): AxisDefinition[] => [
  {
    id: 'x',
    side: 'bottom',
    type: stepAxis(),
    ticks: Array.from({ length: count }, (_, i) => `${i}`)
  },
  { id: 'y', side: 'left', type: autoScaleAxis() }
];

function run(
  series: unknown[],
  layers: Layer[] = [line(), trendLine()],
  definitions: readonly AxisDefinition[] = stepAxes(
    Math.max(
      ...series
        .map(s => (Array.isArray(s) ? s : (s as { data: [] }).data))
        .map(values => values.length)
    )
  )
) {
  const result = runPipeline(
    createPhaseEmitter(),
    { data: { series }, axes: cartesianAxes(definitions), layers },
    { width: 400, height: 200, measureText: estimateText }
  );
  return { ...result, lines: findAll(result.scene, { role: 'trendLine' }) };
}

describe('layers/trendLine', () => {
  it('fits a rising series and draws it from the first to the last index', () => {
    const { lines, axes, layout, scene } = run([[1, 2, 4, 3, 5]]);
    const { area } = layout;
    expect(lines).toHaveLength(1);
    const [trend] = lines;
    expect(trend.name).toBe('line');
    expect(trend.classes).toEqual(['ct-trend-line']);
    expect(trend.ctx.seriesIndex).toBe(0);
    expect(trend.ctx.slope).toBeCloseTo(0.9);
    expect(trend.ctx.intercept).toBeCloseTo(1.2);
    // Pearson's r of 1, 2, 4, 3, 5 against 0 to 4.
    expect(trend.ctx.correlation).toBeCloseTo(0.9);

    const x = axes.x!;
    const y = axes.y!;
    expect(trend.attrs.x1).toBeCloseTo(area.x1 + x.project(0, 0));
    expect(trend.attrs.x2).toBeCloseTo(area.x1 + x.project(4, 4));
    expect(trend.attrs.y1).toBeCloseTo(area.y1 - y.project(1.2));
    expect(trend.attrs.y2).toBeCloseTo(area.y1 - y.project(4.8));
    expect(trend.ctx).toMatchObject(trend.attrs);

    // In a series group of its own, with the series' classes.
    const groups = findAll(scene, { role: 'series' });
    const group = groups.find(g => g.children.includes(trend))!;
    expect(group.classes).toEqual(['ct-series', 'ct-series-a']);
    expect(group.ctx.seriesIndex).toBe(0);
  });

  it('widens the Y axis to the fitted ends outside the values', () => {
    // [0, 0, 10] fits to -1.67 at the start, below the smallest value.
    const { lines, axes } = run([[0, 0, 10]]);
    expect(lines[0].ctx.slope).toBeCloseTo(5);
    expect(lines[0].ctx.intercept).toBeCloseTo(-5 / 3);
    expect(axes.y!.range!.min).toBeLessThanOrEqual(-5 / 3);

    const withoutTrend = run([[0, 0, 10]], [line()]);
    expect(withoutTrend.axes.y!.range!.min).toBeGreaterThan(-5 / 3);
  });

  it('draws nothing for a series with one value and holes', () => {
    const { lines } = run([
      [null, 3, null, undefined],
      [1, 2, 3, 4]
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].ctx.seriesIndex).toBe(1);
  });

  it('skips holes in the fit', () => {
    const { lines } = run([[1, null, 3, null, 5]]);
    expect(lines[0].ctx.slope).toBeCloseTo(1);
    expect(lines[0].ctx.intercept).toBeCloseTo(1);
  });

  it('draws nothing when all values share one X', () => {
    const definitions: AxisDefinition[] = [
      { id: 'x', side: 'bottom', type: autoScaleAxis() },
      { id: 'y', side: 'left', type: autoScaleAxis() }
    ];
    const { lines } = run(
      [
        [
          { x: 2, y: 1 },
          { x: 2, y: 5 }
        ]
      ],
      [line(), trendLine()],
      definitions
    );
    expect(lines).toHaveLength(0);
  });

  it('fits by value.x on a scale axis, from the smallest to the largest x', () => {
    const definitions: AxisDefinition[] = [
      { id: 'x', side: 'bottom', type: autoScaleAxis() },
      { id: 'y', side: 'left', type: autoScaleAxis() }
    ];
    const { lines, axes, layout } = run(
      [
        [
          { x: 10, y: 3 },
          { x: 0, y: 1 },
          { x: 20, y: 5 }
        ]
      ],
      [line(), trendLine()],
      definitions
    );
    const [trend] = lines;
    expect(trend.ctx.slope).toBeCloseTo(0.2);
    expect(trend.ctx.intercept).toBeCloseTo(1);
    expect(trend.attrs.x1).toBeCloseTo(layout.area.x1 + axes.x!.project(0));
    expect(trend.attrs.x2).toBeCloseTo(layout.area.x1 + axes.x!.project(20));
  });

  it('centers its ends in their steps with align center', () => {
    const start = run([[1, 2, 3]]).lines[0];
    const { lines, axes } = run(
      [[1, 2, 3]],
      [line(), trendLine({ align: 'center' })]
    );
    const shift = axes.x!.step! / 2;
    expect(lines[0].attrs.x1).toBeCloseTo(start.attrs.x1 + shift);
    expect(lines[0].attrs.x2).toBeCloseTo(start.attrs.x2 + shift);
    expect(lines[0].attrs.y1).toBeCloseTo(start.attrs.y1);
  });

  it('selects series by name and keeps their chart-wide classes', () => {
    const { lines, scene } = run(
      [
        { name: 'visits', data: [3, 2, 1] },
        { name: 'sales', data: [1, 2, 3] },
        { name: 'returns', className: 'my-returns', data: [1, 1, 2] }
      ],
      [line(), trendLine({ series: ['sales', 'returns'] })]
    );
    expect(lines.map(l => l.ctx.seriesIndex)).toEqual([1, 2]);
    const groups = findAll(scene, { role: 'series' }).filter(g =>
      g.children.some(child => child.role === 'trendLine')
    );
    expect(groups.map(g => g.classes)).toEqual([
      ['ct-series', 'ct-series-b'],
      ['ct-series', 'my-returns']
    ]);
  });

  it('replaces its classes with classNames', () => {
    const { lines, scene } = run(
      [[1, 2, 3]],
      [
        line(),
        trendLine({ classNames: { series: 'my-series', line: 'my-trend' } })
      ]
    );
    expect(lines[0].classes).toEqual(['my-trend']);
    const group = findAll(scene, { role: 'series' }).find(g =>
      g.children.includes(lines[0])
    )!;
    expect(group.classes).toEqual(['my-series', 'my-series-a']);
  });

  it('draws on the axes it names', () => {
    const definitions: AxisDefinition[] = [
      ...stepAxes(3),
      { id: 'pct', side: 'right', type: autoScaleAxis() }
    ];
    const { lines, axes, layout } = run(
      [
        [1, 2, 3],
        [10, 50, 90]
      ],
      [
        line({ series: [0] }),
        line({ series: [1], y: 'pct' }),
        trendLine({ series: [1], y: 'pct' })
      ],
      definitions
    );
    const pct = axes.all!.find(axis => axis.id === 'pct')!;
    expect(lines[0].attrs.y2).toBeCloseTo(layout.area.y1 - pct.project(90));
  });

  it('supports only cartesian coordinates', () => {
    expect(trendLine().coordinates).toEqual(['cartesian']);
  });

  it('gives the correlation of the values, absent when they are all equal', () => {
    expect(run([[1, 2, 3, 4]]).lines[0].ctx.correlation).toBeCloseTo(1);
    expect(run([[8, 6, 4, 2]]).lines[0].ctx.correlation).toBeCloseTo(-1);
    const flat = run([[3, 3, 3]]).lines[0];
    expect(flat.ctx.slope).toBe(0);
    expect('correlation' in flat.ctx).toBe(false);
  });

  describe('on a log Y axis', () => {
    const logAxes = (count: number): AxisDefinition[] => [
      stepAxes(count)[0],
      { id: 'y', side: 'left', type: logScale(), low: 1, high: 1000 }
    ];

    it('fits an exponential trend, straight through the points', () => {
      const { lines, scene } = run([[1, 10, 100, 1000]], undefined, logAxes(4));
      const [trend] = lines;
      expect(trend.ctx.slope).toBeCloseTo(1);
      expect(trend.ctx.intercept).toBeCloseTo(0);
      expect(trend.ctx.correlation).toBeCloseTo(1);
      const points = findAll(scene, { role: 'point' });
      expect(trend.attrs.x1).toBeCloseTo(points[0].attrs.x1 as number);
      expect(trend.attrs.y1).toBeCloseTo(points[0].attrs.y1 as number);
      expect(trend.attrs.x2).toBeCloseTo(points[3].attrs.x1 as number);
      expect(trend.attrs.y2).toBeCloseTo(points[3].attrs.y1 as number);
    });

    it('leaves out values the axis has no place for', () => {
      const { lines } = run([[0, 10, 100, 1000]], undefined, logAxes(4));
      // log10 of 10, 100 and 1,000 at the indexes 1 to 3.
      expect(lines[0].ctx.slope).toBeCloseTo(1);
      expect(lines[0].ctx.intercept).toBeCloseTo(0);
    });

    it('reports its ends as values, so the axis can widen to them', () => {
      const layer = trendLine();
      const extent = layer.extent!({
        normalized: {
          labels: [],
          series: [[1, 10, 100].map(y => ({ x: undefined, y }))]
        },
        axes: { x: 'x', y: 'y' },
        transforms: { y: logScale().transform }
      } as never);
      expect(extent.y.low).toBeCloseTo(1);
      expect(extent.y.high).toBeCloseTo(100);
    });
  });
});
