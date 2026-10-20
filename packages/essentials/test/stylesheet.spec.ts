import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { barChartConfig, findAll, lineChartConfig, toScene } from 'chartist';
import { applyStyles } from 'chartist/server';
import { targetLine, trendLine, valueLabels } from '../src/index.ts';

const require = createRequire(import.meta.url);
// The built stylesheets; `test` depends on `build`.
const css = readFileSync(
  new URL('../dist/styles.css', import.meta.url),
  'utf8'
);
const core = readFileSync(require.resolve('chartist/styles.css'), 'utf8');

/** The declarations of the nth rule for a selector. */
const rule = (sheet: string, selector: string, nth = 0) =>
  [
    ...sheet.matchAll(
      new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`, 'g')
    )
  ][nth][1];

/** The fallback after `marker` (e.g. `--ct-label-color,`), up to its `)`. */
function fallbackAfter(declarations: string, marker: string) {
  const from = declarations.indexOf(marker);
  expect(from, marker).toBeGreaterThanOrEqual(0);
  let depth = 1;
  let index = from + marker.length;
  for (; index < declarations.length && depth > 0; index++) {
    depth +=
      declarations[index] === '(' ? 1 : declarations[index] === ')' ? -1 : 0;
  }
  return declarations.slice(from + marker.length, index - 1).trim();
}

/** A color as [r, g, b, a], from rgb(a) notation or a gray in hsl(a). */
function rgba(color: string): number[] {
  const [, name, args] = /^(\w+)\((.*)\)$/s.exec(color.trim())!;
  const parts = args.split(',').map(part => part.trim());
  const alpha = parts[3] === undefined ? 1 : Number(parts[3]);
  if (name.startsWith('rgb')) {
    return [...parts.slice(0, 3).map(Number), alpha];
  }
  expect(parseFloat(parts[1]), 'a gray').toBe(0);
  const value = Math.round((parseFloat(parts[2]) / 100) * 255);
  return [value, value, value, alpha];
}

/** The two colors of `light-dark(a, b)`. */
const lightDark = (value: string) =>
  /^light-dark\((.*)\)$/s
    .exec(value.trim())![1]
    .split(/,(?![^(]*\))/)
    .map(rgba);

describe('stylesheet', () => {
  it('falls back to the label properties, then to the core defaults', () => {
    const title = rule(css, '.ct-axis-title');
    const label = rule(core, '.ct-label');
    expect(title).toMatch(
      /fill:\s*var\(\s*--ct-axis-title-color,\s*var\(\s*--ct-label-color,/
    );
    expect(title).toMatch(
      /font-size:\s*var\(\s*--ct-axis-title-size,\s*var\(\s*--ct-label-size,/
    );
    expect(rgba(fallbackAfter(title, '--ct-label-color,'))).toEqual(
      rgba(fallbackAfter(label, '--ct-label-color,'))
    );
    expect(parseFloat(fallbackAfter(title, '--ct-label-size,'))).toBe(
      parseFloat(fallbackAfter(label, '--ct-label-size,'))
    );
  });

  it('has the core dark default', () => {
    expect(
      lightDark(
        fallbackAfter(rule(css, '.ct-axis-title', 1), '--ct-label-color,')
      )
    ).toEqual(
      lightDark(fallbackAfter(rule(core, '.ct-label', 1), '--ct-label-color,'))
    );
  });

  it('draws target and trend lines dashed, 2 px wide', () => {
    const scene = toScene(
      lineChartConfig(
        { labels: ['a', 'b', 'c'], series: [[1, 3, 2]] },
        {
          layers: {
            above: [
              trendLine(),
              targetLine({ value: 2, label: 'Goal' }),
              targetLine({ value: 1, className: 'ct-series-b' })
            ]
          }
        }
      ),
      { width: 600, height: 300 }
    );
    const styled = applyStyles(scene, [core, css]);
    const [trend] = findAll(styled, { role: 'trendLine' });
    expect(trend.attrs).toMatchObject({
      stroke: '#d70206',
      'stroke-width': '2px',
      'stroke-dasharray': '6px 4px'
    });
    const [goal, series] = findAll(styled, { role: 'targetLine' });
    expect(goal.attrs).toMatchObject({
      stroke: 'currentColor',
      'stroke-width': '2px',
      'stroke-dasharray': '4px 4px'
    });
    expect(series.attrs.stroke).toBe('#f05b4f');
    const [label] = findAll(styled, { role: 'targetLabel' });
    expect(label.attrs).toMatchObject({
      fill: 'currentColor',
      'font-size': '0.75rem'
    });
  });

  it('gives value labels the core dark default', () => {
    expect(
      lightDark(
        fallbackAfter(rule(css, '.ct-value-label', 1), '--ct-label-color,')
      )
    ).toEqual(
      lightDark(fallbackAfter(rule(core, '.ct-label', 1), '--ct-label-color,'))
    );
  });

  it('styles value labels on the server, white inside bars', () => {
    const scene = toScene(
      barChartConfig(
        { labels: ['a', 'b'], series: [[5, 40]] },
        {
          stackBars: false,
          layers: {
            above: [
              valueLabels({ barPosition: 'inside-end', overflow: 'show' })
            ]
          }
        }
      ),
      { width: 600, height: 300 }
    );
    const styled = applyStyles(scene, [core, css]);
    const labels = findAll(styled, { role: 'valueLabel' });
    expect(labels[1].attrs).toMatchObject({
      fill: '#fff',
      'font-size': '0.75rem'
    });
    const page = '.ct-value-label { --ct-value-label-color: var(--ct-color); }';
    const outside = applyStyles(
      toScene(
        barChartConfig(
          { labels: ['a'], series: [[5]] },
          { high: 10, layers: { above: [valueLabels()] } }
        ),
        { width: 600, height: 300 }
      ),
      [core, css, page]
    );
    expect(findAll(outside, { role: 'valueLabel' })[0].attrs.fill).toBe(
      '#d70206'
    );
  });
});
