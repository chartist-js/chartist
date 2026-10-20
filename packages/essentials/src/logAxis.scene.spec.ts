// @vitest-environment node
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  band,
  bar,
  barChartConfig,
  cartesianAxes,
  findAll,
  line,
  lineChartConfig,
  stepAxis,
  toScene,
  type Area,
  type ChartAxes,
  type ChartConfig,
  type Layer
} from 'chartist';
import { targetLine, trendLine } from './index.ts';
import { renderToString } from 'chartist/server';
import { logAxis } from './logAxis.ts';

const SIZE = { width: 600, height: 400 };

/** The scene of a chart, with its drawing area and axes. */
function draw(config: ChartConfig) {
  let area: Area | undefined;
  let axes: ChartAxes | undefined;
  const probe: Layer = {
    type: 'probe',
    coordinates: ['cartesian'],
    series: [],
    compose: context => {
      area = context.area;
      axes = context.axes;
      return [];
    }
  };
  const scene = toScene(
    { ...config, layers: [...(config.layers ?? []), probe] },
    SIZE
  );
  return { scene, area: area!, axes: axes! };
}

const lineOn = (
  series: (number | null)[][],
  axisY: object = {},
  options: object = {}
) =>
  draw(
    lineChartConfig(
      { labels: series[0].map((_, i) => `${i}`), series },
      { axisY: { type: logAxis(), ...axisY }, ...options }
    )
  );

