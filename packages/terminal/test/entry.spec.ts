import { builtinModules } from 'node:module';
import { readFileSync } from 'node:fs';

/** Code without comments: the doc comments' examples use `process`. */
const withoutComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// The built API entries; `test` depends on `build`.
const entries = ['index.js', 'index.cjs'].map(file => ({
  file,
  code: withoutComments(
    readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8')
  )
}));

const builtins = new Set(
  builtinModules.flatMap(name => [name, `node:${name}`])
);

/** The specifiers a built file imports or requires. */
function specifiers(code: string): string[] {
  return [
    ...code.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g),
    ...code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)
  ].map(match => match[1]);
}

describe('API entry', () => {
  it.each(entries)('$file imports only chartist', ({ code }) => {
    const imported = specifiers(code);
    expect(imported).toContain('chartist');
    expect(imported.filter(name => builtins.has(name))).toEqual([]);
    expect(new Set(imported)).toEqual(new Set(['chartist']));
  });

  it.each(entries)('$file reads no Node.js globals', ({ code }) => {
    expect(code).not.toMatch(/\bprocess\.|\bBuffer\b|__dirname|__filename/);
  });
});

describe('API declarations', () => {
  // The package is stable: no export may change outside a major.
  it.each(['index.d.ts', 'index.d.cts'])(
    '%s marks nothing experimental',
    file => {
      const declarations = readFileSync(
        new URL(`../dist/${file}`, import.meta.url),
        'utf8'
      );
      expect(declarations).not.toMatch(/@experimental/);
    }
  );
});
