// @vitest-environment node
import { dots } from '../../test/layers';
import type { Layer } from '../pipeline/types';
import { findAll } from '../scene/tree';
import { toScene } from './toScene';

describe('chart/toScene', () => {
  it('runs without DOM globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const scene = toScene(
      { data: { series: [[1, 2]] }, layers: [dots()] },
      { width: 300, height: 150 }
    );
    expect(findAll(scene, { role: 'point' })).toHaveLength(2);
  });

  it('returns equal scenes for equal inputs', () => {
    const build = () =>
      toScene(
        { data: { series: [[1, 2], [3]] }, layers: [dots()] },
        { width: 300, height: 150 }
      );
    expect(build()).toEqual(build());
  });

  it('applies config listeners and v2 plugins', () => {
    const install = vi.fn(chart =>
      chart.on('compose', (n: ReturnType<typeof findAll>[number]) =>
        n.role === 'point' ? n.addClass('plugin') : undefined
      )
    );
    const scene = toScene(
      {
        data: { series: [[1]] },
        layers: [dots()],
        plugins: [[{ name: 'test', install }, { a: 1 }]],
        on: { scene: ({ scene }) => ({ scene: scene.addClass('listener') }) }
      },
      { width: 100, height: 100 }
    );
    expect(install).toHaveBeenCalledWith(expect.anything(), { a: 1 });
    expect(scene.classes).toContain('listener');
    expect(findAll(scene, { role: 'point' })[0].classes).toContain('plugin');
  });

  it('uses a custom measureText for layers', () => {
    const measureText = vi.fn(() => ({ width: 1, height: 1 }));
    toScene(
      {
        data: { series: [[1]] },
        layers: [
          {
            type: 'measuring',
            coordinates: ['cartesian'],
            compose: context => {
              context.measureText('label');
              return [];
            }
          }
        ]
      },
      { width: 100, height: 100, measureText }
    );
    // With the chart type class, so chart type CSS applies when measuring.
    expect(measureText).toHaveBeenCalledWith('label', {
      rootClass: 'ct-chart-line'
    });
  });

  it('gives the svg the chart type class of its layers', () => {
    const layer = (type: string, chartType?: string): Layer => ({
      type,
      chartType,
      coordinates: ['cartesian'],
      compose: () => []
    });
    const classesOf = (layers: Layer[], className?: string) =>
      toScene(
        { data: { series: [[1, 2]] }, layers, className },
        { width: 100, height: 100 }
      ).classes;
    expect(classesOf([layer('line'), layer('axisGrid')])).toEqual([
      'ct-chart-line'
    ]);
    expect(classesOf([layer('line'), layer('bar')])).toEqual(['ct-chart-bar']);
    expect(classesOf([layer('pie', 'pie')])).toEqual(['ct-chart-pie']);
    expect(classesOf([layer('pie', 'donut')])).toEqual(['ct-chart-donut']);
    expect(classesOf([layer('custom', 'bar')])).toEqual(['ct-chart-bar']);
    expect(classesOf([])).toEqual(['ct-chart-line']);
    // A given className replaces it.
    expect(classesOf([layer('bar')], 'mine')).toEqual(['mine']);
  });

  it('handle methods other than on/off are not available to plugins', () => {
    expect(() =>
      toScene(
        {
          data: { series: [] },
          layers: [],
          plugins: [{ name: 'bad', install: chart => chart.destroy() }]
        },
        { width: 1, height: 1 }
      )
    ).toThrow('destroy() is not available in toScene()');
  });
});
