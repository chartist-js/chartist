import { readFileSync } from 'node:fs';
import recorded from './exports.json' with { type: 'json' };

// The built entries; `test` depends on `build`. An intended change to the
// exports updates exports.json in the same commit.
describe('exports', () => {
  it('the runtime exports are the recorded ones', async () => {
    const esm = (await import(
      // A computed URL: the build isn't there when the tests are type-checked.
      new URL('../dist/index.js', import.meta.url).href
    )) as Record<string, unknown>;
    expect(Object.keys(esm).sort()).toEqual(recorded.runtime);
  });

  it('the declared exports are the recorded ones', () => {
    const declarations = readFileSync(
      new URL('../dist/index.d.ts', import.meta.url),
      'utf8'
    );
    const exported = [
      ...[...declarations.matchAll(/^export declare \w+ (\w+)/gm)].map(
        match => match[1]
      ),
      ...[...declarations.matchAll(/^export (?:type )?\{([^}]*)\}/gm)].flatMap(
        match =>
          match[1].split(',').map(name =>
            name
              .trim()
              .split(/\s+as\s+/)
              .pop()!
          )
      )
    ]
      .filter(Boolean)
      .sort();
    expect(exported).toEqual([...recorded.runtime, ...recorded.types].sort());
  });
});
