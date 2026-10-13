/**
 * Keeps the suite honest: tests reach Chartist only through `chartist`,
 * and the type tests resolve `chartist` to real declaration files.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(file);
    }
    return /\.(c|m)?ts$/.test(entry.name) ? [file] : [];
  });
}

test('tests import Chartist only through the package name', () => {
  const violations = sourceFiles(apiDir).flatMap(file =>
    [...readFileSync(file, 'utf8').matchAll(IMPORT)]
      .map(match => match[1])
      .filter(specifier => {
        if (specifier.startsWith('.')) {
          const target = path.resolve(path.dirname(file), specifier);
          return path.relative(apiDir, target).startsWith('..');
        }
        return /(^|\/)src(\/|$)/.test(specifier);
      })
      .map(specifier => `${path.relative(apiDir, file)} imports "${specifier}"`)
  );
  expect(
    violations,
    'Public API tests must import Chartist through "chartist", not from src/ or other paths outside test/api'
  ).toEqual([]);
});

test('the type test config maps chartist to existing declaration files', () => {
  // A missing `paths` target silently falls back to node_modules resolution.
  // Only the active target's config: the other target's files may be
  // rebuilt in parallel.
  const config =
    process.env.CHARTIST_API_TARGET === 'v1'
      ? 'tsconfig.v1.json'
      : 'tsconfig.json';
  const { compilerOptions } = JSON.parse(
    readFileSync(path.join(apiDir, config), 'utf8')
  );
  for (const target of compilerOptions?.paths?.chartist ?? []) {
    expect(existsSync(path.join(apiDir, target)), `${config}: ${target}`).toBe(
      true
    );
  }
});
