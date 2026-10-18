/**
 * The cascade of `computeStyles()`: which declaration wins per element and
 * property, and the computed custom properties each element inherits.
 */
import type { SceneNode } from '../index';
import {
  readDeclarations,
  readStylesheet,
  type ColorScheme,
  type Declaration,
  type Report
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
  /** The declaration as read, the same for every element it applies to. */
  readonly source: Declaration;
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
  scheme: ColorScheme,
  report?: Report
): Rule[] {
  return sheets
    .flatMap(css => readStylesheet(css, scheme, report))
    .map((rule, order) => {
      for (const { property, value } of rule.declarations) {
        // Not expanded into its longhands, which are presentation properties.
        if (property === 'font') {
          report?.('shorthand', `${property}: ${value}`);
        }
      }
      return {
        selectors: parseSelectorList(rule.selectors, report),
        declarations: rule.declarations,
        order
      };
    })
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
          source: declaration,
          inline: false,
          specificity,
          order: rule.order * PER_RULE + index
        })
      );
    }
  }
  style.forEach((declaration, index) =>
    offer({
      ...declaration,
      source: declaration,
      inline: true,
      specificity: 0,
      order: index
    })
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
 * Properties that inherit: the ones the page's `html` and `body` pass on
 * to the scene's root.
 */
const INHERITED = /* @__PURE__ */ new Set([
  'color',
  'cursor',
  'direction',
  'dominant-baseline',
  'fill',
  'fill-opacity',
  'fill-rule',
  'font-family',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'letter-spacing',
  'paint-order',
  'pointer-events',
  'shape-rendering',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'text-rendering',
  'visibility',
  'word-spacing',
  'writing-mode'
]);

/** The values of the presentation properties an element gets. */
export type Values = Readonly<Record<string, string>>;

/**
 * The presentation values of every SVG element of the scene, matched below
 * a page's `html` and `body`: their custom properties are inherited, and
 * their inherited properties reach the root. Elements inside a
 * `foreignObject` get none.
 */
export function computeValues(
  scene: SceneNode,
  rules: readonly Rule[],
  scheme: ColorScheme,
  report?: Report
): WeakMap<SceneNode, Values> {
  const out = new WeakMap<SceneNode, Values>();
  const reported = new Set<Declaration>();
  const valueOf = (
    candidate: Candidate,
    custom: ReadonlyMap<string, string>
  ) => {
    const value = resolve(candidate.value, custom, scheme);
    // Once per declaration, not per element it applies to.
    if (value === undefined && report && !reported.has(candidate.source)) {
      reported.add(candidate.source);
      report('value', `${candidate.property}: ${candidate.value}`);
    }
    return value;
  };

  // The page around the scene.
  const page: SceneNode[] = [];
  const passed = new Map<string, string>();
  let custom = new Map<string, string>();
  // Only matched, never rendered: what selectors read of an element.
  const element = (name: string) =>
    ({ name, attrs: {}, classes: [], children: [] }) as unknown as SceneNode;
  for (const pageElement of [element('html'), element('body')]) {
    page.push(pageElement);
    const winners = cascade(rules, page, []);
    custom = customProperties(winners, custom);
    for (const [property, winner] of winners) {
      if (INHERITED.has(property)) {
        const value = valueOf(winner, custom);
        if (value !== undefined) {
          passed.set(property, value);
        }
      }
    }
  }

  const walk = (
    current: SceneNode,
    ancestors: readonly SceneNode[],
    inherited: ReadonlyMap<string, string>
  ) => {
    const path = [...ancestors, current];
    const style =
      current.attrs.style === undefined
        ? []
        : readDeclarations(String(current.attrs.style));
    const winners = cascade(rules, path, style);
    const own = customProperties(winners, inherited);
    const values: Record<string, string> = {};
    for (const [property, winner] of winners) {
      if (isPresentation(property)) {
        const value = valueOf(winner, own);
        if (value !== undefined) {
          values[property] = value;
        }
      }
    }
    if (current === scene) {
      for (const [property, value] of passed) {
        values[property] ??= value;
      }
    }
    if (Object.keys(values).length) {
      out.set(current, values);
    }
    if (current.name !== 'foreignObject') {
      current.children.forEach(child => walk(child, path, own));
    }
  };
  walk(scene, page, custom);
  return out;
}
