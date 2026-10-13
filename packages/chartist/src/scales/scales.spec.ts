import { AutoScaleAxis } from '../axes/AutoScaleAxis';
import { axisUnits, Axis } from '../axes/Axis';
import { FixedScaleAxis } from '../axes/FixedScaleAxis';
import { StepAxis } from '../axes/StepAxis';
import { createChartRect } from '../core/creation';
import { normalizeData } from '../core/data/normalize';
import type { AxisOptions, ChartRect, NormalizedSeries } from '../core/types';
import { Svg } from '../svg/Svg';
import { axisArea, type AxesConfig } from './axis';
import { autoScaleAxis, fixedScaleAxis, stepAxis } from './factories';
import { isLegacyAxisClass, legacyAxis } from './legacy';

const PADDING = { top: 15, right: 15, bottom: 5, left: 10 };

describe('scales/axisArea', () => {
  function legacyRect(width: number, height: number, axes: AxesConfig) {
    const svg = new Svg('svg');
    vi.spyOn(svg, 'width').mockReturnValue(width);
    vi.spyOn(svg, 'height').mockReturnValue(height);
    return createChartRect(svg, {
      chartPadding: PADDING,
      axisX: axes.x as AxisOptions,
      axisY: axes.y as AxisOptions
    });
  }

  it.each([
    [
      'end/start defaults',
      400,
      300,
      {
        x: { offset: 30, position: 'end' },
        y: { offset: 40, position: 'start' }
      }
    ],
    [
      'x start, y end',
      400,
      300,
      {
        x: { offset: 30, position: 'start' },
        y: { offset: 40, position: 'end' }
      }
    ],
    ['no offsets', 200, 100, { x: { offset: 0 }, y: { offset: 0 } }],
    [
      'too small',
      20,
      10,
      {
        x: { offset: 30, position: 'end' },
        y: { offset: 40, position: 'start' }
      }
    ]
  ] as [string, number, number, AxesConfig][])(
    '%s matches createChartRect',
    (_name, w, h, axes) => {
      const rect = legacyRect(w, h, axes);
      const { area } = axisArea(w, h, PADDING, axes);
      expect(area).toEqual({
        x1: rect.x1,
        x2: rect.x2,
        y1: rect.y1,
        y2: rect.y2,
        width: rect.width(),
        height: rect.height()
      });
    }
  );
});

describe('scales/factories match the 1.x axis classes', () => {
  const area = { x1: 50, x2: 450, y1: 270, y2: 15, width: 400, height: 255 };
  const rect: ChartRect = {
    ...area,
    padding: PADDING,
    width: () => 400,
    height: () => 255
  };
  const series = normalizeData(
    {
      series: [
        [
          { x: 1, y: 2 },
          { x: 4, y: 9.5 },
          { x: 7, y: -3 }
        ],
        [5, 1]
      ]
    },
    false,
    true
  ).series as NormalizedSeries[];

  function compare(
    LegacyClass: new (...args: never[]) => Axis,
    factory: ReturnType<typeof stepAxis>,
    dimension: 'x' | 'y',
    options: AxisOptions
  ) {
    const legacy = new (LegacyClass as unknown as new (
      ...args: unknown[]
    ) => Axis)(axisUnits[dimension], series, rect, options) as unknown as {
      ticks: unknown[];
      range?: unknown;
      projectValue: Axis['projectValue'];
    };
    const axis = factory.create({
      dimension,
      series,
      labels: [],
      area,
      options
    });
    expect(axis.ticks).toEqual(legacy.ticks);
    expect(axis.range).toEqual(legacy.range);
    for (const [index, value] of [
      { x: 1, y: 2 },
      { x: 4, y: 9.5 },
      { x: 7, y: -3 },
      3
    ].entries()) {
      expect(axis.project(value as never, index)).toBe(
        legacy.projectValue(value as never, index)
      );
    }
  }

  it.each([
    [{ ticks: ['a', 'b', 'c'] }],
    [{ ticks: ['a', 'b', 'c'], stretch: true }],
    [{ ticks: [] }]
  ])('stepAxis %j', options => {
    compare(StepAxis, stepAxis(), 'x', options as AxisOptions);
  });

  it.each([
    [{}],
    [{ onlyInteger: true }],
    [{ low: 0, high: 20 }],
    [{ scaleMinSpace: 50 }],
    [{ highLow: { low: -10, high: 10 } }]
  ])('autoScaleAxis %j (x and y)', options => {
    compare(AutoScaleAxis, autoScaleAxis(), 'y', options as AxisOptions);
    compare(AutoScaleAxis, autoScaleAxis(), 'x', options as AxisOptions);
  });

  it.each([
    [{}],
    [{ divisor: 4 }],
    [{ ticks: [10, 0, 5] }],
    [{ low: 0, high: 10, divisor: 5 }]
  ])('fixedScaleAxis %j (x and y)', options => {
    compare(FixedScaleAxis, fixedScaleAxis(), 'x', options as AxisOptions);
    compare(FixedScaleAxis, fixedScaleAxis(), 'y', options as AxisOptions);
  });

  it('legacyAxis wraps the 1.x classes and custom subclasses', () => {
    for (const LegacyClass of [StepAxis, AutoScaleAxis, FixedScaleAxis]) {
      expect(isLegacyAxisClass(LegacyClass)).toBe(true);
    }
    compare(AutoScaleAxis, legacyAxis(AutoScaleAxis), 'y', {
      onlyInteger: true
    });
    compare(FixedScaleAxis, legacyAxis(FixedScaleAxis), 'x', { divisor: 3 });

    class DoubleAxis extends FixedScaleAxis {
      override projectValue(value: never) {
        return super.projectValue(value) * 2;
      }
    }
    const axis = legacyAxis(DoubleAxis).create({
      dimension: 'y',
      series,
      labels: [],
      area,
      options: { ticks: [0, 10] }
    });
    expect(axis.project({ x: 0, y: 5 } as never)).toBe(
      new FixedScaleAxis(axisUnits.y, series, rect, {
        ticks: [0, 10]
      }).projectValue({ x: 0, y: 5 } as never) * 2
    );
  });

  it('factories are not legacy classes', () => {
    expect(isLegacyAxisClass(stepAxis())).toBe(false);
    expect(isLegacyAxisClass(() => 1)).toBe(false);
  });
});
