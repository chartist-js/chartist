import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Chartist from 'chartist';
import {
  cjsNames,
  diffNames,
  readList,
  typeNames,
  umdNames,
  type BuildName
} from './exports/read.ts';

const build = (process.env.CHARTIST_API_TARGET ?? 'local') as BuildName;
const list = readList();
const NONE = { listedButNotExported: [], exportedButNotListed: [] };
const UPDATE =
  'If the change is intended, run pnpm nx run chartist:test:api:update-exports';

// The list also holds the v2 exports, which chartist@1.5.0 doesn't have. For
// v1 the exact checks are skipped; "every 1.5.0 export is recorded" remains.
const exact = build === 'v1' ? test.skip : test;

describe(`export surface (${build})`, () => {
  exact('ESM exports match the recorded list', () => {
    const names = Object.keys(Chartist).filter(name => name !== 'default');
    expect(diffNames(list.runtime, names), UPDATE).toEqual(NONE);
  });

  exact('CJS exports match the recorded list', () => {
    expect(diffNames(list.runtime, cjsNames(build)), UPDATE).toEqual(NONE);
  });

  exact('the UMD global Chartist matches the recorded list', () => {
    expect(diffNames(list.runtime, umdNames(build)), UPDATE).toEqual(NONE);
  });

  exact(
    'declaration exports (values and types) match the recorded list',
    () => {
      expect(diffNames(list.types, typeNames(build)), UPDATE).toEqual(NONE);
    }
  );

  test('every chartist@1.5.0 export is recorded', () => {
    const removed = (v1: string[], listed: string[]) =>
      v1.filter(name => !listed.includes(name));
    expect(
      removed(umdNames('v1'), list.runtime),
      '1.5.0 runtime exports missing from the list'
    ).toEqual([]);
    expect(
      removed(typeNames('v1'), list.types),
      '1.5.0 type exports missing from the list'
    ).toEqual([]);
  });

  test('every runtime export is used by a behavior or type test', () => {
    const apiDir = path.dirname(fileURLToPath(import.meta.url));
    const imported = new Set(
      readdirSync(apiDir)
        .filter(file => /\.(api|test-d)\.ts$/.test(file))
        .flatMap(file =>
          [
            ...readFileSync(path.join(apiDir, file), 'utf8').matchAll(
              /import\s*\{([^}]*)\}\s*from\s*'chartist'/g
            )
          ].flatMap(match =>
            match[1]
              .split(',')
              .map(name => name.trim())
              .filter(name => name && !name.startsWith('type '))
          )
        )
    );
    expect(list.runtime.filter(name => !imported.has(name))).toEqual([]);
  });
});
