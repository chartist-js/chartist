import { describe, expect, it } from 'vitest';
import {
  accessibleTitle,
  cacheKey,
  checkSource,
  chromiumError,
  diagramError,
  diagramId
} from './render';

const SOURCE = `flowchart TD
  accTitle: A flow
  accDescr: From a to b.
  a --> b`;

const SETTINGS = {
  mermaidVersion: '12.2.0',
  css: '.diagram {}',
  fontCss: '@font-face {}'
};

describe('diagramId', () => {
  it('derives the id from the source', () => {
    expect(diagramId(SOURCE)).toMatch(/^diagram-[0-9a-f]{10}$/);
    expect(diagramId(SOURCE)).toBe(diagramId(SOURCE));
    expect(diagramId(`${SOURCE}\n  b --> c`)).not.toBe(diagramId(SOURCE));
  });
});

describe('cacheKey', () => {
  it('stays the same for the same source and settings', () => {
    expect(cacheKey(SOURCE, SETTINGS)).toBe(cacheKey(SOURCE, { ...SETTINGS }));
  });

  it('changes with the source, the Mermaid version, the stylesheet and the fonts', () => {
    const key = cacheKey(SOURCE, SETTINGS);
    expect(cacheKey(`${SOURCE}\n`, SETTINGS)).not.toBe(key);
    expect(
      cacheKey(SOURCE, { ...SETTINGS, mermaidVersion: '12.3.0' })
    ).not.toBe(key);
    expect(
      cacheKey(SOURCE, { ...SETTINGS, css: '.diagram { font-size: 16px }' })
    ).not.toBe(key);
    expect(cacheKey(SOURCE, { ...SETTINGS, fontCss: '' })).not.toBe(key);
  });
});

describe('checkSource', () => {
  it('passes with a title and a description', () => {
    expect(() => checkSource(SOURCE)).not.toThrow();
    expect(() =>
      checkSource(
        SOURCE.replace(
          'accDescr: From a to b.',
          'accDescr {\n    From a to b.\n  }'
        )
      )
    ).not.toThrow();
  });

  it('fails without a title, naming the diagram by its first line and the page', () => {
    expect(() =>
      checkSource(SOURCE.replace(/ +accTitle.*\n/, ''), '/docs/flow/')
    ).toThrow(
      'The diagram starting "flowchart TD" on /docs/flow/: it has no accTitle.'
    );
  });

  it('fails without a description, naming the diagram by its title', () => {
    expect(() =>
      checkSource(SOURCE.replace(/ +accDescr.*\n/, ''), '/docs/flow/')
    ).toThrow('The diagram "A flow" on /docs/flow/: it has no accDescr.');
  });
});

describe('diagramError', () => {
  it("names the diagram, the page and Mermaid's message", () => {
    expect(
      diagramError(
        SOURCE,
        '/docs/flow/',
        "Mermaid can't render it: Parse error on line 4"
      ).message
    ).toBe(
      `The diagram "A flow" on /docs/flow/: Mermaid can't render it: Parse error on line 4`
    );
  });

  it('reads the title', () => {
    expect(accessibleTitle(SOURCE)).toBe('A flow');
  });

  it('names the install command when Chromium is missing', () => {
    expect(chromiumError("Executable doesn't exist").message).toBe(
      "Diagrams render in Playwright's Chromium, which didn't start. Install it once with `pnpm --dir apps/docs exec playwright install chromium`.\nExecutable doesn't exist"
    );
  });
});
