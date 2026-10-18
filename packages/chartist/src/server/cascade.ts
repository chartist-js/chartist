/**
 * The cascade of `applyStyles()`: which declaration wins per element and
 * property, and the computed custom properties each element inherits.
 */
import type { AttrValue, SceneNode } from '../index';
import {
  readDeclarations,
  readStylesheet,
  type ColorScheme,
  type Declaration
} from './css';
import { isPresentation } from './presentation';
import { matches, parseSelectorList, type Selector } from './selectors';
import { CYCLE, lightDark, substitute } from './values';

interface Rule {
  readonly selectors: readonly Selector[];
  readonly declarations: readonly Declaration[];
  /** The rule's place across all stylesheets. */
  readonly order: number;
}

/** Room for the declarations of one rule in the order of candidates. */
const PER_RULE = 1e4;

/** A declaration that applies to an element, with what ranks it. */
interface Candidate extends Declaration {
  /** From the element's own `style` attribute. */
  readonly inline: boolean;
  readonly specificity: number;
  readonly order: number;
}

/** `!important` first, then the `style` attribute, specificity, order. */
const wins = (a: Candidate, b: Candidate) =>
  a.important !== b.important
    ? a.important
    : a.inline !== b.inline
      ? a.inline
      : a.specificity !== b.specificity
        ? a.specificity > b.specificity
        : a.order > b.order;

/** The style rules of the stylesheets, in order, with parsed selectors. */
export function readRules(
  sheets: readonly string[],
  scheme: ColorScheme
): Rule[] {
  return sheets
    .flatMap(css => readStylesheet(css, scheme))
    .map((rule, order) => ({
      selectors: parseSelectorList(rule.selectors),
      declarations: rule.declarations,
      order
    }))
    .filter(rule => rule.selectors.length && rule.declarations.length);
}

/** The winning declaration per property for the last node of `path`. */
function cascade(
  rules: readonly Rule[],
  path: readonly SceneNode[],
  style: readonly Declaration[]
): Map<string, Candidate> {
  const winners = new Map<string, Candidate>();
  const offer = (candidate: Candidate) => {
    const current = winners.get(candidate.property);
    if (!current || wins(candidate, current)) {
      winners.set(candidate.property, candidate);
    }
  };
  for (const rule of rules) {
    const matching = rule.selectors.filter(selector => matches(selector, path));
    if (matching.length) {
      const specificity = Math.max(...matching.map(s => s.specificity));
      rule.declarations.forEach((declaration, index) =>
        offer({
          ...declaration,
          inline: false,
          specificity,
          order: rule.order * PER_RULE + index
        })
      );
    }
  }
  style.forEach((declaration, index) =>
    offer({ ...declaration, inline: true, specificity: 0, order: index })
  );
  return winners;
}

/**
 * The element's custom properties: the inherited ones, overridden by the
 * ones it declares, resolved. A property in a cycle, or with a `var()` that
 * can't be resolved, isn't set, as in a browser.
 */
function customProperties(
  winners: ReadonlyMap<string, Candidate>,
  inherited: ReadonlyMap<string, string>
): Map<string, string> {
  const own = new Map(
    [...winners].filter(([property]) => property.startsWith('--'))
  );
  if (!own.size) {
    return new Map(inherited);
  }
  const resolved = new Map<string, string | typeof CYCLE | undefined>();
  const resolving = new Set<string>();
  const lookup = (name: string): string | typeof CYCLE | undefined => {
    const declared = own.get(name);
    if (!declared) {
      return inherited.get(name);
    }
    if (resolved.has(name)) {
      return resolved.get(name);
    }
    if (resolving.has(name)) {
      return CYCLE;
    }
    resolving.add(name);
    const value = substitute(declared.value, lookup);
    resolving.delete(name);
    resolved.set(name, value);
    return value;
  };
  const computed = new Map(inherited);
  for (const name of own.keys()) {
    const value = lookup(name);
    if (typeof value === 'string') {
      computed.set(name, value);
    } else {
      computed.delete(name);
    }
  }
  return computed;
}

/** A property's value without `var()` and `light-dark()`, if it resolves. */
function resolve(
  value: string,
  custom: ReadonlyMap<string, string>,
  scheme: ColorScheme
): string | undefined {
  const substituted = substitute(value, name => custom.get(name));
  const plain =
    typeof substituted === 'string'
      ? lightDark(substituted, scheme)?.trim()
      : undefined;
  return plain && !/(?<![\w-])(?:var|light-dark)\(/i.test(plain)
    ? plain
    : undefined;
}

/**
 * The node with the presentation attributes the rules give it, and its
 * children styled the same way, except inside a `foreignObject`.
 */
export function styled(
  current: SceneNode,
  ancestors: readonly SceneNode[],
  inherited: ReadonlyMap<string, string>,
  rules: readonly Rule[],
  scheme: ColorScheme
): SceneNode {
  const path = [...ancestors, current];
  const style =
    current.attrs.style === undefined
      ? []
      : readDeclarations(String(current.attrs.style));
  const winners = cascade(rules, path, style);
  const custom = customProperties(winners, inherited);

  const attrs: Record<string, AttrValue | undefined> = {};
  // Declarations of the `style` attribute that an !important rule beats.
  const beaten = new Set<string>();
  for (const [property, winner] of winners) {
    if (!winner.inline && isPresentation(property)) {
      const value = resolve(winner.value, custom, scheme);
      if (value !== undefined) {
        attrs[property] = value;
        if (style.some(declaration => declaration.property === property)) {
          beaten.add(property);
        }
      }
    }
  }
  if (beaten.size) {
    const kept = style.filter(declaration => !beaten.has(declaration.property));
    attrs.style = kept.length
      ? kept
          .map(
            ({ property, value, important }) =>
              `${property}: ${value}${important ? ' !important' : ''};`
          )
          .join(' ')
      : undefined;
  }
  let next = Object.keys(attrs).length ? current.attr(attrs) : current;

  if (current.name !== 'foreignObject' && current.children.length) {
    const children = current.children.map(child =>
      styled(child, path, custom, rules, scheme)
    );
    if (children.some((child, index) => child !== current.children[index])) {
      next = children.reduce(
        (parent, child) => parent.append(child),
        next.empty()
      );
      if (current.content !== undefined) {
        next = next.text(current.content);
      }
    }
  }
  return next;
}
