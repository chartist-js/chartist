// @vitest-environment node
import { chartistCss } from '../../test/chartist-css';
import { readDeclarations, readStylesheet } from './css';

describe('server/css', () => {
  it("reads every rule of Chartist's stylesheet", () => {
    const rules = readStylesheet(chartistCss, 'light');
    // Every `{` opens a rule or an at-rule; the at-rules are @supports.
    const blocks = chartistCss.split('{').length - 1;
    const atRules = chartistCss.match(/@supports/g)?.length ?? 0;
    expect(rules).toHaveLength(blocks - atRules);
    expect(rules.every(rule => rule.declarations.length > 0)).toBe(true);
    expect(rules.find(rule => rule.selectors === '.ct-series-a')).toEqual({
      selectors: '.ct-series-a',
      declarations: [
        {
          property: '--ct-color',
          value: 'var(--ct-series-a, #d70206)',
          important: false
        }
      ]
    });
  });

  it('reads declarations with !important, custom properties and lower-case names', () => {
    expect(
      readDeclarations(
        'FILL: red !important; --My-Color: Teal; stroke:blue;;  : x; bad'
      )
    ).toEqual([
      { property: 'fill', value: 'red', important: true },
      { property: '--My-Color', value: 'Teal', important: false },
      { property: 'stroke', value: 'blue', important: false }
    ]);
  });

  it('skips comments, also between rules and inside values', () => {
    const rules = readStylesheet(
      '/* a } { */ .a { fill: /* not */ red; } /* .b { fill: blue } */',
      'light'
    );
    expect(rules).toEqual([
      {
        selectors: '.a',
        declarations: [{ property: 'fill', value: 'red', important: false }]
      }
    ]);
  });

  it('keeps strings with ;, } and comment markers in one value', () => {
    const [rule] = readStylesheet(
      `.a { font-family: "a; b } /* c */", 'd;}'; fill: url(data:x;y) }`,
      'light'
    );
    expect(rule.declarations).toEqual([
      {
        property: 'font-family',
        value: `"a; b } /* c */", 'd;}'`,
        important: false
      },
      { property: 'fill', value: 'url(data:x;y)', important: false }
    ]);
  });

  it('applies @media (prefers-color-scheme) for its scheme only', () => {
    const css = `
      .a { fill: red }
      @media (prefers-color-scheme: dark) { .a { fill: white } }
      @media (prefers-color-scheme: light) { .a { stroke: black } }
      @media print { .a { fill: gray } }
      @media screen and (prefers-color-scheme: dark) { .a { fill: gray } }
    `;
    const values = (scheme: 'light' | 'dark') =>
      readStylesheet(css, scheme).flatMap(rule =>
        rule.declarations.map(({ property, value }) => `${property}:${value}`)
      );
    expect(values('light')).toEqual(['fill:red', 'stroke:black']);
    expect(values('dark')).toEqual(['fill:red', 'fill:white']);
  });

  it('reads @layer and @supports blocks in place, and skips other at-rules and statements', () => {
    const css = `
      @import url("theme.css");
      @layer base, theme;
      @charset "utf-8";
      @layer base { .a { fill: red } }
      @supports (color: light-dark(#000, #fff)) { .b { fill: blue } }
      @supports not (color: light-dark(#000, #fff)) { .c { fill: gray } }
      @keyframes spin { from { opacity: 0 } to { opacity: 1 } }
      @font-face { font-family: x; src: url(x.woff) }
      @container (width > 400px) { .d { fill: gray } }
      @unknown-thing foo { .e { fill: gray } }
      .f { fill: green }
    `;
    expect(readStylesheet(css, 'light').map(rule => rule.selectors)).toEqual([
      '.a',
      '.b',
      '.f'
    ]);
  });

  it('skips nested rules and keeps their parent declarations', () => {
    const [rule, next] = readStylesheet(
      '.a { fill: red; &:hover { fill: blue; } .b { fill: gray } stroke: black } .c { fill: green }',
      'light'
    );
    expect(rule.declarations.map(d => d.property)).toEqual(['fill', 'stroke']);
    expect(next.selectors).toBe('.c');
  });

  it("doesn't throw on broken CSS", () => {
    for (const css of [
      '.a { fill: red',
      '.a { fill: "red }',
      '} } .a { fill: red }',
      '@media (prefers-color-scheme: light) { .a { fill: red }',
      '.a { fill: "><script>alert(1)</script>; }',
      '/* open',
      ''
    ]) {
      expect(() => readStylesheet(css, 'light')).not.toThrow();
    }
    expect(readStylesheet('} } .a { fill: red }', 'light')).toHaveLength(1);
  });
});