describe('logAxis in charts', () => {
  it('is the Y axis of a line chart', () => {
    const { scene, axes } = lineOn([[120, 4100, 850_000]]);
    expect(axes.y!.kind).toBe('log');
    expect(axes.y!.range).toEqual({ min: 100, max: 1_000_000 });
    const grids = findAll(scene, { role: 'grid' }).filter(
      grid => grid.ctx.axis.dimension === 'y'
    );
    expect(grids).toHaveLength(5);
    const ys = grids.map(grid => grid.attrs.y1 as number);
    ys.slice(1).forEach((y, i) => expect(ys[i] - y).toBeCloseTo(ys[0] - ys[1]));
  });

  it('puts zero and negative values on the bottom edge', () => {
    const { scene, area, axes } = lineOn([[0, -5, 10, 1000]]);
    expect(axes.y!.range).toEqual({ min: 10, max: 1000 });
    const points = findAll(scene, { role: 'point' });
    expect(points[0].attrs.y1).toBeCloseTo(area.y1);
    expect(points[1].attrs.y1).toBeCloseTo(area.y1);
    expect(points[2].attrs.y1).toBeCloseTo(area.y1);
    expect(points[3].attrs.y1).toBeCloseTo(area.y2);
  });

  it('keeps holes as gaps', () => {
    const { scene } = lineOn([[10, null, 1000]]);
    expect(findAll(scene, { role: 'point' })).toHaveLength(2);
  });

  it('closes areas at the bottom edge', () => {
    const { scene, area } = lineOn([[10, 300, 1000]], {}, { showArea: true });
    const [path] = findAll(scene, { role: 'area' });
    const ys = String(path.attrs.d)
      .split(/[MLCZ ,]+/)
      .filter(Boolean)
      .map(Number)
      .filter((_, i) => i % 2 === 1);
    expect(Math.max(...ys)).toBeCloseTo(area.y1);
  });

  it('formats labels with labelTransform', () => {
    const { scene } = lineOn([[100, 10_000]], {
      labelTransform: (value: number) => value.toLocaleString('en-US')
    });
    const texts = findAll(scene, { role: 'label' })
      .filter(
        label => label.ctx.kind === 'axis' && label.ctx.axis.dimension === 'y'
      )
      .map(label => label.ctx.kind === 'axis' && label.ctx.text);
    expect(texts).toEqual(['100', '1,000', '10,000']);
  });

  it('draws minor grid lines without labels', () => {
    const { scene } = lineOn([[1, 100]], {
      type: logAxis({ minorTicks: true })
    });
    const grids = findAll(scene, { role: 'grid' }).filter(
      grid => grid.ctx.axis.dimension === 'y'
    );
    const minor = grids.filter(grid => grid.ctx.minor);
    expect(minor).toHaveLength(16);
    expect(minor.every(grid => grid.classes.includes('ct-grid-minor'))).toBe(
      true
    );
    expect(grids.filter(grid => !grid.ctx.minor)).toHaveLength(3);
    const labels = findAll(scene, { role: 'label' }).filter(
      label => label.ctx.kind === 'axis' && label.ctx.axis.dimension === 'y'
    );
    expect(labels).toHaveLength(3);
  });

  it('grows bars from the bottom edge, with the reference value 0 (#64)', () => {
    const { scene, area } = draw(
      barChartConfig(
        { labels: ['a', 'b', 'c'], series: [[10, 1000, 0]] },
        { axisY: { type: logAxis(), low: 1 } }
      )
    );
    const bars = findAll(scene, { role: 'bar' });
    const lengths = bars.map(b => {
      expect(b.attrs.y1).toBeCloseTo(area.y1);
      return (b.attrs.y1 as number) - (b.attrs.y2 as number);
    });
    expect(lengths[1] / lengths[0]).toBeCloseTo(3);
    expect(lengths[2]).toBeCloseTo(0);
  });

  it('draws a straight trend line through exponential growth', () => {
    const { scene } = lineOn(
      [[1, 10, 100, 1000]],
      {},
      {
        layers: { above: [trendLine()] }
      }
    );
    const [trend] = findAll(scene, { role: 'trendLine' });
    const points = findAll(scene, { role: 'point' });
    expect(trend.ctx.slope).toBeCloseTo(1);
    expect(trend.attrs.y1).toBeCloseTo(points[0].attrs.y1 as number);
    expect(trend.attrs.y2).toBeCloseTo(points[3].attrs.y1 as number);
    // The middle points lie on the line too.
    const at = (x: number) =>
      (trend.attrs.y1 as number) +
      (((trend.attrs.y2 as number) - (trend.attrs.y1 as number)) *
        (x - (trend.attrs.x1 as number))) /
        ((trend.attrs.x2 as number) - (trend.attrs.x1 as number));
    for (const point of points.slice(1, 3)) {
      expect(point.attrs.y1).toBeCloseTo(at(point.attrs.x1 as number));
    }
  });

  it('places band edges by value, and marks by value', () => {
    const { scene, area, axes } = lineOn(
      [[5, 50, 500]],
      {},
      {
        layers: { below: [band({ low: 10, high: 100, mark: true })] }
      }
    );
    const [edge] = findAll(scene, { role: 'band' });
    const ys = String(edge.attrs.d)
      .split(/[MLCZ ,]+/)
      .filter(Boolean)
      .map(Number)
      .filter((_, i) => i % 2 === 1);
    expect(Math.max(...ys)).toBeCloseTo(area.y1 - axes.y!.project(10));
    expect(Math.min(...ys)).toBeCloseTo(area.y1 - axes.y!.project(100));
    const marks = findAll(scene, { role: 'point' }).map(point =>
      point.classes.includes('ct-in-band')
    );
    expect(marks).toEqual([false, true, false]);
  });

  it('puts a target line at its value, and one at zero on the bottom edge', () => {
    const { scene, area, axes } = lineOn(
      [[10, 1000]],
      {},
      {
        layers: {
          above: [targetLine({ value: 100 }), targetLine({ value: 0 })]
        }
      }
    );
    const lines = findAll(scene, { role: 'targetLine' });
    expect(lines[0].attrs.y1).toBeCloseTo(area.y1 - axes.y!.project(100));
    expect(lines[1].attrs.y1).toBeCloseTo(area.y1);
  });

  it('draws a log-log chart in a composed chart', () => {
    const { scene, area } = draw({
      data: {
        series: [
          [
            { x: 1, y: 2 },
            { x: 10, y: 20 },
            { x: 100, y: 200 }
          ]
        ]
      },
      axes: cartesianAxes([
        { id: 'x', side: 'bottom', type: logAxis() },
        { id: 'y', side: 'left', type: logAxis() }
      ]),
      layers: [axisGrid(), line(), axisLabels()]
    });
    const points = findAll(scene, { role: 'point' });
    // Evenly spaced on both axes: a power law is a straight line.
    const xs = points.map(point => (point.attrs.x1 as number) - area.x1);
    expect(xs[2] - xs[1]).toBeCloseTo(xs[1] - xs[0]);
    expect(xs[0]).toBeCloseTo(0);
    const ys = points.map(point => point.attrs.y1 as number);
    expect(ys[1] - ys[2]).toBeCloseTo(ys[0] - ys[1]);
  });

  it('works next to a linear axis, each over its own series', () => {
    const { axes } = draw({
      data: {
        labels: ['a', 'b', 'c'],
        series: [
          { name: 'count', data: [3, 5, 4] },
          { name: 'reach', data: [20, 3000, 90_000] }
        ]
      },
      axes: cartesianAxes([
        { id: 'x', side: 'bottom', type: stepAxis() },
        { id: 'count', side: 'left', type: autoScaleAxis() },
        { id: 'reach', side: 'right', type: logAxis() }
      ]),
      layers: [
        axisGrid(),
        bar({ series: ['count'], y: 'count' }),
        line({ series: ['reach'], y: 'reach' }),
        axisLabels()
      ]
    });
    const count = axes.all!.find(axis => axis.id === 'count')!;
    const reach = axes.all!.find(axis => axis.id === 'reach')!;
    expect(count.kind).toBe('autoScale');
    expect(count.range!.max).toBeLessThan(10);
    expect(reach.kind).toBe('log');
    expect(reach.range).toEqual({ min: 10, max: 100_000 });
  });
});

describe('logAxis on the server', () => {
  it('gives the same output twice, and a grid line per tick', () => {
    const config = () =>
      lineChartConfig(
        { labels: ['a', 'b', 'c'], series: [[3, 300, 30_000]] },
        { axisY: { type: logAxis({ minorTicks: true }) } }
      );
    const first = toScene(config(), SIZE);
    const markup = renderToString(first);
    expect(renderToString(toScene(config(), SIZE))).toBe(markup);
    const major = markup.match(/class="ct-grid ct-vertical"/g) ?? [];
    const minor =
      markup.match(/class="ct-grid ct-vertical ct-grid-minor"/g) ?? [];
    expect(major).toHaveLength(6);
    expect(minor).toHaveLength(40);
  });
});
