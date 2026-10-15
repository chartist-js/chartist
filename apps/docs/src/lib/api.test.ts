/**
 * The API reference is complete: every
 * export on exactly one page, every v2 export and member described, every
 * 1.x export with a line, and no reference pointing nowhere. One test per
 * page, so each area can be checked on its own.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { PACKAGES } from '../data/packages';
import {
  ENTRIES,
  KIND,
  PACKAGE_ENTRIES,
  commentOf,
  entryMembers,
  linkToName,
  membersOf,
  pageOf,
  plainText,
  typeTokens,
  type ApiEntry
} from './api';
import { hasDefaults } from './api-defaults';
import { API_PAGES } from './api-pages';

const exportsOf = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(
        `../../../../packages/chartist/test/api/exports/${name}.json`,
        import.meta.url
      ),
      'utf8'
    )
  ) as { runtime: string[]; types: string[] };

const described = (reflection: Parameters<typeof commentOf>[0]) =>
  plainText(commentOf(reflection)?.summary).trim().length > 0;

/** What an entry still lacks, as readable lines. */
function problems(entry: ApiEntry): string[] {
  const found: string[] = [];
  const page = pageOf(entry.page);
  const legacy = page?.legacy || page?.compact;
  if (!described(entry.reflection)) {
    found.push(`${entry.name}: no description`);
  }
  if (legacy) {
    return found;
  }
  for (const member of entryMembers(entry)) {
    if (!described(member.signature ?? member.reflection)) {
      found.push(`${entry.name}.${member.name}: no description`);
    }
    if (hasDefaults(entry.name)) {
      for (const child of membersOf(member.type) ?? []) {
        if (!described(child.signature ?? child.reflection)) {
          found.push(
            `${entry.name}.${member.name}.${child.name}: no description`
          );
        }
      }
    }
  }
  if (entry.reflection.kind === KIND.Namespace) {
    for (const child of entry.reflection.children ?? []) {
      if (!described(child.signatures?.[0] ?? child)) {
        found.push(`${entry.name}.${child.name}: no description`);
      }
    }
  }
  return found;
}

/** Inline {@link} tags and type references that point nowhere. */
function deadLinks(entry: ApiEntry): string[] {
  const found: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach(item => visit(item, path));
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    const node = value as Record<string, unknown>;
    if (
      node.kind === 'inline-tag' &&
      node.target === undefined &&
      typeof node.tag === 'string' &&
      node.tag.startsWith('@link')
    ) {
      found.push(`${path}: {${node.tag} ${String(node.text)}} points nowhere`);
    }
    if (
      node.type === 'reference' &&
      typeof node.target === 'number' &&
      !ENTRIES.some(candidate =>
        contains(candidate.reflection, node.target as number)
      )
    ) {
      found.push(`${path}: type ${String(node.name)} isn't exported`);
    }
    // A package's reference to a chartist type links into the reference.
    // (The core model's own references to internal types stay plain text.)
    if (
      entry.pkg &&
      node.type === 'reference' &&
      node.package === 'chartist' &&
      typeof node.target === 'object' &&
      !linkToName(String(node.name))
    ) {
      found.push(`${path}: chartist type ${String(node.name)} has no entry`);
    }
    for (const [key, child] of Object.entries(node)) {
      // Where TypeDoc says a member comes from isn't a link readers see.
      if (
        ![
          'sources',
          'inheritedFrom',
          'implementationOf',
          'overwrites'
        ].includes(key)
      ) {
        visit(
          child,
          typeof node.name === 'string' && node.variant
            ? `${path}.${node.name}`
            : path
        );
      }
    }
  };
  visit(entry.reflection, entry.name);
  return [...new Set(found)];
}

const ids = new Map<number, boolean>();
function contains(reflection: unknown, id: number): boolean {
  if (!ids.size) {
    const walk = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (value && typeof value === 'object') {
        const node = value as Record<string, unknown>;
        if (typeof node.id === 'number' && node.variant) {
          ids.set(node.id, true);
        }
        Object.values(node).forEach(walk);
      }
    };
    [...ENTRIES, ...[...PACKAGE_ENTRIES.values()].flat()].forEach(entry =>
      walk(entry.reflection)
    );
  }
  void reflection;
  return ids.has(id);
}

describe('API reference', () => {
  test('every export has exactly one entry, on a page', () => {
    const expected = [
      ...new Set(
        [...exportsOf('chartist').runtime, ...exportsOf('chartist').types].map(
          name => `chartist:${name}`
        )
      ),
      ...new Set(
        [...exportsOf('compat').runtime, ...exportsOf('compat').types].map(
          name => `chartist/compat:${name}`
        )
      )
    ].sort();
    const documented = ENTRIES.map(
      entry => `${entry.module}:${entry.name}`
    ).sort();
    expect(documented).toEqual(expected);
    expect(
      ENTRIES.filter(entry => !pageOf(entry.page)).map(entry => entry.name)
    ).toEqual([]);
  });

  for (const page of API_PAGES) {
    test(`page ${page.slug}: described, no dead links`, () => {
      const entries = ENTRIES.filter(entry => entry.page === page.slug);
      expect(entries.flatMap(problems)).toEqual([]);
      expect(entries.flatMap(deadLinks)).toEqual([]);
    });
  }
});

/** The names a package's built declarations export. */
function packageExports(slug: string): string[] {
  const declarations = readFileSync(
    new URL(`../../../../packages/${slug}/dist/index.d.ts`, import.meta.url),
    'utf8'
  );
  const declared = [
    ...declarations.matchAll(
      /^export declare (?:function|const|let|class|interface|type|enum) (\w+)/gm
    )
  ].map(match => match[1]);
  const listed = [
    ...declarations.matchAll(/^export (?:type )?\{([^}]*)\}/gm)
  ].flatMap(match =>
    match[1]
      .split(',')
      .map(name =>
        name
          .trim()
          .split(/\s+as\s+/)
          .pop()!
          .replace(/^type /, '')
      )
      .filter(Boolean)
  );
  return [...new Set([...declared, ...listed])].sort();
}

describe('package API pages', () => {
  for (const pkg of PACKAGES) {
    describe(pkg.name, () => {
      const entries = PACKAGE_ENTRIES.get(pkg.slug) ?? [];

      test('every export has exactly one entry', () => {
        const names = entries.map(entry => entry.name);
        expect(names.length).toBe(new Set(names).size);
        expect([...names].sort()).toEqual(packageExports(pkg.slug));
      });

      test('every export described, no dead links', () => {
        expect(entries.flatMap(problems)).toEqual([]);
        expect(entries.flatMap(deadLinks)).toEqual([]);
      });
    });
  }

  test('chartist types in a package signature link into the reference', () => {
    const lineChart = PACKAGE_ENTRIES.get('terminal')?.find(
      entry => entry.name === 'lineChart'
    );
    const data = lineChart?.reflection.signatures?.[0].parameters?.[0];
    const [token] = typeTokens(data?.type);
    expect(token.text).toBe('LineChartData');
    expect(token.href).toMatch(/\/api\/[a-z-]+\/#LineChartData$/);
  });

  test('an export without a doc comment fails the check', () => {
    const undocumented = {
      name: 'undocumented',
      module: '@chartist-js/terminal',
      page: 'packages/terminal',
      pkg: 'terminal',
      file: 'src/index.ts',
      reflection: {
        id: -1,
        name: 'undocumented',
        variant: 'declaration',
        kind: KIND.Function,
        flags: {},
        signatures: []
      }
    } as unknown as ApiEntry;
    expect(problems(undocumented)).toEqual(['undocumented: no description']);
  });
});
