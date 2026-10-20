import type { BarContext, Layer, LayerContext, SceneNode } from 'chartist';

describe('annotating layer types', () => {
  test('annotate gets the drawn nodes and the context, and returns nodes', () => {
    expectTypeOf<NonNullable<Layer['annotate']>>().parameters.toEqualTypeOf<
      [readonly SceneNode[], LayerContext]
    >();
    expectTypeOf<NonNullable<Layer['annotate']>>().returns.toEqualTypeOf<
      SceneNode[]
    >();
  });

  test('a bar knows its direction and whether it is stacked', () => {
    expectTypeOf<BarContext['horizontal']>().toEqualTypeOf<boolean>();
    expectTypeOf<BarContext['stacked']>().toEqualTypeOf<boolean>();
  });
});
