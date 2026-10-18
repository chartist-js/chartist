// @vitest-environment node
import { chartistCss } from '../../test/chartist-css';
import { toScene } from '../chart/toScene';
import { barChartConfig } from '../presets/barChart';
import { lineChartConfig } from '../presets/lineChart';
import { pieChartConfig } from '../presets/pieChart';
import { findAll } from '../scene/tree';
import {
  applyStyles,
  computeStyles,
  type ComputedStyles,
  type SkippedStyle
} from './applyStyles';
import { renderToString } from './string';

const scene = () =>
  toScene(
    lineChartConfig(
      {
        labels: ['Mon', 'Tue', 'Wed'],
        series: [
          [1, 3, 2],
          [2, 1, 3]
        ]
      },
      { showArea: true }
    ),
    { width: 600, height: 300 }
  );

const lines = (styles: ComputedStyles, of: ReturnType<typeof scene>) =>
  findAll(of, { role: 'line' }).map(line => styles(line)?.stroke);

describe('server/computeStyles', () => {
  it('gives each node the values of its presentation properties', () => {
    const source = scene();
    const styles = computeStyles(source, chartistCss);
    const [line] = findAll(source, { role: 'line' });
    expect(styles(line)).toMatchObject({
      stroke: '#d70206',
      fill: 'none',
      'stroke-width': '4px'
    });
    expect(lines(styles, source)).toEqual(['#d70206', '#f05b4f']);
  });

  it('applies :root, html and body rules, as on a page', () => {
    for (const theme of [
      ':root { --ct-series-a: teal; }',
      'html { --ct-series-a: teal; }',
      'body { --ct-series-a: teal; }'
    ]) {
      const source = scene();
      expect(
        lines(computeStyles(source, [chartistCss, theme]), source)
      ).toEqual(['teal', '#f05b4f']);
    }
  });

  it('passes the inherited properties of the page on to the root', () => {
    const root = scene();
    const page = 'body { font-family: Georgia; color: teal; display: flex; }';
    expect(computeStyles(root, page)(root)).toEqual({
      'font-family': 'Georgia',
      color: 'teal'
    });
    // A rule for the svg wins over what the page passes on.
    expect(
      computeStyles(root, [page, '.ct-chart-line { color: navy; }'])(root)
    ).toEqual({ 'font-family': 'Georgia', color: 'navy' });
  });

  it('reports what it leaves out, once each', () => {
    const skipped: SkippedStyle[] = [];
    computeStyles(
      scene(),
      [
        '.ct-series:nth-child(2) .ct-line { stroke: teal; }',
        '.ct-label { font: 14px Georgia; }',
        '@media print { .ct-line { stroke: black; } }',
        '.ct-series { .ct-line { stroke: teal; } }',
        '.ct-line { stroke: var(--nothing); }',
        '@import "theme.css";',
        // Not reported: the other color scheme, and pseudo-elements.
        '@media (prefers-color-scheme: dark) { .ct-line { stroke: white; } }',
        '.ct-line::before, .ct-line:after { content: ""; }'
      ],
      { onSkip: part => skipped.push(part) }
    );
    // The value applies to both lines, and is reported once.
    expect(
      skipped.map(({ reason, text }) => `${reason} ${text}`).sort()
    ).toEqual([
      'at-rule @import "theme.css"',
      'at-rule @media print',
      'nested .ct-line',
      'selector .ct-series:nth-child(2) .ct-line',
      'shorthand font: 14px Georgia',
      'value stroke: var(--nothing)'
    ]);
  });

  it("reads all of Chartist's stylesheet that can style a chart", () => {
    const skipped: SkippedStyle[] = [];
    for (const config of [
      lineChartConfig({ series: [[1, 2]] }, { showArea: true }),
      barChartConfig({ series: [[1, 2]] }),
      pieChartConfig({ series: [1, 2] }, { donut: true })
    ]) {
      computeStyles(toScene(config, { width: 300, height: 200 }), chartistCss, {
        onSkip: part => skipped.push(part)
      });
    }
    expect(skipped).toEqual([]);
  });
});

describe('server/applyStyles with computed styles', () => {
  it('gives the same result for CSS as for computeStyles()', () => {
    const source = scene();
    expect(renderToString(applyStyles(source, chartistCss))).toBe(
      renderToString(applyStyles(source, computeStyles(source, chartistCss)))
    );
  });

  it("writes another engine's values, for presentation properties only", () => {
    const styled = applyStyles(scene(), current =>
      current.role === 'line'
        ? { stroke: 'teal', 'align-items': 'center' }
        : undefined
    );
    for (const line of findAll(styled, { role: 'line' })) {
      expect(line.attrs.stroke).toBe('teal');
      expect(line.attrs['align-items']).toBeUndefined();
    }
    expect(findAll(styled, { role: 'point' })[0].attrs.stroke).toBeUndefined();
  });
});
