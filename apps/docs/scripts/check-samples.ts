/**
 * Type-checks the TypeScript code blocks of the docs pages against
 * Chartist's types (pnpm nx run docs:samples). A block is checked unless
 * its fence says `nocheck` (```ts nocheck), so skipped samples stay visible
 * in the source. Checked blocks must be complete modules: imports included.
 *
 * Each block becomes a file in .samples/ (git-ignored, next to
 * node_modules, so `chartist` resolves like in a reader's project).
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const pagesDir = `${root}src/content/docs/`;
const outDir = `${root}.samples/`;

interface Sample {
  page: string;
  line: number;
  code: string;
}

/** The ts/typescript fences of an MDX page, with their starting line. */
function samplesOf(page: string, source: string): Sample[] {
  const samples: Sample[] = [];
  const fence = /^([ \t]*)```(ts|typescript)\b([^\n]*)\n([\s\S]*?)^\1```/gm;
  for (const match of source.matchAll(fence)) {
    if (/\bnocheck\b/.test(match[3])) {
      continue;
    }
    const line = source.slice(0, match.index).split('\n').length;
    samples.push({ page, line, code: match[4] });
  }
  return samples;
}

const pages = (await readdir(pagesDir)).filter(file => file.endsWith('.mdx'));
const samples: Sample[] = [];
for (const page of pages) {
  samples.push(...samplesOf(page, await readFile(pagesDir + page, 'utf8')));
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const files = new Map<string, Sample>();
for (const [i, sample] of samples.entries()) {
  const file = `${outDir}${sample.page.replace(/\.mdx$/, '')}-${i}.ts`;
  files.set(file, sample);
  await writeFile(file, sample.code);
}
// Side-effect imports of stylesheets, as a bundler would allow them.
const shims = `${outDir}shims.d.ts`;
await writeFile(shims, "declare module '*.css';\n");

const program = ts.createProgram([...files.keys(), shims], {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  // Samples run in a browser or, like those for CLI tools, in Node.js.
  types: ['node'],
  strict: true,
  noEmit: true,
  skipLibCheck: true
});
const diagnostics = ts.getPreEmitDiagnostics(program);
for (const diagnostic of diagnostics) {
  const sample = diagnostic.file && files.get(diagnostic.file.fileName);
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (!sample || diagnostic.start === undefined) {
    console.error(message);
    continue;
  }
  const { line } = diagnostic.file!.getLineAndCharacterOfPosition(
    diagnostic.start
  );
  // +1 for the fence line, +1 because lines count from 1.
  console.error(
    `src/content/docs/${sample.page}:${sample.line + line + 1}: ${message}`
  );
}
console.log(
  `${samples.length} samples in ${pages.length} pages, ${diagnostics.length} errors`
);
process.exitCode = diagnostics.length ? 1 : 0;
