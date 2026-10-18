/**
 * Turns the SVG Mermaid renders into one the site styles: Mermaid's own
 * `<style>` element and inline styles go, the colors it writes into
 * attributes become design tokens (`var(--token)`), and every id carries the
 * diagram's prefix, so two diagrams on a page never share one. The site's
 * `diagrams.css` does the rest, in light and dark mode, so one SVG serves
 * both. Works on Mermaid's serialized markup, without a DOM, so it runs in
 * Node and in unit tests.
 */

/**
 * The colors Mermaid renders with: one distinct value per theme variable,
 * each standing for a token. Mermaid's theme variables take hex colors only
 * (it derives shades from them), so the tokens can't be passed directly;
 * the colors that end up in attributes are replaced with the tokens after
 * rendering. The values are near-black shades no token uses.
 */
export const THEME_COLORS = {
  background: { color: '#0d1a01', token: '--surface' },
  primaryColor: { color: '#0d1a02', token: '--surface' },
  primaryBorderColor: { color: '#0d1a03', token: '--ink' },
  primaryTextColor: { color: '#0d1a04', token: '--ink' },
  secondaryColor: { color: '#0d1a05', token: '--bg-sunken' },
  tertiaryColor: { color: '#0d1a06', token: '--bg-sunken' },
  lineColor: { color: '#0d1a07', token: '--ink-2' },
  textColor: { color: '#0d1a08', token: '--ink' },
  mainBkg: { color: '#0d1a09', token: '--surface' },
  nodeBorder: { color: '#0d1a0a', token: '--ink' },
  clusterBkg: { color: '#0d1a0b', token: '--bg-sunken' },
  clusterBorder: { color: '#0d1a0c', token: '--line-strong' },
  edgeLabelBackground: { color: '#0d1a0d', token: '--bg' },
  noteBkgColor: { color: '#0d1a0e', token: '--warn-bg' },
  noteBorderColor: { color: '#0d1a0f', token: '--line-strong' },
  noteTextColor: { color: '#0d1a10', token: '--ink' },
  actorBkg: { color: '#0d1a11', token: '--surface' },
  actorBorder: { color: '#0d1a12', token: '--ink' },
  actorTextColor: { color: '#0d1a13', token: '--ink' },
  actorLineColor: { color: '#0d1a14', token: '--line-strong' },
  signalColor: { color: '#0d1a15', token: '--ink-2' },
  signalTextColor: { color: '#0d1a16', token: '--ink' },
  labelBoxBkgColor: { color: '#0d1a17', token: '--bg-sunken' },
  labelBoxBorderColor: { color: '#0d1a18', token: '--line-strong' },
  labelTextColor: { color: '#0d1a19', token: '--ink' },
  loopTextColor: { color: '#0d1a1a', token: '--ink' },
  activationBkgColor: { color: '#0d1a1b', token: '--bg-sunken' },
  activationBorderColor: { color: '#0d1a1c', token: '--line-strong' },
  sequenceNumberColor: { color: '#0d1a1d', token: '--on-brand' },
  transitionColor: { color: '#0d1a1e', token: '--ink-2' },
  transitionLabelColor: { color: '#0d1a1f', token: '--ink' },
  stateLabelColor: { color: '#0d1a20', token: '--ink' },
  stateBkg: { color: '#0d1a21', token: '--surface' },
  labelBackgroundColor: { color: '#0d1a22', token: '--bg' },
  compositeBackground: { color: '#0d1a23', token: '--bg-sunken' },
  compositeTitleBackground: { color: '#0d1a24', token: '--bg-sunken' },
  compositeBorder: { color: '#0d1a25', token: '--line-strong' },
  innerEndBackground: { color: '#0d1a26', token: '--ink' },
  specialStateColor: { color: '#0d1a27', token: '--ink' },
  arrowheadColor: { color: '#0d1a28', token: '--ink-2' },
  titleColor: { color: '#0d1a29', token: '--ink' },
  nodeTextColor: { color: '#0d1a2a', token: '--ink' },
  defaultLinkColor: { color: '#0d1a2b', token: '--ink-2' }
} as const;

/**
 * Colors Mermaid writes into attributes regardless of the theme, for
 * elements `diagrams.css` styles anyway (sequence diagrams' actors, notes,
 * activations and arrowheads, drop shadows): mapped to the closest token, so
 * the attribute agrees with the stylesheet.
 */
