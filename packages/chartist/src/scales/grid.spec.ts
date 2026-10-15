import { markup } from '../../test/markup';
import { AutoScaleAxis } from '../axes/AutoScaleAxis';
import { axisUnits } from '../axes/Axis';
import { StepAxis } from '../axes/StepAxis';
import type {
  AxisOptions,
  ChartRect,
  OptionsWithDefaults
} from '../core/types';
import { normalizeData } from '../core/data/normalize';
import { EventEmitter } from '../event/EventEmitter';
import { domRenderer } from '../render/dom';
import { node } from '../scene/node';
import { Svg } from '../svg/Svg';
import type { NormalizedSeries } from '../core/types';
import { autoScaleAxis, fixedScaleAxis, stepAxis } from './factories';
import { axisNodes, gridBackground, type DrawnAxisOptions } from './grid';

const CLASS_NAMES = {
  grid: 'ct-grid',
  label: 'ct-label',
  horizontal: 'ct-horizontal',
  vertical: 'ct-vertical',
  start: 'ct-start',
  end: 'ct-end',
  gridGroup: 'ct-grids',
  labelGroup: 'ct-labels'
};
const area = { x1: 50, x2: 385, y1: 165, y2: 15, width: 335, height: 150 };
const padding = { top: 15, right: 15, bottom: 5, left: 10 };
const rect: ChartRect = {
  ...area,
  padding,
  width: () => area.width,
  height: () => area.height
};
const series = normalizeData(
  { labels: ['Mon', 'Tue', 'Wed'], series: [[1, 5, 3]] },
  false,
  true
).series as NormalizedSeries[];

function axisOptions(overrides: Partial<DrawnAxisOptions>): DrawnAxisOptions {
  return {
    offset: 30,
    position: 'end',
    labelOffset: { x: 0, y: 0 },
    showLabel: true,
    showGrid: true,
    labelInterpolationFnc: (v: unknown) => v as string,
    ...overrides
  };
}

function compareWith1x(axisX: DrawnAxisOptions, axisY: DrawnAxisOptions) {
  // 1.x: draw into Svg groups
  const legacyGrids = new Svg('g');
  const legacyLabels = new Svg('g');
  const options = {
    axisX,
    axisY,
    classNames: CLASS_NAMES
  } as unknown as OptionsWithDefaults;
  const emitter = new EventEmitter();
  new StepAxis(
    axisUnits.x,
    series,
    rect,
    axisX as AxisOptions
  ).createGridAndLabels(legacyGrids, legacyLabels, options, emitter);
  new AutoScaleAxis(
    axisUnits.y,
    series,
    rect,
    axisY as AxisOptions
  ).createGridAndLabels(legacyGrids, legacyLabels, options, emitter);

  // v2: nodes, rendered with the DOM renderer
  const frame = { area, padding, axisX, axisY, classNames: CLASS_NAMES };
  const x = axisNodes(
    stepAxis().create({
      dimension: 'x',
      series,
      labels: [],
      area,
      options: axisX
    }),
    frame
  );
  const y = axisNodes(
    autoScaleAxis().create({
      dimension: 'y',
      series,
      labels: [],
      area,
      options: axisY
    }),
    frame
  );
  const grids = [...x.grids, ...y.grids].reduce(
    (g, n) => g.append(n),
    node('g')
  );
  const labels = [...x.labels, ...y.labels].reduce(
    (g, n) => g.append(n),
    node('g')
  );
  const { svg } = domRenderer().render(
    node('svg').append(grids).append(labels),
    document.createElement('div')
  );
  expect(markup(svg.children[0])).toBe(markup(legacyGrids.getNode()));
  expect(markup(svg.children[1])).toBe(markup(legacyLabels.getNode()));
}

describe('scales/grid matches 1.x createGridAndLabels', () => {
  it('default positions', () => {
    compareWith1x(
      axisOptions({ ticks: ['Mon', 'Tue', 'Wed'] }),
      axisOptions({ offset: 40, position: 'start' })
    );
  });

  it('x at start, y at end, label offsets, stretch', () => {
    compareWith1x(
      axisOptions({
        position: 'start',
        labelOffset: { x: 3, y: 4 },
        ticks: ['a', 'b'],
        stretch: true
      }),
      axisOptions({ offset: 40, position: 'end', labelOffset: { x: -2, y: 7 } })
    );
  });

  it('labelInterpolationFnc, hidden labels and grids, skipped falsy labels', () => {
    compareWith1x(
      axisOptions({
        ticks: ['Mon', 'Tue', 'Wed'],
        labelInterpolationFnc: (v: unknown, i: number) =>
          i === 1 ? null : `#${v}`
      } as Partial<DrawnAxisOptions>),
      axisOptions({ offset: 40, position: 'start', showGrid: false })
    );
    compareWith1x(
      axisOptions({ ticks: ['Mon'], showLabel: false }),
      axisOptions({ offset: 40, position: 'start', onlyInteger: true })
    );
  });

  it('nodes carry roles and context', () => {
    const axisX = axisOptions({ ticks: ['a', 'b'] });
    const frame = {
      area,
      padding,
      axisX,
      axisY: axisOptions({}),
      classNames: CLASS_NAMES
    };
    const axis = stepAxis().create({
      dimension: 'x',
      series,
      labels: [],
      area,
      options: axisX
    });
    const { grids, labels } = axisNodes(axis, frame);
    expect(
      grids.map(g => [
        g.role,
        g.role === 'grid' && g.ctx.index,
        g.role === 'grid' && g.ctx.axis
      ])
    ).toEqual([
      ['grid', 0, axis],
      ['grid', 1, axis]
    ]);
    expect(
      labels.map(l => [
        l.role,
        l.role === 'label' && l.ctx.kind === 'axis' && l.ctx.text
      ])
    ).toEqual([
      ['label', 'a'],
      ['label', 'b']
    ]);
  });

  it('a next tick at position 0 sizes the label before it (#1471)', () => {
    const axisX = axisOptions({ ticks: [0, 10, 20, 30] });
    const data = normalizeData(
      {
        series: [
          [
            { x: 10, y: 1 },
            { x: 30, y: 2 }
          ]
        ]
      },
      false,
      true
    ).series as NormalizedSeries[];
    const frame = {
      area,
      padding,
      axisX,
      axisY: axisOptions({}),
      classNames: CLASS_NAMES
    };
    const axis = fixedScaleAxis().create({
      dimension: 'x',
      series: data,
      labels: [],
      area,
      options: axisX
    });
    expect(axis.ticks.map((tick, i) => axis.project(tick, i))).toEqual([
      -area.width / 2,
      0,
      area.width / 2,
      area.width
    ]);
    const { labels } = axisNodes(axis, frame);
    const widths = labels.map(label => label.attrs?.width);
    expect(widths.slice(0, 3)).toEqual([
      area.width / 2,
      area.width / 2,
      area.width / 2
    ]);
  });

  it('gridBackground matches 1.x createGridBackground geometry', () => {
    const background = gridBackground(area, 'ct-grid-background');
    expect(background.attrs).toEqual({ x: 50, y: 15, width: 335, height: 150 });
    expect(background.role).toBe('gridBackground');
  });
});
