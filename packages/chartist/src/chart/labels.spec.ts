import { autoScaleAxis, stepAxis } from '../scales/factories';
import { cartesianAxes } from '../scales/cartesian';
import { axisLabels } from '../layers/axes';
import { findAll } from '../scene/tree';
import { renderToString } from '../server/string';
import { lineChart } from '../presets/lineChart';
import { LineChart } from '../charts/LineChart/LineChart';
import { chart } from './chart';
import { toScene } from './toScene';
import type { ChartConfig } from './types';

const config = (extra: Partial<ChartConfig> = {}): ChartConfig => ({
  data: { labels: ['Mon', 'Tue'], series: [[1, 2]] },
  axes: cartesianAxes([
    { id: 'x', side: 'bottom', type: stepAxis(), ticks: ['Mon', 'Tue'] },
    { id: 'y', side: 'left', type: autoScaleAxis() }
  ]),
  layers: [axisLabels()],
  ...extra
});
const SIZE = { width: 400, height: 200 };
const labelNames = (scene: ReturnType<typeof toScene>) =>
  new Set(findAll(scene, { role: 'label' }).map(n => n.name));

describe('label mode', () => {
  it('toScene draws SVG text by default, without foreignObject', () => {
    const scene = toScene(config(), SIZE);
    expect(labelNames(scene)).toEqual(new Set(['text']));
    expect(renderToString(scene)).not.toContain('foreignObject');
  });

  it('the toScene option, the chart option and the layer option take precedence in turn', () => {
    expect(labelNames(toScene(config(), { ...SIZE, labels: 'html' }))).toEqual(
      new Set(['foreignObject'])
    );
    expect(
      labelNames(
        toScene(config({ labels: 'html' }), { ...SIZE, labels: 'svg' })
      )
    ).toEqual(new Set(['foreignObject']));
    expect(
      labelNames(
        toScene(
          config({ labels: 'svg', layers: [axisLabels({ labels: 'html' })] }),
          SIZE
        )
      )
    ).toEqual(new Set(['foreignObject']));
  });

  it('the DOM renderer draws HTML labels unless the config says svg', () => {
    const el = document.createElement('div');
    chart(el, { ...config(), ...SIZE });
    expect(el.querySelector('.ct-labels foreignObject')).not.toBeNull();
    chart(el, { ...config({ labels: 'svg' }), ...SIZE });
    expect(el.querySelector('.ct-labels foreignObject')).toBeNull();
    expect(
      el.querySelectorAll('.ct-labels text.ct-label').length
    ).toBeGreaterThan(0);
  });

  it('presets take labels; the 1.x classes ignore it', async () => {
    const el = document.createElement('div');
    lineChart(
      el,
      { labels: ['a', 'b'], series: [[1, 2]] },
      { labels: 'svg', width: 300, height: 200 }
    );
    expect(el.querySelector('foreignObject')).toBeNull();
    expect(el.querySelectorAll('text.ct-label.ct-horizontal').length).toBe(2);

    const legacy = document.createElement('div');
    const instance = new LineChart(
      legacy,
      { labels: ['a', 'b'], series: [[1, 2]] },
      {
        labels: 'svg',
        width: 300,
        height: 200
      } as never
    );
    // The first render is deferred to the next tick.
    await new Promise(resolve => setTimeout(resolve));
    instance.detach();
    expect(legacy.querySelector('foreignObject')).not.toBeNull();
    expect(legacy.querySelector('text.ct-label')).toBeNull();
  });
});

describe('label alignment per axis', () => {
  const anchors = (el: Element, direction: 'horizontal' | 'vertical') =>
    new Set(
      Array.from(el.querySelectorAll(`text.ct-label.ct-${direction}`), text =>
        text.getAttribute('text-anchor')
      )
    );

  it('preset axes align their SVG labels', () => {
    const data = { labels: ['a', 'b'], series: [[1, 2]] };
    const plain = document.createElement('div');
    lineChart(plain, data, { labels: 'svg', width: 300, height: 200 });
    expect(anchors(plain, 'horizontal')).toEqual(new Set(['start']));

    const el = document.createElement('div');
    lineChart(el, data, {
      labels: 'svg',
      width: 300,
      height: 200,
      axisX: { labelAlign: { horizontal: 'middle' } },
      axisY: { labelAlign: { horizontal: 'end' } }
    });
    expect(anchors(el, 'horizontal')).toEqual(new Set(['middle']));
    expect(anchors(el, 'vertical')).toEqual(new Set(['end']));
    // Centered in their boxes: half a box further right than at the start.
    const x = (root: Element) =>
      Number(root.querySelector('text.ct-horizontal')!.getAttribute('x'));
    expect(x(el)).toBeGreaterThan(x(plain));
  });

  it("an axis's labelAlign wins over the layer's align", () => {
    const scene = toScene(
      config({
        labels: 'svg',
        axes: cartesianAxes([
          {
            id: 'x',
            side: 'bottom',
            type: stepAxis(),
            ticks: ['Mon', 'Tue'],
            labelAlign: { horizontal: 'end' }
          },
          { id: 'y', side: 'left', type: autoScaleAxis() }
        ]),
        layers: [axisLabels({ align: { horizontal: 'start' } })]
      }),
      SIZE
    );
    const anchorsOf = (id: string) =>
      new Set(
        findAll(scene, { role: 'label' })
          .filter(
            n =>
              n.ctx.kind === 'axis' &&
              'id' in n.ctx.axis &&
              n.ctx.axis.id === id
          )
          .map(n => n.attrs['text-anchor'])
      );
    expect(anchorsOf('x')).toEqual(new Set(['end']));
    expect(anchorsOf('y')).toEqual(new Set(['start']));
  });
});

describe('label mode: web fonts', () => {
  function fakeFonts() {
    const target = new EventTarget();
    Object.defineProperty(document, 'fonts', {
      value: target,
      configurable: true
    });
    return () => {
      delete (document as unknown as { fonts?: unknown }).fonts;
      return target;
    };
  }

  it('lays SVG labels out again when web fonts finish loading', () => {
    const restore = fakeFonts();
    const el = document.createElement('div');
    let scenes = 0;
    const handle = chart(el, {
      ...config({ labels: 'svg' }),
      ...SIZE,
      on: { scene: () => void scenes++ }
    });
    const fonts = restore();
    expect(scenes).toBe(1);
    fonts.dispatchEvent(new Event('loadingdone'));
    expect(scenes).toBe(2);
    handle.detach();
    fonts.dispatchEvent(new Event('loadingdone'));
    expect(scenes).toBe(2);
  });

  it('HTML labels are not laid out again', () => {
    const restore = fakeFonts();
    const el = document.createElement('div');
    let scenes = 0;
    chart(el, { ...config(), ...SIZE, on: { scene: () => void scenes++ } });
    restore().dispatchEvent(new Event('loadingdone'));
    expect(scenes).toBe(1);
  });
});