export const MERMAID_FIXED_COLORS: Readonly<Record<string, string>> = {
  '#eaeaea': '--surface',
  '#edf2ae': '--warn-bg',
  '#666': '--line-strong',
  '#999': '--line-strong',
  '#000': '--ink',
  '#000000': '--ink',
  black: '--ink',
  white: '--surface'
};

/** The theme variables Mermaid renders with. */
export const themeVariables = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(THEME_COLORS).map(([name, { color }]) => [name, color])
  );

const TOKENS: ReadonlyMap<string, string> = new Map([
  ...Object.values(THEME_COLORS).map(
    ({ color, token }) => [color, token] as const
  ),
  ...Object.entries(MERMAID_FIXED_COLORS)
]);

/** Attributes that hold a color. */
const COLOR_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'color',
  'stop-color',
  'flood-color',
  'lighting-color'
]);

/** Values of color attributes that aren't colors of their own. */
const NEUTRAL =
  /^(none|transparent|currentcolor|inherit|url\(#[^)]*\)|var\(--[\w-]+\))$/i;

/** A color in CSS text: hex, a color function or a named color Mermaid uses. */
const CSS_COLOR =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|\b(?:black|white|red|green|blue|gray|grey|yellow|orange|purple)\b/i;

/** The result: the SVG and the size Mermaid laid it out at. */
export interface DiagramSvg {
  readonly svg: string;
  /** The rendered width in CSS pixels: the diagram is never drawn wider. */
  readonly width: number;
  readonly height: number;
}

interface Attribute {
  readonly name: string;
  readonly value: string | undefined;
}

const ATTRIBUTE = /\s([^\s=/>]+)(?:="([^"]*)")?/g;
const START_TAG = /<([a-zA-Z][\w:-]*)((?:\s[^\s=/>]+(?:="[^"]*")?)*)\s*(\/?)>/g;

const parseAttributes = (text: string): Attribute[] =>
  [...text.matchAll(ATTRIBUTE)].map(([, name, value]) => ({ name, value }));

const serializeAttributes = (attributes: readonly Attribute[]) =>
  attributes
    .map(({ name, value }) =>
      value === undefined ? ` ${name}` : ` ${name}="${value}"`
    )
    .join('');

/** Rewrites every start tag's attributes with `transform`. */
const mapStartTags = (
  svg: string,
  transform: (tag: string, attributes: Attribute[]) => Attribute[]
) =>
  svg.replace(
    START_TAG,
    (_, tag: string, attributes: string, selfClosing: string) =>
      `<${tag}${serializeAttributes(transform(tag, parseAttributes(attributes)))}${selfClosing}>`
  );

/** The token for a color Mermaid wrote, or undefined when there's none. */
const tokenFor = (color: string) => TOKENS.get(color.trim().toLowerCase());

/** Inline declarations that place text, not style it: kept as attributes. */
const LAYOUT_PROPERTIES = new Set(['text-anchor', 'dominant-baseline']);

const declarationsOf = (style: string) =>
  style
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map(declaration => ({
      property: declaration
        .slice(0, declaration.indexOf(':'))
        .trim()
        .toLowerCase(),
      value: declaration
        .slice(declaration.indexOf(':') + 1)
        .replace(/!important/, '')
        .trim(),
      text: declaration
    }));

/**
 * Removes Mermaid's `<style>` elements and inline `style` attributes. The
 * text's anchor and baseline are layout, so they become attributes. A
 * color in an inline style that isn't one of Mermaid's own (from a `style`
 * or `classDef` line in the source) fails: use the emphasis classes instead.
 */
export const removeStyles = (svg: string): string =>
  mapStartTags(
    svg.replace(/<style[^>]*>[\s\S]*?<\/style>/g, ''),
    (_, attributes) => {
      const style = attributes.find(({ name }) => name === 'style');
      if (!style) {
        return attributes;
      }
      const kept = attributes.filter(attribute => attribute !== style);
      for (const { property, value, text } of declarationsOf(
        style.value ?? ''
      )) {
        if (CSS_COLOR.test(text) && tokenFor(value) === undefined) {
          throw new Error(
            `the color in "${text}" has no token. Use the classes brand, accent, muted or code instead of style or classDef colors.`
          );
        }
        if (
          LAYOUT_PROPERTIES.has(property) &&
          !kept.some(({ name }) => name === property)
        ) {
          kept.push({ name: property, value });
        }
      }
      return kept;
    }
  );

/**
 * Replaces the colors in color attributes with their tokens, and fails on a
 * color that has none.
 */
export const mapColors = (svg: string): string =>
  mapStartTags(svg, (tag, attributes) =>
    attributes.map(attribute => {
      const { name, value } = attribute;
      if (
        !COLOR_ATTRIBUTES.has(name) ||
        value === undefined ||
        NEUTRAL.test(value.trim())
      ) {
        return attribute;
      }
      const token = tokenFor(value);
      if (token === undefined) {
        throw new Error(
          `the color ${name}="${value}" on a <${tag}> has no token.`
        );
      }
      return { name, value: `var(${token})` };
    })
  );

/**
 * Removes gradients and filters nothing refers to: Mermaid defines them for
 * its other looks, with colors derived from the theme.
 */
export const removeUnusedDefinitions = (svg: string): string =>
  svg.replace(
    /<(linearGradient|radialGradient|filter)\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g,
    (definition, _tag, id: string) =>
      svg.includes(`url(#${id})`) || svg.includes(`href="#${id}"`)
        ? definition
        : ''
  );

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Gives every id without the diagram's prefix one (Mermaid leaves some
 * unprefixed, like the sequence diagram's `actor0`), together with the
 * references to it, then checks that every id has it.
 */
export const prefixIds = (svg: string, prefix: string): string => {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
  let result = svg;
  for (const id of new Set(ids.filter(name => !name.includes(prefix)))) {
    const renamed = `${prefix}-${id}`;
    const pattern = escapeRegExp(id);
    result = result
      .replace(new RegExp(`(\\sid=")${pattern}"`, 'g'), `$1${renamed}"`)
      .replace(new RegExp(`(url\\(#)${pattern}\\)`, 'g'), `$1${renamed})`)
      .replace(new RegExp(`(href="#)${pattern}"`, 'g'), `$1${renamed}"`)
      .replace(
        new RegExp(`(\\saria-[a-z]+="(?:[^"]*\\s)?)${pattern}(?=[\\s"])`, 'g'),
        `$1${renamed}`
      );
  }
  const unprefixed = [...result.matchAll(/\sid="([^"]+)"/g)]
    .map(([, id]) => id)
    .filter(id => !id.includes(prefix));
  if (unprefixed.length > 0) {
    throw new Error(
      `the ids ${unprefixed.join(', ')} have no prefix ${prefix}.`
    );
  }
  return result;
};

const rootTag = (svg: string) => {
  const match = /^\s*<svg\b[^>]*>/.exec(svg);
  if (!match) {
    throw new Error('the output is not an svg element.');
  }
  return match[0];
};

const attributeOf = (tag: string, name: string) =>
  new RegExp(`\\s${escapeRegExp(name)}="([^"]*)"`).exec(tag)?.[1];

/**
 * Checks what assistive technology reads: the root's role, and the title
 * and description its aria attributes point to.
 */
export const checkAccessibility = (svg: string): void => {
  const root = rootTag(svg);
  if (!attributeOf(root, 'role')?.includes('graphics-document')) {
    throw new Error('the svg has no graphics-document role.');
  }
  for (const [attribute, element, line] of [
    ['aria-labelledby', 'title', 'accTitle'],
    ['aria-describedby', 'desc', 'accDescr']
  ] as const) {
    const id = attributeOf(root, attribute);
    const text =
      id &&
      new RegExp(
        `<${element} id="${escapeRegExp(id)}">([^<]*)</${element}>`
      ).exec(svg)?.[1];
    if (!text?.trim()) {
      throw new Error(
        `the svg has no <${element}>: give the source an ${line}.`
      );
    }
  }
};

/**
 * Prepends a copy of each flowchart and state node's box, with the class
 * `diagram-shadow`, for the print-offset shadow of the site's cards (a CSS
 * filter isn't drawn on SVG shapes in every browser).
 */
export const addShadows = (svg: string): string =>
  svg.replace(
    /(<g class="node\b[^"]*"[^>]*>)(<(rect|polygon|circle|ellipse|path)\b[^>]*\bclass="[^"]*\blabel-container\b[^>]*>(?:<\/\3>)?|<g\b[^>]*\bclass="[^"]*\blabel-container\b[^>]*>(?:(?!<\/?g\b)[\s\S])*<\/g>)/g,
    (_, group: string, shape: string) =>
      `${group}<g class="diagram-shadow" aria-hidden="true">${shape.replace(/\sid="[^"]*"/g, '')}</g>${shape}`
  );

/**
 * Moves the groups' titles (`cluster-label`) to the end of their diagram
 * root, above the lines: Mermaid draws them before the edges, so a line
 * that enters a group from above crosses its title.
 */
export const raiseClusterLabels = (svg: string): string => {
  interface Root {
    readonly labels: string[];
    close?: number;
  }
  const roots: Root[] = [];
  const stack: { readonly root?: Root; readonly label?: { start: number } }[] =
    [];
  const removed: [number, number][] = [];
  const tags = /<(\/?)g\b([^>]*)>/g;
  for (const match of svg.matchAll(tags)) {
    const [text, closing, attributes] = match;
    const index = match.index;
    if (!closing) {
      const className = /\sclass="([^"]*)"/.exec(attributes)?.[1] ?? '';
      const isRoot = /(^|\s)root(\s|$)/.test(className);
      const isLabel = /(^|\s)cluster-label(\s|$)/.test(className);
      const root = isRoot ? { labels: [] } : undefined;
      if (root) {
        roots.push(root);
      }
      stack.push({ root, label: isLabel ? { start: index } : undefined });
      continue;
    }
    const element = stack.pop();
    if (element?.label) {
      const owner = [...stack].reverse().find(entry => entry.root)?.root;
      if (owner) {
        const end = index + text.length;
        owner.labels.push(svg.slice(element.label.start, end));
        removed.push([element.label.start, end]);
      }
    }
    if (element?.root) {
      element.root.close = index;
    }
  }
  const edits = [
    ...removed.map(([start, end]) => ({ start, end, text: '' })),
    ...roots.flatMap(({ labels, close }) =>
      labels.length > 0 && close !== undefined
        ? [{ start: close, end: close, text: labels.join('') }]
        : []
    )
  ].sort((a, b) => b.start - a.start || b.end - a.end);
  let result = svg;
  for (const { start, end, text } of edits) {
    result = result.slice(0, start) + text + result.slice(end);
  }
  return result;
};

/** Horizontal room around a label on a line, in px. */
const EDGE_LABEL_PADDING = 6;

/**
 * Widens the background of the labels on lines, which Mermaid sizes to the
 * text, so the stylesheet can draw them as tags.
 */
export const padEdgeLabels = (svg: string): string =>
  svg.replace(
    /(<g class="edgeLabel"[^>]*>(?:<g\b[^>]*>)*)<rect class="background"([^>]*)>/g,
    (_, start: string, attributes: string) => {
      const x = Number(attributeOf(attributes, 'x'));
      const width = Number(attributeOf(attributes, 'width'));
      if (Number.isNaN(x) || Number.isNaN(width) || width === 0) {
        return `${start}<rect class="background"${attributes}>`;
      }
      const padded = attributes
        .replace(/\sx="[^"]*"/, ` x="${round(x - EDGE_LABEL_PADDING)}"`)
        .replace(
          /\swidth="[^"]*"/,
          ` width="${round(width + 2 * EDGE_LABEL_PADDING)}"`
        );
      return `${start}<rect class="background"${padded}>`;
    }
  );

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Sizes the root at the rendered size, with Mermaid's viewBox: the
 * stylesheet scales it down to the column (`max-width: 100%`, `height:
 * auto`) and never up. Returns the rendered size.
 */
const sizeRoot = (svg: string): DiagramSvg => {
  const root = rootTag(svg);
  const viewBox = attributeOf(root, 'viewBox')
    ?.split(/[\s,]+/)
    .map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox.some(Number.isNaN)) {
    throw new Error('the svg has no viewBox.');
  }
  const width = round(viewBox[2]);
  const height = round(viewBox[3]);
  const sized = root
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace(/^(\s*<svg)/, `$1 width="${width}" height="${height}"`);
  return { svg: svg.replace(root, sized), width, height };
};

/**
 * The whole post-processing, in order. `prefix` is the id the diagram was
 * rendered with. Throws an Error naming the problem.
 */
export const processSvg = (svg: string, prefix: string): DiagramSvg => {
  const neutral = removeUnusedDefinitions(removeStyles(svg));
  const result = padEdgeLabels(
    raiseClusterLabels(addShadows(prefixIds(mapColors(neutral), prefix)))
  );
  checkAccessibility(result);
  return sizeRoot(result);
};
