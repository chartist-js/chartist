// @vitest-environment node
import { barChartConfig } from '../presets/barChart';
import { lineChartConfig } from '../presets/lineChart';
import { pieChartConfig } from '../presets/pieChart';
import { renderToString } from '../render/string';
import { renderForHydration } from './renderForHydration';
import { toScene } from './toScene';

const week = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [[12, 9, 7, 8, 5]]
};
const size = { width: 600, height: 300 };

/** The attributes of the root's start tag. */
function rootAttributes(markup: string): Record<string, string> {
  const tag = markup.slice(0, markup.indexOf('>'));
  return Object.fromEntries(
    Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([, name, value]) => [
      name,
      value.replace(/&quot;/g, '"')
    ])
  );
}

describe('chart/renderForHydration', () => {
  it('marks the root with the size, label mode, estimate and scaling viewBox', () => {
    expect(typeof document).toBe('undefined');
    const markup = renderForHydration(lineChartConfig(week), size);
    const root = rootAttributes(markup);
    expect(root).toMatchObject({
      width: '100%',
      height: '100%',
      viewBox: '0 0 600 300'
    });
    expect(JSON.parse(root['data-ct-hydrate'])).toEqual({
      v: 1,
      width: 600,
      height: 300,
      labels: 'html',
      text: 'estimate',
      scale: true
    });
    expect(markup).toContain('<foreignObject');
    expect(markup).not.toContain('<text');
  });

  it("keeps the config's size and viewBox, and records that it doesn't scale", () => {
    const root = rootAttributes(
      renderForHydration(
        lineChartConfig(week, {
          width: 400,
          height: 200,
          viewBox: { width: 400, height: 200 }
        }),
        size
      )
    );
    expect(root).toMatchObject({
      width: '400',
      height: '200',
      viewBox: '0 0 400 200'
    });
    expect(JSON.parse(root['data-ct-hydrate'])).toMatchObject({
      scale: false
    });
  });

  it('records custom text measurement and the label mode it was given', () => {
    const marker = JSON.parse(
      rootAttributes(
        renderForHydration(lineChartConfig(week), {
          ...size,
          labels: 'svg',
          measureText: () => ({ width: 10, height: 10 })
        })
      )['data-ct-hydrate']
    );
    expect(marker).toMatchObject({ labels: 'svg', text: 'custom' });
  });

  it.each([
    ['a line chart', lineChartConfig(week)],
    ['a bar chart', barChartConfig(week)],
    [
      'a donut',
      pieChartConfig({ series: [3, 2, 1] }, { donut: true, donutWidth: 20 })
    ]
  ])('writes %s without style attributes', (_, config) => {
    const markup = renderForHydration(config, size);
    expect(markup).not.toMatch(/\sstyle=/);
    expect(markup).not.toContain('<style');
  });

  it('writes the styles SVG has attributes for as those', () => {
    const line = renderForHydration(lineChartConfig(week), size);
    const objects = line.match(/<foreignObject [^>]*>/g) ?? [];
    expect(objects.length).toBeGreaterThan(0);
    expect(objects.every(tag => tag.includes('overflow="visible"'))).toBe(true);

    const donut = renderForHydration(
      pieChartConfig({ series: [3, 2, 1] }, { donut: true, donutWidth: 20 }),
      size
    );
    const slices =
      donut.match(/<path [^>]*class="ct-slice-donut"[^>]*>/g) ?? [];
    expect(slices).toHaveLength(3);
    expect(slices.every(tag => tag.includes('stroke-width="20"'))).toBe(true);
  });

  it('turns styles a scene listener adds into attributes on SVG elements and drops the rest', () => {
    const markup = renderForHydration(
      lineChartConfig(week, {
        on: {
          compose: current =>
            current.role === 'line'
              ? current.attr({
                  style: 'stroke: red; --mine: 1; transform: none'
                })
              : undefined
        }
      }),
      size
    );
    const line = markup.match(/<path [^>]*class="ct-line"[^>]*>/)?.[0];
    expect(line).toContain('stroke="red"');
    expect(line).not.toContain('--mine');
    expect(line).not.toContain('transform');
  });

  it('leaves the self-contained image of toScene() and renderToString() as it was', () => {
    const line = renderToString(
      toScene(lineChartConfig(week), { ...size, labels: 'html' })
    );
    expect(line).not.toContain('data-ct-hydrate');
    expect(rootAttributes(line)).toMatchObject({ width: '600', height: '300' });
    expect(line).toContain('<foreignObject style="overflow: visible;"');
    expect(line).toMatch(/<span [^>]*style="width: \d+px; height: \d+px;"/);

    const donut = renderToString(
      toScene(
        pieChartConfig({ series: [3, 2, 1] }, { donut: true, donutWidth: 20 }),
        size
      )
    );
    expect(donut).not.toContain('data-ct-hydrate');
    expect(donut).toContain('style="stroke-width: 20px"');
  });
});
