/**
 * Reads the export names of a Chartist build: runtime names from the ESM,
 * CJS and UMD files, and every exported name (values and types) from the
 * declaration files. Shared by exports.api.ts and update.ts.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

// path.resolve, not new URL(): under jsdom, URL is jsdom's and node:url rejects it.
const exportsDir = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(exportsDir, '../../..');

export const BUILDS = {
  local: path.join(pkgDir, 'dist'),
  v1: path.join(pkgDir, 'node_modules/chartist-v1/dist')
} as const;

export type BuildName = keyof typeof BUILDS;

export interface ExportList {
  runtime: string[];
  types: string[];
}

export const LIST_FILE = path.join(exportsDir, 'chartist.json');
export const COMPAT_LIST_FILE = path.join(exportsDir, 'compat.json');
export const LIVE_LIST_FILE = path.join(exportsDir, 'live.json');
export const DEPRECATED_FILE = path.join(exportsDir, 'deprecated.json');

const sorted = (names: Iterable<string>) =>
  [...names].filter(name => name !== 'default').sort();

export async function esmNames(build: BuildName, entry = 'index') {
  const file = pathToFileURL(path.join(BUILDS[build], `${entry}.js`)).href;
  return sorted(Object.keys(await import(/* @vite-ignore */ file)));
}

export function cjsNames(build: BuildName, entry = 'index') {
  const require = createRequire(import.meta.url);
  return sorted(Object.keys(require(path.join(BUILDS[build], `${entry}.cjs`))));
}

/**
 * Runs UMD files like classic <script>s, in order: no module system, a
 * global. Returns the names on the global `Chartist` after the last one.
 */
export function umdNames(build: BuildName, entries = ['index']) {
  const context: { Chartist?: object } = {};
  vm.createContext(context);
  for (const entry of entries) {
    vm.runInContext(
      readFileSync(path.join(BUILDS[build], `${entry}.umd.js`), 'utf8'),
      context
    );
  }
  if (!context.Chartist) {
    throw new Error(`${build}: the UMD build defines no global Chartist`);
  }
  return sorted(Object.keys(context.Chartist));
}

export function typeNames(build: BuildName, entry = 'index') {
  const file = path.join(BUILDS[build], `${entry}.d.ts`);
  const program = ts.createProgram([file], { skipLibCheck: true });
  const checker = program.getTypeChecker();
  const module = checker.getSymbolAtLocation(program.getSourceFile(file)!);
  if (!module) {
    throw new Error(`${build}: ${file} is not a module`);
  }
  return sorted(checker.getExportsOfModule(module).map(symbol => symbol.name));
}

/**
 * The exports a declaration file marks as deprecated, with their messages:
 * what an editor shows for an import of the name from that entry.
 */
export function deprecatedNames(build: BuildName, file: string) {
  const full = path.join(BUILDS[build], file);
  const program = ts.createProgram([full], { skipLibCheck: true });
  const checker = program.getTypeChecker();
  const module = checker.getSymbolAtLocation(program.getSourceFile(full)!);
  if (!module) {
    throw new Error(`${build}: ${full} is not a module`);
  }
  const deprecated: Record<string, string> = {};
  for (const symbol of checker.getExportsOfModule(module)) {
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    const tag = target
      .getJsDocTags(checker)
      .find(({ name }) => name === 'deprecated');
    if (tag) {
      deprecated[symbol.name] = ts.displayPartsToString(tag.text).trim();
    }
  }
  return deprecated;
}

export function readList(file = LIST_FILE): ExportList {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Names listed but not exported, and exported but not listed. */
export function diffNames(listed: string[], exported: string[]) {
  return {
    listedButNotExported: listed.filter(name => !exported.includes(name)),
    exportedButNotListed: exported.filter(name => !listed.includes(name))
  };
}
