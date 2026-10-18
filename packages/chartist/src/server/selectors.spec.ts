// @vitest-environment node
import { node, type SceneNode } from '../scene/node';
import { matches, parseSelector, parseSelectorList } from './selectors';

// svg.ct-chart-line > g.ct-series.ct-series-a > path.ct-line[d]
const line = node('path', { d: 'M0,0', 'data-kind': 'main wide' }, 'ct-line');
const series = node('g', {}, 'ct-series ct-series-a');
const root = node('svg', { width: 100 }, 'ct-chart-line');
const path: SceneNode[] = [root, series, line];

const matching = (selector: string, nodes = path) => {
  const parsed = parseSelector(selector);
  return parsed !== undefined && matches(parsed, nodes);
};

describe('server/selectors', () => {
  it.each([
    'path',
    '*',
    '.ct-line',
    'path.ct-line',
    '*.ct-line',
    '[d]',
    '[data-kind="main wide"]',
    "[data-kind='main wide']",
    '[data-kind~=wide]',
    '[class~="ct-line"]',
    '.ct-series-a .ct-line',
    '.ct-chart-line .ct-line',
    '.ct-series > .ct-line',
    'svg > g > path',
    '.ct-series>.ct-line',
    '.ct-chart-line * .ct-line',
    ':is(.ct-bar, .ct-line)',
    ':where(.ct-line)',
    ':not(.ct-bar)',
    '.ct-line:not(:where([stroke-width]))',
    ':is(.ct-series-b, .ct-series-a) .ct-line',
    ':is(:hover, .ct-line)'
  ])('%s matches', selector => {
    expect(matching(selector)).toBe(true);
  });

  it.each([
    'line',
    '.ct-bar',
    '[stroke-width]',
    '[data-kind=main]',
    '[data-kind~=mai]',
    '.ct-series-b .ct-line',
    '.ct-chart-line > .ct-line',
    'g .ct-series',
    '.ct-line path',
    ':not(.ct-line)',
    '.ct-line:not(:where([d]))',
    ':is(.ct-bar, .ct-point)'
  ])("%s doesn't match", selector => {
    expect(matching(selector)).toBe(false);
  });

  it.each([
    '.ct-line:hover',
    '.ct-line::before',
    '.ct-line:before',
    ':root .ct-line',
    '#chart .ct-line',
    '.ct-series + .ct-line',
    '.ct-series ~ .ct-line',
    '[d^="M"]',
    '[d="M0,0" i]',
    ':not(:hover)',
    ':is(:hover)',
    'svg|path',
    '.ct-line >',
    '> .ct-line',
    'path*',
    ''
  ])("%s can't be matched, and matches nothing", selector => {
    expect(parseSelector(selector)).toBeUndefined();
  });

  it('matches the donut width rule only without a stroke-width attribute', () => {
    const [selector] = parseSelectorList(
      '.ct-slice-donut:not(:where([stroke-width]))'
    );
    const slice = node('path', {}, 'ct-slice-donut');
    expect(matches(selector, [root, slice])).toBe(true);
    expect(matches(selector, [root, slice.attr({ 'stroke-width': 20 })])).toBe(
      false
    );
  });

  it('resolves escapes in class names', () => {
    const element = node('g', {}, 'md:wide');
    expect(matching('.md\\:wide', [element])).toBe(true);
    expect(matching('.md\\3a wide', [element])).toBe(true);
  });

  it('computes specificity: classes and attributes over types, :where() as nothing', () => {
    const specificity = (selector: string) =>
      parseSelector(selector)?.specificity;
    expect(specificity('*')).toBe(0);
    expect(specificity('path')).toBe(1);
    expect(specificity('.ct-line')).toBe(1000);
    expect(specificity('svg .ct-series-a path.ct-line')).toBe(2002);
    expect(specificity('[d]')).toBe(1000);
    expect(specificity(':where(.ct-series-a .ct-line)')).toBe(0);
    expect(specificity('.ct-slice-donut:not(:where([stroke-width]))')).toBe(
      1000
    );
    expect(specificity(':not(.a, .b .c)')).toBe(2000);
    expect(specificity(':is(path, .a)')).toBe(1000);
  });

  it('leaves the selectors it cannot match out of a list', () => {
    expect(
      parseSelectorList('.ct-line:hover, .ct-line, #x, :is(.a, .b)')
    ).toHaveLength(2);
  });
});
