import { readFileSync } from 'node:fs';
import {
  BUILDS,
  EXPERIMENTAL_FILE,
  experimentalNames,
  type BuildName
} from './exports/read.ts';

const build = (process.env.CHARTIST_API_TARGET ?? 'local') as BuildName;
const list: Record<'chartist' | 'compat' | 'live' | 'server', string[]> =
  JSON.parse(readFileSync(EXPERIMENTAL_FILE, 'utf8'));

// chartist@1.5.0 has no experimental marks; the checks are for the build.
const local = build === 'local' ? describe : describe.skip;

local(`experimental names in the declarations (${BUILDS[build]})`, () => {
  test.each([
    ['chartist', 'index.d.ts'],
    ['chartist', 'index.d.cts'],
    ['compat', 'compat.d.ts'],
    ['compat', 'compat.d.cts'],
    ['live', 'live.d.ts'],
    ['live', 'live.d.cts'],
    ['server', 'server.d.ts'],
    ['server', 'server.d.cts']
  ] as const)('%s: %s marks exactly the listed names', (entry, file) => {
    expect(experimentalNames(build, file)).toEqual(list[entry]);
  });
});
