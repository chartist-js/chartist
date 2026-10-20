import type {
  AxisFactory,
  AxisTransform,
  ExtentContext,
  GridContext,
  ScaleAxis
} from 'chartist';

describe('axis transform and minor tick types', () => {
  test('an axis factory and its axis declare a transform', () => {
    const log10: AxisTransform = {
      forward: Math.log10,
      inverse: value => 10 ** value
    };
    expectTypeOf<AxisFactory['transform']>().toEqualTypeOf<
      AxisTransform | undefined
    >();
    expectTypeOf<ScaleAxis['transform']>().toEqualTypeOf<
      AxisTransform | undefined
    >();
    expectTypeOf(log10.forward).returns.toBeNumber();
  });

  test('an axis lists minor ticks, and their grid lines say so', () => {
    expectTypeOf<ScaleAxis['minorTicks']>().toEqualTypeOf<
      readonly number[] | undefined
    >();
    expectTypeOf<GridContext['minor']>().toEqualTypeOf<true | undefined>();
  });

  test("a layer's extent gets the transforms of its axes", () => {
    expectTypeOf<NonNullable<ExtentContext['transforms']>['y']>().toEqualTypeOf<
      AxisTransform | undefined
    >();
  });
});
