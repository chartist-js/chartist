import {
  autoScaleAxis,
  bar,
  cartesianAxes,
  findAll,
  line,
  stepAxis,
  type AxisDefinition,
  type Layer
} from 'chartist';
import { run as runChart } from '../test/run.ts';
import { targetLine, type TargetLineOptions } from './targetLine.ts';

const ticks = ['a', 'b', 'c'];
const lineAxes: AxisDefinition[] = [
  { id: 'x', side: 'bottom', type: stepAxis(), ticks },
  { id: 'y', side: 'left', type: autoScaleAxis(), low: 0 }
];

function run(
  layers: Layer[],
  definitions: readonly AxisDefinition[] = lineAxes,
  series: unknown[] = [[200, 800, 500]]
) {
  return runChart(layers, definitions, { labels: ticks, series });
}

function draw(
  options: TargetLineOptions | TargetLineOptions[],
  definitions = lineAxes
) {
  const targets = (Array.isArray(options) ? options : [options]).map(
    targetLine
  );
  const result = run([line(), ...targets], definitions);
  return {
    ...result,
    lines: findAll(result.scene, { role: 'targetLine' }),
    labels: findAll(result.scene, { role: 'targetLabel' })
  };
}

describe('targetLine', () => {
  it('draws one labeled line and widens its axis to include it', () => {
    const { lines, labels, layout, axes } = draw({
      value: 1000,
      label: 'Target'
    });
    const { area } = layout;
    expect(axes.y!.range!.max).toBeGreaterThanOrEqual(1000);
    expect(lines).toHaveLength(1);
    const [target] = lines;
    expect(target.name).toBe('line');
    expect(target.classes).toEqual(['ct-target-line']);
    const y = area.y1 - axes.y!.project(1000);
    expect(target.attrs).toEqual({ x1: area.x1, y1: y, x2: area.x2, y2: y });
    expect(target.ctx).toMatchObject({
      axis: axes.y,
      value: 1000,
      label: 'Target',
      x1: area.x1,
      y1: y
    });

    expect(labels).toHaveLength(1);
    const [label] = labels;
    expect(label.name).toBe('text');
    expect(label.classes).toEqual(['ct-target-label']);
    expect(label.content).toBe('Target');
    // At the right end, just above the line, inside the chart area.
    expect(label.attrs['text-anchor']).toBe('end');
    expect(label.attrs.x).toBeLessThan(area.x2);
    expect(label.attrs.x).toBeGreaterThan(area.x2 - 10);
    expect(label.attrs.y).toBeLessThan(y);
    expect(label.attrs.y).toBeGreaterThan(y - 10);
    expect(label.ctx).toMatchObject({
      value: 1000,
      text: 'Target',
      x: label.attrs.x,
      y: label.attrs.y
    });
  });

  it('puts the label at the start with labelPosition start', () => {
    const { labels, layout } = draw({
      value: 400,
      label: 'Avg',
      labelPosition: 'start'
    });
    expect(labels[0].attrs['text-anchor']).toBe('start');
    expect(labels[0].attrs.x).toBeGreaterThan(layout.area.x1);
    expect(labels[0].attrs.x).toBeLessThan(layout.area.x1 + 10);
  });

  it('draws several lines as several layers, in order, with their classes', () => {
    const { lines, labels } = draw([
      { value: 20, label: 'Min' },
      { value: 80, label: 'Max', className: 'ct-series-b' }
    ]);
    expect(lines.map(l => l.ctx.value)).toEqual([20, 80]);
    expect(lines[1].classes).toEqual(['ct-target-line', 'ct-series-b']);
    expect(labels.map(l => l.content)).toEqual(['Min', 'Max']);
    expect(labels[1].classes).toEqual(['ct-target-label', 'ct-series-b']);
  });

  it('draws a vertical line on an X axis', () => {
    const horizontalBars: AxisDefinition[] = [
      { id: 'value', side: 'bottom', type: autoScaleAxis(), low: 0 },
      { id: 'label', side: 'left', type: stepAxis(), ticks }
    ];
    const result = runChart(
      [
        bar({ horizontalBars: true }),
        targetLine({ axis: 'value', value: 50, label: 'Half' })
      ],
      cartesianAxes(horizontalBars, {
        normalize: { multi: 'x', distributed: true }
      }),
      { labels: ticks, series: [[20, 40, 30]] }
    );
    const { area } = result.layout;
    const valueAxis = result.axes.x!;
    expect(valueAxis.range!.max).toBeGreaterThanOrEqual(50);
    const [target] = findAll(result.scene, { role: 'targetLine' });
    const x = area.x1 + valueAxis.project(50);
    expect(target.attrs).toEqual({ x1: x, y1: area.y2, x2: x, y2: area.y1 });
    // The label sits just right of the line, at its top.
    const [label] = findAll(result.scene, { role: 'targetLabel' });
    expect(label.attrs['text-anchor']).toBe('start');
    expect(label.attrs.x).toBeGreaterThan(x);
    expect(label.attrs.y).toBeGreaterThan(area.y2);
    expect(label.attrs.y).toBeLessThan(area.y2 + 20);
  });

  it('places a value on a step axis by index', () => {
    const { lines, layout, axes } = draw({ axis: 'x', value: 1 });
    const x = layout.area.x1 + axes.x!.project('b', 1);
    expect(lines[0].attrs).toMatchObject({ x1: x, x2: x });
  });

  it('draws on the axis it names, and widens only that one', () => {
    const twoY: AxisDefinition[] = [
      ...lineAxes,
      { id: 'pct', side: 'right', type: autoScaleAxis(), low: 0 }
    ];
    const result = run(
      [
        line({ y: 'y' }),
        line({ y: 'pct', series: [1] }),
        targetLine({ axis: 'pct', value: 1 })
      ],
      twoY,
      [
        [200, 800, 500],
        [0.2, 0.5, 0.4]
      ]
    );
    const [pct, y] = [
      result.axes.all!.find(a => a.id === 'pct')!,
      result.axes.all!.find(a => a.id === 'y')!
    ];
    expect(pct.range!.max).toBeGreaterThanOrEqual(1);
    expect(pct.range!.max).toBeLessThan(2);
    expect(y.range!.max).toBeLessThan(1000);
    const [target] = findAll(result.scene, { role: 'targetLine' });
    expect(target.ctx.axis).toBe(pct);
    expect(target.attrs.y1).toBe(result.layout.area.y1 - pct.project(1));
  });

  it("skips values outside the axis's own low and high", () => {
    const capped: AxisDefinition[] = [
      lineAxes[0],
      { id: 'y', side: 'left', type: autoScaleAxis(), low: 0, high: 900 }
    ];
    const { lines, labels, axes } = draw(
      [
        { value: 500, label: 'In' },
        { value: 1000, label: 'Out' }
      ],
      capped
    );
    expect(axes.y!.range!.max).toBe(900);
    expect(lines.map(l => l.ctx.value)).toEqual([500]);
    expect(labels.map(l => l.content)).toEqual(['In']);
  });

  it('draws no label without one', () => {
    const { lines, labels } = draw({ value: 300 });
    expect(lines).toHaveLength(1);
    expect(lines[0].ctx.label).toBeUndefined();
    expect(labels).toHaveLength(0);
  });

  it('replaces its classes with classNames', () => {
    const { lines, labels } = draw({
      value: 300,
      label: 'L',
      classNames: { line: 'goal', label: 'goal-label' }
    });
    expect(lines[0].classes).toEqual(['goal']);
    expect(labels[0].classes).toEqual(['goal-label']);
  });

  it('throws for an unknown axis, naming the layer and the id', () => {
    expect(() => draw({ axis: 'nope', value: 1 })).toThrow(
      'Chartist: unknown axis "nope" in layer "targetLine"'
    );
  });

  it('throws without a value', () => {
    expect(() => targetLine({} as never)).toThrow(
      'Layer "targetLine" needs a value'
    );
  });

  it('supports only cartesian coordinates and draws no series', () => {
    const layer = targetLine({ value: 1 });
    expect(layer.coordinates).toEqual(['cartesian']);
    expect(layer.series).toEqual([]);
  });
});
