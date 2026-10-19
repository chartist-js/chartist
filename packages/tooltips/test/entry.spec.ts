// @vitest-environment node
import { readFileSync } from 'node:fs';

/** Code without comments: the doc comment's example imports chartist. */
const withoutComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// The built entries; `test` depends on `build`.
const entries = ['index.js', 'index.min.js', 'index.cjs'].map(file => ({
  file,
  code: withoutComments(
    readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8')
  )
}));

describe('entry', () => {
  // Only types come from chartist, so a CDN page needs no import map.
  it.each(entries)('$file imports nothing at runtime', ({ code }) => {
    expect(code).not.toMatch(/\bimport\s*[\w{*(]|\bfrom\s*["']|require\(/);
  });

  it.each(entries)('$file reads no Node.js globals', ({ code }) => {
    expect(code).not.toMatch(/\bprocess\.|\bBuffer\b|__dirname|__filename/);
  });

  it('exports tooltips() and nothing else at runtime', async () => {
    const esm = (await import(
      // A computed URL: the build isn't there when the tests are type-checked.
      new URL('../dist/index.js', import.meta.url).href
    )) as Record<string, unknown>;
    expect(Object.keys(esm)).toEqual(['tooltips']);
  });
});
