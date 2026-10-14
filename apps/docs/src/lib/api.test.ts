/**
 * The API reference is complete (design D5, add-api-reference): every
 * export on exactly one page, every v2 export and member described, every
 * 1.x export with a line, and no reference pointing nowhere. One test per
 * page, so each area can be checked on its own.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  ENTRIES,
  KIND,
  commentOf,
  entryMembers,
  membersOf,
  pageOf,
  plainText,
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
    ENTRIES.forEach(entry => walk(entry.reflection));
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
