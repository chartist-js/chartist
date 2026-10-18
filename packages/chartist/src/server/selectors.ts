/**
 * Selector matching of `applyStyles()` against the scene tree: type,
 * class, `*` and attribute selectors (presence, `=`, `~=`), `:not()`,
 * `:is()` and `:where()`, descendant and child combinators. A selector
 * with anything else (`:hover`, `::before`, `#id`, `+`) matches nothing.
 */
import type { SceneNode } from '../index';
import { splitTopLevel, topLevel, type Report } from './css';

type Simple =
  | { readonly kind: 'type'; readonly name: string }
  | { readonly kind: 'class'; readonly name: string }
  | {
      readonly kind: 'attribute';
      readonly name: string;
      readonly operator?: '=' | '~=';
      readonly value?: string;
    }
  | {
      readonly kind: 'not' | 'is';
      readonly selectors: readonly Selector[];
    }
  /** `:root`: the page's root element, the `html` above the scene. */
  | { readonly kind: 'root' };

/** A complex selector, read right to left. */
export interface Selector {
  /** The compound selectors, the subject (rightmost) first. */
  readonly compounds: readonly (readonly Simple[])[];
  /** `combinators[i]` joins `compounds[i]` to `compounds[i + 1]`. */
  readonly combinators: readonly ('descendant' | 'child')[];
  /** Classes and attributes times 1000, plus types. */
  readonly specificity: number;
}

const CLASS = 1000;
const IDENT = /^-?(?:[\w-]|\\[0-9a-fA-F]{1,6}\s?|\\[\s\S]|[\u0080-\uffff])+/;

/** An identifier with its escapes resolved. */
const unescaped = (ident: string) =>
  ident.replace(/\\(?:([0-9a-fA-F]{1,6})\s?|([\s\S]))/g, (_, hex, char) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : char
  );

/** Reads an attribute selector's inside, `name` or `name="value"`. */
function attribute(text: string): Simple | undefined {
  const match =
    /^\s*([\w-]+)\s*(?:(~?=)\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(-?[\w-]+))\s*)?$/.exec(
      text
    );
  if (!match) {
    return undefined;
  }
  const [, name, operator, double, single, ident] = match;
  return operator
    ? {
        kind: 'attribute',
        name,
        operator: operator as '=' | '~=',
        value: unescaped(double ?? single ?? ident)
      }
    : { kind: 'attribute', name };
}

const highest = (selectors: readonly Selector[]) =>
  Math.max(0, ...selectors.map(selector => selector.specificity));

/**
 * Reads one complex selector, e.g. `.ct-series-a > .ct-line`.
 * `undefined` if it uses anything this matcher doesn't support.
 */
