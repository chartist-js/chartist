import type { ScaleAxis, SceneNode } from 'chartist';
import { targetLine, trendLine } from './index.ts';

describe('target and trend line types', () => {
  it('narrow a node by its role', () => {
    const check = (scene: SceneNode) => {
      if (scene.role === 'targetLine') {
        expectTypeOf(scene.ctx.value).toEqualTypeOf<number>();
        expectTypeOf(scene.ctx.axis).toEqualTypeOf<ScaleAxis>();
        expectTypeOf(scene.attrs.y1).toEqualTypeOf<number>();
      }
      if (scene.role === 'trendLine') {
        expectTypeOf(scene.ctx.seriesIndex).toEqualTypeOf<number>();
        expectTypeOf(scene.ctx.slope).toEqualTypeOf<number>();
        expectTypeOf(scene.ctx.correlation).toEqualTypeOf<number | undefined>();
        expectTypeOf(scene.attrs.x2).toEqualTypeOf<number>();
      }
      if (scene.role === 'targetLabel') {
        expectTypeOf(scene.ctx.text).toEqualTypeOf<string>();
      }
    };
    void check;
  });

  it('take their options', () => {
    targetLine({ value: 1000, label: 'Target', className: 'ct-series-b' });
    targetLine({ axis: 'eur', value: 800, labelPosition: 'start' });
    // @ts-expect-error: a line needs a value
    expect(() => targetLine({ label: 'Target' })).toThrow();
    trendLine({ series: ['sales', 1], x: 'month', y: 'eur', align: 'center' });
    trendLine({ classNames: { series: 'my-series', line: 'my-trend' } });
    // @ts-expect-error: align is start or center
    trendLine({ align: 'end' });
  });
});
