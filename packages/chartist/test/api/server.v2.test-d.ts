import { lineChartConfig, type SceneNode, type SceneSize } from 'chartist';
import {
  applyStyles,
  renderForHydration,
  renderToString,
  toScene,
  type ApplyStylesOptions,
  type SceneSize as ServerSceneSize
} from 'chartist/server';

describe('chartist/server types', () => {
  test('applyStyles takes one stylesheet or several, and a color scheme', () => {
    const scene = toScene(lineChartConfig({ series: [[1, 2]] }), {
      width: 100,
      height: 50
    });
    expectTypeOf(
      applyStyles(scene, '.ct-line { stroke: red }')
    ).toEqualTypeOf<SceneNode>();
    expectTypeOf(
      applyStyles(scene, ['a', 'b'] as const, { colorScheme: 'dark' })
    ).toEqualTypeOf<SceneNode>();
    expectTypeOf<ApplyStylesOptions['colorScheme']>().toEqualTypeOf<
      'light' | 'dark' | undefined
    >();
    // @ts-expect-error not a color scheme
    applyStyles(scene, '', { colorScheme: 'sepia' });
    // @ts-expect-error CSS is text
    applyStyles(scene, 42);
  });

  test('renderToString and renderForHydration return markup', () => {
    const config = lineChartConfig({ series: [[1, 2]] });
    expectTypeOf(renderToString).parameter(0).toEqualTypeOf<SceneNode>();
    expectTypeOf(
      renderForHydration(config, { width: 100, height: 50 })
    ).toEqualTypeOf<string>();
  });

  test('SceneSize is the type of chartist', () => {
    expectTypeOf<ServerSceneSize>().toEqualTypeOf<SceneSize>();
  });
});
