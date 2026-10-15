import { readFileSync } from 'node:fs';
import {
  BUILDS,
  DEPRECATED_FILE,
  deprecatedNames,
  typeNames,
  type BuildName
} from './exports/read.ts';

const build = (process.env.CHARTIST_API_TARGET ?? 'local') as BuildName;
const list: { deprecated: Record<string, string>; shared: string[] } =
  JSON.parse(readFileSync(DEPRECATED_FILE, 'utf8'));

// chartist@1.5.0 deprecates nothing of this; the checks are for the build.
const local = build === 'local' ? describe : describe.skip;

describe('deprecation list', () => {
  test('sorts every chartist@1.5.0 export exactly once', () => {
    const v1 = typeNames('v1');
    const deprecated = Object.keys(list.deprecated);
    expect(
      v1.filter(
        name => !deprecated.includes(name) && !list.shared.includes(name)
      ),
      'unsorted 1.5.0 exports'
    ).toEqual([]);
    expect(
      [...deprecated, ...list.shared].filter(name => !v1.includes(name)),
      'listed names that 1.5.0 does not export'
    ).toEqual([]);
    expect(
      deprecated.filter(name => list.shared.includes(name)),
      'names in both lists'
    ).toEqual([]);
  });
});

local(`deprecations in the declarations (${BUILDS[build]})`, () => {
  test.each(['index.d.ts', 'index.d.cts'])(
    '%s marks exactly the listed names, with their messages',
    file => {
      // easings has been deprecated since 1.x, as an alias of the export.
      const { easings: _, ...marked } = deprecatedNames(build, file);
      expect(marked).toEqual(list.deprecated);
    }
  );

  test.each(['compat.d.ts', 'compat.d.cts'])('%s marks nothing', file => {
    expect(deprecatedNames(build, file)).toEqual({});
  });
});
