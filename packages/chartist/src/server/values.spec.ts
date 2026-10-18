// @vitest-environment node
import { CYCLE, lightDark, substitute } from './values';

const custom: Record<string, string> = {
  '--a': 'red',
  '--b': '2px 4px',
  '--empty': ''
};
const lookup = (name: string) => custom[name];

describe('server/values', () => {
  it('replaces var() with the custom property or its fallback', () => {
    expect(substitute('var(--a)', lookup)).toBe('red');
    expect(substitute('var( --a , blue)', lookup)).toBe('red');
    expect(substitute('var(--missing, blue)', lookup)).toBe('blue');
    expect(substitute('var(--missing, var(--b))', lookup)).toBe('2px 4px');
    expect(substitute('var(--missing, rgba(0, 0, 0, 0.4))', lookup)).toBe(
      'rgba(0, 0, 0, 0.4)'
    );
    expect(substitute('1px var(--a)var(--a) solid', lookup)).toBe(
      '1px redred solid'
    );
    expect(substitute('var(--empty)', lookup)).toBe('');
    expect(substitute('calc(var(--b) + 1px)', lookup)).toBe(
      'calc(2px 4px + 1px)'
    );
  });

  it('fails without a value or fallback, and on cycles, fallbacks too', () => {
    expect(substitute('var(--missing)', lookup)).toBeUndefined();
    expect(substitute('var(--missing, var(--other))', lookup)).toBeUndefined();
    expect(substitute('var(--a', lookup)).toBeUndefined();
    expect(substitute('var(--x, blue)', () => CYCLE)).toBe(CYCLE);
  });

  it('leaves names that only end in var alone', () => {
    expect(substitute('my-var(1) xvar(2)', lookup)).toBe('my-var(1) xvar(2)');
  });

  it('picks the light or dark value of light-dark()', () => {
    const value = 'light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.6))';
    expect(lightDark(value, 'light')).toBe('rgba(0, 0, 0, 0.4)');
    expect(lightDark(value, 'dark')).toBe('rgba(255, 255, 255, 0.6)');
    expect(
      lightDark('1px solid LIGHT-DARK(light-dark(a, b), c)', 'light')
    ).toBe('1px solid a');
    expect(lightDark('light-dark(a)', 'light')).toBeUndefined();
    expect(lightDark('red', 'dark')).toBe('red');
  });
});
