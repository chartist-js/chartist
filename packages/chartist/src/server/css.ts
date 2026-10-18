/**
 * The CSS reader of `applyStyles()`: style rules with their declarations,
 * from stylesheets as chart styles write them. Not a full CSS parser: what
 * it can't read it skips, and it never throws.
 */

/** The color scheme `@media (prefers-color-scheme)` and `light-dark()` use. */
export type ColorScheme = 'light' | 'dark';

/** One declaration of a rule or of a `style` attribute. */
export interface Declaration {
  /** Lower case, except custom properties (`--ct-color`), which keep it. */
  readonly property: string;
  /** The value without `!important`, trimmed. */
  readonly value: string;
  readonly important: boolean;
}

/**
 * Why `computeStyles()` left a part of a stylesheet out: `at-rule`,
 * `selector`, `nested`, `shorthand` or `value` (see `SkippedStyle`).
 *
 * @experimental New with 2.1: the server API may still change in a 2.x
 *   minor before it becomes stable.
 */
export type SkipReason =
  | 'at-rule'
  | 'selector'
  | 'nested'
  | 'shorthand'
  | 'value';

/** Reports a part of a stylesheet that was left out, with its text. */
export type Report = (reason: SkipReason, text: string) => void;

/** A style rule, read in place from whatever block it was in. */
export interface StyleRule {
  /** The selector list as written, e.g. `.ct-series-a .ct-line, .ct-bar`. */
  readonly selectors: string;
  readonly declarations: readonly Declaration[];
}

/** Where a string that starts at `start` ends: after its closing quote, or at a newline. */
function stringEnd(text: string, start: number): number {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length && text[i] !== quote && text[i] !== '\n') {
    i += text[i] === '\\' ? 2 : 1;
  }
  return text[i] === quote ? i + 1 : i;
}

/** The text without comments; comment markers inside strings stay. */
export function withoutComments(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === '"' || char === "'") {
      const end = stringEnd(text, i);
      out += text.slice(i, end);
      i = end;
    } else if (char === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 2;
      out += ' ';
    } else {
      out += char;
      i++;
    }
  }
  return out;
}

/**
 * The index of the first of `chars` at the top level from `start` on:
 * outside strings, parentheses and brackets. `end` if there's none.
 */
export function topLevel(
  text: string,
  chars: string,
  start = 0,
  end = text.length
): number {
  let depth = 0;
  let i = start;
  while (i < end) {
    const char = text[i];
    if (char === '"' || char === "'") {
      i = stringEnd(text, i);
      continue;
    }
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (depth === 0 && chars.includes(char)) {
      return i;
    }
    if (char === '(' || char === '[') {
      depth++;
    } else if ((char === ')' || char === ']') && depth > 0) {
      depth--;
    }
    i++;
  }
  return end;
}

/** The index of the `}` that closes the block opened just before `start`. */
function blockEnd(text: string, start: number, end: number): number {
  let depth = 1;
  let i = start;
  while (i < end) {
    i = topLevel(text, '{}', i, end);
    if (i >= end) {
      break;
    }
    depth += text[i] === '{' ? 1 : -1;
    if (depth === 0) {
      return i;
    }
    i++;
  }
  return end;
}

/** Splits at a character on the top level, e.g. a selector list at `,`. */
export function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (;;) {
    const index = topLevel(text, separator, start);
    parts.push(text.slice(start, index));
    if (index >= text.length) {
      return parts;
    }
    start = index + 1;
  }
}

function declaration(text: string): Declaration | undefined {
  const colon = text.indexOf(':');
  if (colon <= 0) {
    return undefined;
  }
  const name = text.slice(0, colon).trim();
  let value = text.slice(colon + 1).trim();
  const important = /!\s*important$/i.test(value);
  if (important) {
    value = value.replace(/!\s*important$/i, '').trim();
  }
  const custom = name.startsWith('--');
  if (!/^-?[\w-]+$/.test(name) || (!custom && !value)) {
    return undefined;
  }
  return { property: custom ? name : name.toLowerCase(), value, important };
}

/**
 * The declarations of a block or a `style` attribute, in order. Nested
 * rules are skipped.
 */
export function readDeclarations(
  text: string,
  start = 0,
  end = text.length,
  report?: Report
): Declaration[] {
  const declarations: Declaration[] = [];
  let i = start;
  while (i < end) {
    const index = topLevel(text, ';{', i, end);
    if (text[index] === '{' && index < end) {
      // A nested rule, with its selector: skipped.
      report?.('nested', text.slice(i, index).trim());
      i = blockEnd(text, index + 1, end) + 1;
      continue;
    }
    const read = declaration(text.slice(i, index));
    if (read) {
      declarations.push(read);
    }
    i = index + 1;
  }
  return declarations;
}

/**
 * Whether the rules of an at-rule apply: `@media` with one
 * `prefers-color-scheme` condition when it's the scheme (`other-scheme`
 * when it's the other one, which isn't reported), `@supports`
 * unless its condition starts with `not` (a current browser has what chart
 * styles test for), and `@layer` blocks, read in place. Other at-rules are
 * skipped.
 */
function applies(
  prelude: string,
  scheme: ColorScheme
): boolean | 'other-scheme' {
  const [, name = '', condition = ''] =
    /^@([\w-]+)\s*([\s\S]*)$/.exec(prelude) ?? [];
  switch (name.toLowerCase()) {
    case 'media': {
      const query = /^\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)$/i.exec(
        condition
      );
      return query
        ? query[1].toLowerCase() === scheme || 'other-scheme'
        : false;
    }
    case 'supports':
      return !/^not\b/i.test(condition);
    case 'layer':
      return true;
    default:
      return false;
  }
}

function readRules(
  text: string,
  start: number,
  end: number,
  scheme: ColorScheme,
  rules: StyleRule[],
  report?: Report
) {
  let i = start;
  while (i < end) {
    const index = topLevel(text, '{;}', i, end);
    const prelude = text.slice(i, index).trim();
    if (index >= end || text[index] !== '{') {
      // A statement (`@import …;`, `@layer a, b;`) or a stray character.
      // Only `@import` would have added rules.
      if (/^@import\b/i.test(prelude)) {
        report?.('at-rule', prelude);
      }
      i = index + 1;
      continue;
    }
    const close = blockEnd(text, index + 1, end);
    if (prelude.startsWith('@')) {
      const read = applies(prelude, scheme);
      if (read === true) {
        readRules(text, index + 1, close, scheme, rules, report);
      } else if (!read) {
        report?.('at-rule', prelude);
      }
    } else if (prelude) {
      rules.push({
        selectors: prelude,
        declarations: readDeclarations(text, index + 1, close, report)
      });
    }
    i = close + 1;
  }
}

/**
 * Reads the style rules of a stylesheet, in order, for a color scheme:
 * rules in `@media (prefers-color-scheme: …)` only when it matches, rules
 * in `@supports` and `@layer` blocks in place (ignoring layer order), and
 * none from other at-rules or nested rules.
 */
export function readStylesheet(
  css: string,
  scheme: ColorScheme,
  report?: Report
): StyleRule[] {
  const text = withoutComments(css);
  const rules: StyleRule[] = [];
  readRules(text, 0, text.length, scheme, rules, report);
  return rules;
}
