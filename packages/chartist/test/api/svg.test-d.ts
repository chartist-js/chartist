import {
  AutoScaleAxis,
  FixedScaleAxis,
  Interpolation,
  LineChart,
  StepAxis,
  Svg,
  SvgList,
  SvgPath,
  easings,
  type AnimationDefinition,
  type AxisType,
  type LineInterpolation
} from 'chartist';

describe('Svg', () => {
  test('constructor and builder methods', () => {
    const svg = new Svg('svg', { width: 100 }, 'ct-chart');
    expectTypeOf(
      new Svg(document.createElementNS('', 'g'))
    ).toEqualTypeOf<Svg>();
    expectTypeOf(svg.elem('g', { x: 1 }, 'a', true)).toEqualTypeOf<Svg>();
    expectTypeOf(svg.attr({ x: 1, y: '2', z: undefined })).toEqualTypeOf<Svg>();
    expectTypeOf(svg.attr('x')).toEqualTypeOf<string | null>();
    expectTypeOf(svg.addClass('a b')).toEqualTypeOf<Svg>();
    expectTypeOf(svg.removeClass('a')).toEqualTypeOf<Svg>();
    expectTypeOf(svg.classes()).toEqualTypeOf<string[]>();
    expectTypeOf(svg.text('t')).toEqualTypeOf<Svg>();
    expectTypeOf(svg.empty()).toEqualTypeOf<Svg>();
    expectTypeOf(svg.append(svg)).toEqualTypeOf<Svg>();
    expectTypeOf(svg.replace(svg)).toEqualTypeOf<Svg>();
    expectTypeOf(svg.width()).toEqualTypeOf<number>();
    expectTypeOf(svg.querySelectorAll('g')).toEqualTypeOf<SvgList>();
  });

  test('animate takes SMIL definitions', () => {
    const definition: AnimationDefinition = {
      dur: 500,
      from: 0,
      to: 1,
      easing: 'easeOutQuint'
    };
    expectTypeOf(
      new Svg('line').animate({ x1: definition, y1: [definition] })
    ).toEqualTypeOf<Svg>();
    // @ts-expect-error dur, from and to are required
    new Svg('line').animate({ x1: { begin: 0 } });
    expectTypeOf(easings.easeOutQuint).toEqualTypeOf<number[]>();
  });
});

describe('SvgPath', () => {
  test('builder and transforms', () => {
    const path = new SvgPath().move(0, 0).line(10, 10).curve(1, 2, 3, 4, 5, 6);
    expectTypeOf(path).toEqualTypeOf<SvgPath>();
    expectTypeOf(path.stringify()).toEqualTypeOf<string>();
    expectTypeOf(path.parse('M0,0L1,1')).toEqualTypeOf<SvgPath>();
    expectTypeOf(path.scale(2, 2).translate(1, 1)).toEqualTypeOf<SvgPath>();
    expectTypeOf(path.clone()).toEqualTypeOf<SvgPath>();
    expectTypeOf(path.splitByCommand('M')).toEqualTypeOf<SvgPath[]>();
  });
});

describe('Interpolation and axes as option values', () => {
  test('interpolation factories return line interpolations', () => {
    expectTypeOf(Interpolation.none()).toExtend<LineInterpolation>();
    expectTypeOf(
      Interpolation.simple({ divisor: 2 })
    ).toExtend<LineInterpolation>();
    expectTypeOf(
      Interpolation.step({ postpone: false })
    ).toExtend<LineInterpolation>();
    expectTypeOf(
      Interpolation.cardinal({ tension: 0.5 })
    ).toExtend<LineInterpolation>();
    expectTypeOf(
      Interpolation.monotoneCubic({ fillHoles: true })
    ).toExtend<LineInterpolation>();
    new LineChart('#c', { series: [] }, { lineSmooth: Interpolation.step() });
  });

  test('axis classes are accepted as axis types', () => {
    expectTypeOf<typeof FixedScaleAxis>().toExtend<AxisType>();
    expectTypeOf<typeof AutoScaleAxis>().toExtend<AxisType>();
    expectTypeOf<typeof StepAxis>().toExtend<AxisType>();
    new LineChart(
      '#c',
      { series: [] },
      {
        axisX: { type: FixedScaleAxis, ticks: [0, 5, 10] },
        axisY: { type: AutoScaleAxis }
      }
    );
  });
});