export function parseSelector(text: string): Selector | undefined {
  const compounds: Simple[][] = [];
  const combinators: ('descendant' | 'child')[] = [];
  let current: Simple[] = [];
  // Whether the current compound has begun; `*` adds no simple selector.
  let started = false;
  let specificity = 0;
  let pending: 'descendant' | 'child' | undefined;
  let i = 0;
  const source = text.trim();
  while (i < source.length) {
    const char = source[i];
    if (/\s/.test(char) || char === '>') {
      if (!started) {
        return undefined;
      }
      pending = char === '>' || pending === 'child' ? 'child' : 'descendant';
      i++;
      continue;
    }
    if (pending) {
      compounds.push(current);
      combinators.push(pending);
      current = [];
      started = false;
      pending = undefined;
    }
    const rest = source.slice(i);
    const first = !started;
    started = true;
    if (char === '*') {
      if (!first) {
        return undefined;
      }
      i++;
    } else if (char === '.') {
      const ident = IDENT.exec(rest.slice(1))?.[0];
      if (!ident) {
        return undefined;
      }
      current.push({ kind: 'class', name: unescaped(ident) });
      specificity += CLASS;
      i += 1 + ident.length;
    } else if (char === '[') {
      const close = topLevel(source, ']', i + 1);
      const simple = attribute(source.slice(i + 1, close));
      if (!simple || close >= source.length) {
        return undefined;
      }
      current.push(simple);
      specificity += CLASS;
      i = close + 1;
    } else if (/^:root(?![\w(-])/i.test(rest)) {
      current.push({ kind: 'root' });
      specificity += CLASS;
      i += 5;
    } else if (char === ':') {
      const name = /^:([\w-]+)\(/.exec(rest)?.[1].toLowerCase();
      if (name !== 'not' && name !== 'is' && name !== 'where') {
        return undefined;
      }
      const open = i + name.length + 2;
      const close = topLevel(source, ')', open);
      if (close >= source.length) {
        return undefined;
      }
      const parts = splitTopLevel(source.slice(open, close), ',').map(
        parseSelector
      );
      const selectors = parts.filter(
        (selector): selector is Selector => selector !== undefined
      );
      // :not() can't tell what an unsupported selector would exclude;
      // :is() and :where() forgive them, as in a browser.
      if (
        name === 'not' ? selectors.length < parts.length : !selectors.length
      ) {
        return undefined;
      }
      current.push({ kind: name === 'not' ? 'not' : 'is', selectors });
      specificity += name === 'where' ? 0 : highest(selectors);
      i = close + 1;
    } else {
      const ident = IDENT.exec(rest)?.[0];
      if (!ident || !first) {
        return undefined;
      }
      current.push({ kind: 'type', name: unescaped(ident) });
      specificity += 1;
      i += ident.length;
    }
  }
  if (pending || !started) {
    return undefined;
  }
  compounds.push(current);
  return {
    compounds: compounds.reverse(),
    combinators: combinators.reverse(),
    specificity
  };
}

function matchesSimple(
  simple: Simple,
  path: readonly SceneNode[],
  index: number
): boolean {
  const element = path[index];
  switch (simple.kind) {
    case 'type':
      return element.name === simple.name;
    case 'class':
      return element.classes.includes(simple.name);
    case 'attribute': {
      const raw =
        simple.name === 'class'
          ? element.classes.length
            ? element.classes.join(' ')
            : undefined
          : element.attrs[simple.name];
      if (raw === undefined) {
        return false;
      }
      const value = String(raw);
      if (simple.operator === '=') {
        return value === simple.value;
      }
      if (simple.operator === '~=') {
        return value.split(/\s+/).includes(simple.value ?? '');
      }
      return true;
    }
    case 'not':
      return !simple.selectors.some(selector =>
        matchesAt(selector, path, index)
      );
    case 'is':
      return simple.selectors.some(selector =>
        matchesAt(selector, path, index)
      );
    case 'root':
      return index === 0;
  }
}

function matchesFrom(
  selector: Selector,
  part: number,
  path: readonly SceneNode[],
  index: number
): boolean {
  if (!selector.compounds[part].every(s => matchesSimple(s, path, index))) {
    return false;
  }
  if (part === selector.compounds.length - 1) {
    return true;
  }
  if (selector.combinators[part] === 'child') {
    return index > 0 && matchesFrom(selector, part + 1, path, index - 1);
  }
  for (let ancestor = index - 1; ancestor >= 0; ancestor--) {
    if (matchesFrom(selector, part + 1, path, ancestor)) {
      return true;
    }
  }
  return false;
}

/** Whether a selector matches `path[index]`, with its ancestors before it. */
const matchesAt = (
  selector: Selector,
  path: readonly SceneNode[],
  index: number
) => matchesFrom(selector, 0, path, index);

/**
 * Whether a selector matches the last node of `path`, a node with its
 * ancestors, the outermost first (the page's `html` in `computeStyles()`).
 */
export const matches = (selector: Selector, path: readonly SceneNode[]) =>
  matchesAt(selector, path, path.length - 1);

/**
 * Pseudo-elements (`::before`, and `:before`-style ones): content SVG
 * elements don't have, so their rules style nothing in a scene.
 */
const PSEUDO_ELEMENT = /::|:(?:before|after|first-line|first-letter)(?![\w-])/i;

/**
 * Reads a selector list, e.g. a rule's `.a, .b > .c`. Selectors it can't
 * match are left out, and reported, except pseudo-elements, which can't
 * apply to a scene at all.
 */
export function parseSelectorList(text: string, report?: Report): Selector[] {
  const selectors: Selector[] = [];
  for (const part of splitTopLevel(text, ',')) {
    const selector = parseSelector(part);
    if (selector) {
      selectors.push(selector);
    } else if (!PSEUDO_ELEMENT.test(part)) {
      report?.('selector', part.trim());
    }
  }
  return selectors;
}
