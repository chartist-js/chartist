// @vitest-environment node
import { readFileSync } from 'node:fs';

// The built stylesheet; `test` depends on `build`.
const css = readFileSync(
  new URL('../dist/styles.css', import.meta.url),
  'utf8'
);

describe('stylesheet', () => {
  it("doesn't depend on style attributes", () => {
    expect(css).not.toMatch(/\[style/);
  });

  it('takes its looks from --ct-tooltip-* properties', () => {
    for (const property of [
      'background',
      'color',
      'border',
      'radius',
      'padding',
      'font',
      'shadow',
      'max-width',
      'hide-delay',
      'focus-color',
      'focus-width',
      'series-color',
      'x',
      'y'
    ]) {
      expect(css).toContain(`--ct-tooltip-${property}`);
    }
  });

  it('follows the color scheme with light-dark() defaults', () => {
    expect(css).toMatch(/--ct-tooltip-background,\s*light-dark\(/);
  });

  it('keeps a hidden tooltip hidden without popover support', () => {
    expect(css).toMatch(/\.ct-tooltip\[hidden\]\s*\{\s*display: none;/);
  });
});
