import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { diagramId } from './render';
import {
  addShadows,
  checkAccessibility,
  mapColors,
  padEdgeLabels,
  prefixIds,
  processSvg,
  raiseClusterLabels,
  removeStyles,
  removeUnusedDefinitions,
  THEME_COLORS
} from './svg';

/** Mermaid's SVG for each fixture, as recorded by fixtures.test.ts. */
const fixture = (type: string) => {
  const source = readFileSync(
    new URL(`fixtures/${type}.mmd`, import.meta.url),
    'utf8'
  );
  const svg = readFileSync(
    new URL(`fixtures/${type}.svg`, import.meta.url),
    'utf8'
  );
  return { id: diagramId(source), svg };
};

const TYPES = ['flowchart', 'sequence', 'state'];
const ids = (svg: string) =>
  [...svg.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);

describe('removeStyles', () => {
  it("removes Mermaid's style element and inline styles", () => {
    const svg = removeStyles(fixture('flowchart').svg);
    expect(svg).not.toContain('<style');
    expect(svg).not.toMatch(/\sstyle="/);
  });

  it('keeps the text anchor as an attribute', () => {
    expect(
      removeStyles(
        '<svg><text class="actor" style="text-anchor: middle; font-size: 15px;">A</text></svg>'
      )
    ).toBe('<svg><text class="actor" text-anchor="middle">A</text></svg>');
  });

  it("doesn't replace an anchor the element has", () => {
    expect(
      removeStyles(
        '<text text-anchor="start" style="text-anchor: middle">A</text>'
      )
    ).toBe('<text text-anchor="start">A</text>');
  });

  it('fails on a color from a style or classDef line', () => {
    expect(() =>
      removeStyles('<rect style="fill:#ff0000 !important;stroke:#333"></rect>')
    ).toThrow(/the color in "fill:#ff0000 !important" has no token/);
  });

  it("accepts Mermaid's own colors in inline styles", () => {
    expect(
      removeStyles(
        `<rect style="fill:${THEME_COLORS.primaryColor.color}"></rect>`
      )
    ).toBe('<rect></rect>');
  });
});

describe('mapColors', () => {
  it('replaces the theme colors and fixed colors with tokens', () => {
    expect(
      mapColors(
        `<rect fill="${THEME_COLORS.primaryColor.color}" stroke="#666"></rect><path stroke="black" fill="none"></path>`
      )
    ).toBe(
      '<rect fill="var(--surface)" stroke="var(--line-strong)"></rect><path stroke="var(--ink)" fill="none"></path>'
    );
  });

  it('leaves references and keywords', () => {
    const svg =
      '<path fill="url(#diagram-1-gradient)" stroke="currentColor"></path>';
    expect(mapColors(svg)).toBe(svg);
  });

  it('fails on a color without a token', () => {
    expect(() => mapColors('<rect fill="#123456"></rect>')).toThrow(
      'the color fill="#123456" on a <rect> has no token.'
    );
    expect(() =>
      mapColors('<stop stop-color="hsl(-120, 0%, 0%)"></stop>')
    ).toThrow(/has no token/);
  });

  it('leaves no color in any fixture', () => {
    for (const type of TYPES) {
      const svg = mapColors(
        removeUnusedDefinitions(removeStyles(fixture(type).svg))
      );
      expect(svg).not.toMatch(
        /(fill|stroke|stop-color|flood-color)="(#|rgb|hsl)/
      );
    }
  });
});

describe('removeUnusedDefinitions', () => {
  it('removes gradients and filters nothing refers to', () => {
    const svg =
      '<svg><linearGradient id="a"><stop></stop></linearGradient><filter id="b"><feDropShadow></feDropShadow></filter><rect filter="url(#b)"></rect></svg>';
    expect(removeUnusedDefinitions(svg)).toBe(
      '<svg><filter id="b"><feDropShadow></feDropShadow></filter><rect filter="url(#b)"></rect></svg>'
    );
  });
});

describe('prefixIds', () => {
  it('prefixes ids without the prefix, and the references to them', () => {
    expect(
      prefixIds(
        '<svg id="d-1"><line id="actor0"></line><use href="#actor0"></use><path marker-end="url(#actor0)"></path></svg>',
        'd-1'
      )
    ).toBe(
      '<svg id="d-1"><line id="d-1-actor0"></line><use href="#d-1-actor0"></use><path marker-end="url(#d-1-actor0)"></path></svg>'
    );
  });

  it("gives every id of the sequence fixture the diagram's prefix", () => {
    const { id, svg } = fixture('sequence');
    expect(ids(svg).some(name => !name.includes(id))).toBe(true);
    expect(ids(prefixIds(svg, id)).every(name => name.includes(id))).toBe(true);
  });

  it('keeps ids unique across diagrams on one page', () => {
    const all = TYPES.flatMap(type =>
      ids(processSvg(fixture(type).svg, fixture(type).id).svg)
    );
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('checkAccessibility', () => {
  const svg = (title: string, description: string) =>
    `<svg id="d" role="graphics-document document" aria-labelledby="t" aria-describedby="c"><title id="t">${title}</title><desc id="c">${description}</desc></svg>`;

  it('passes with a title and a description', () => {
    expect(() =>
      checkAccessibility(svg('A flow', 'How it flows.'))
    ).not.toThrow();
  });

  it('fails without a title or a description', () => {
    expect(() => checkAccessibility(svg('', 'How it flows.'))).toThrow(
      'the svg has no <title>: give the source an accTitle.'
    );
    expect(() => checkAccessibility(svg('A flow', ''))).toThrow(
      'the svg has no <desc>: give the source an accDescr.'
    );
  });

  it('fails without the role', () => {
    expect(() =>
      checkAccessibility(svg('A flow', 'How.').replace(/ role="[^"]*"/, ''))
    ).toThrow(/role/);
  });
});

describe('addShadows', () => {
  it('puts a copy of each box behind it', () => {
    expect(
      addShadows(
        '<g class="node default" id="n"><rect class="basic label-container" id="r" x="1"></rect><g class="label"></g></g>'
      )
    ).toBe(
      '<g class="node default" id="n"><g class="diagram-shadow" aria-hidden="true"><rect class="basic label-container" x="1"></rect></g><rect class="basic label-container" id="r" x="1"></rect><g class="label"></g></g>'
    );
  });

  it('copies boxes drawn as a group of paths', () => {
    const box =
      '<g class="basic label-container outer-path"><path d="M0"></path><path d="M1"></path></g>';
    expect(addShadows(`<g class="node accent">${box}</g>`)).toBe(
      `<g class="node accent"><g class="diagram-shadow" aria-hidden="true">${box}</g>${box}</g>`
    );
  });
});

describe('raiseClusterLabels', () => {
  it("moves the groups' titles above the lines", () => {
    expect(
      raiseClusterLabels(
        '<g class="root"><g class="clusters"><g class="cluster"><rect></rect><g class="cluster-label"><g><text>A</text></g></g></g></g><g class="edgePaths"></g></g>'
      )
    ).toBe(
      '<g class="root"><g class="clusters"><g class="cluster"><rect></rect></g></g><g class="edgePaths"></g><g class="cluster-label"><g><text>A</text></g></g></g>'
    );
  });
});

describe('padEdgeLabels', () => {
  it('widens the background of labels on lines', () => {
    expect(
      padEdgeLabels(
        '<g class="edgeLabel" transform="t"><g class="label"><g><rect class="background" x="-20" y="-2" width="40" height="24"></rect>'
      )
    ).toBe(
      '<g class="edgeLabel" transform="t"><g class="label"><g><rect class="background" x="-26" y="-2" width="52" height="24"></rect>'
    );
  });
});

describe('processSvg', () => {
  it.each(TYPES)('makes the %s fixture neutral', type => {
    const { id, svg: raw } = fixture(type);
    const { svg, width, height } = processSvg(raw, id);
    expect(svg).not.toContain('<style');
    expect(svg).not.toMatch(/\sstyle="/);
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}"|rgb\(|hsl\(/i);
    expect(svg).toMatch(/role="graphics-document document"/);
    const root = svg.slice(0, svg.indexOf('>'));
    expect(root).toContain(` id="${id}"`);
    expect(root).toContain(` width="${width}" height="${height}"`);
    expect(root).not.toContain('100%');
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
