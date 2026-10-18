/**
 * Value resolution of `applyStyles()`: `var()` with fallbacks, and
 * `light-dark()` by color scheme, so a value needs no CSS support.
 */
import { splitTopLevel, topLevel, type ColorScheme } from './css';

/** What a custom property in a cycle resolves to: invalid, fallbacks too. */
export const CYCLE = Symbol('cycle');

/** A custom property's resolved value, `undefined` if it isn't set. */
export type Lookup = (name: string) => string | typeof CYCLE | undefined;

/**
 * Replaces each call of a CSS function in a value, e.g. every `var(…)`.
 * `replace` gets the text between the parentheses and returns the
 * replacement, or `undefined` or `CYCLE` to make the whole value fail.
 */
function replaceCalls(
  value: string,
  name: string,
  replace: (args: string) => string | typeof CYCLE | undefined
): string | typeof CYCLE | undefined {
  const pattern = new RegExp(`(?<![\\w-])${name}\\(`, 'gi');
  let out = '';
  let from = 0;
  for (;;) {
    pattern.lastIndex = from;
    const match = pattern.exec(value);
    if (!match) {
      return out + value.slice(from);
    }
    const open = match.index + match[0].length;
    const close = topLevel(value, ')', open);
    if (close >= value.length) {
      return undefined;
    }
    const replaced = replace(value.slice(open, close));
    if (typeof replaced !== 'string') {
      return replaced;
    }
    out += value.slice(from, match.index) + replaced;
    from = close + 1;
  }
}

/**
 * The value with every `var()` replaced by the custom property's value or
 * the `var()` fallback. `undefined` if one has neither, `CYCLE` if one is
 * in a cycle.
 */
export function substitute(
  value: string,
  lookup: Lookup
): string | typeof CYCLE | undefined {
  return replaceCalls(value, 'var', args => {
    const comma = topLevel(args, ',');
    const name = args.slice(0, comma).trim();
    const found = lookup(name);
    if (found !== undefined) {
      return found;
    }
    return comma < args.length
      ? substitute(args.slice(comma + 1).trim(), lookup)
      : undefined;
  });
}

/**
 * The value with every `light-dark(light, dark)` replaced by the value
 * for the scheme. `undefined` if one doesn't have two values.
 */
export function lightDark(
  value: string,
  scheme: ColorScheme
): string | undefined {
  const resolved = replaceCalls(value, 'light-dark', args => {
    const parts = splitTopLevel(args, ',');
    if (parts.length !== 2) {
      return undefined;
    }
    return lightDark(parts[scheme === 'light' ? 0 : 1].trim(), scheme);
  });
  return typeof resolved === 'string' ? resolved : undefined;
}
