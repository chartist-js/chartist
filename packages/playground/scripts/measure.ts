/**
 * Spike measurements for design.md ("Findings"):
 *   1. gzip sizes of the built demo's chunks, grouped (runtime, editor, transformers)
 *   2. transform time per fixture for sucrase and ts-blank-space (Node)
 *   3. error messages of both transformers for typical mistakes
 *   4. cold start to first chart in Chromium, Firefox and WebKit
 *
 * Run: pnpm nx run playground:measure (builds first).
 */
import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { chromium, firefox, webkit, type BrowserType } from '@playwright/test';
import { compile } from '../src/compile.ts';
import { CompileError, loadTransformer } from '../src/transformers.ts';
import type { PlaygroundFiles, TransformerName } from '../src/types.ts';

const root = new URL('../', import.meta.url);
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`;
const gzip = (data: Buffer) => gzipSync(data, { level: 9 }).length;

// 1. Sizes ----------------------------------------------------------------

/** Chunk name prefix (Rolldown names chunks after their main module) → group. */
const GROUPS: Array<[RegExp, string]> = [
  [/^index-.*\.js$/, 'runtime (demo + playground + es-module-lexer)'],
  [/^index-.*\.css$/, 'runtime CSS'],
  [
    /^rolldown-runtime-.*\.js$/,
    'runtime (demo + playground + es-module-lexer)'
  ],
  [/^editor-.*\.js$/, 'CodeMirror editor'],
  [/^client-.*\.js$/, 'type client (with the editor)'],
  [/^worker-.*\.js$/, 'type worker: TypeScript + libs (on first focus)'],
  [/^esm-.*\.js$/, 'sucrase'],
  [/^(typescript|out)-.*\.js$/, 'ts-blank-space + typescript'],
  [/^sdk\..*\.js$/, '@stackblitz/sdk (on click)']
];

async function sizes() {
  const dir = new URL('dist/assets/', root);
  const groups = new Map<string, { raw: number; gz: number }>();
  for (const file of await readdir(dir)) {
    const group = GROUPS.find(([re]) => re.test(file))?.[1] ?? `other: ${file}`;
    const data = await readFile(new URL(file, dir));
    const entry = groups.get(group) ?? { raw: 0, gz: 0 };
    entry.raw += data.length;
    entry.gz += gzip(data);
    groups.set(group, entry);
  }
  const lib = await readFile(new URL('dist/lib/chartist/index.js', root));
  groups.set('chartist dist/index.js (for reference)', {
    raw: lib.length,
    gz: gzip(lib)
  });
  console.log('\n## Sizes (minified, gzip -9)\n');
  console.log('| Chunk group | Minified | Gzip |\n| --- | ---: | ---: |');
  for (const [group, { raw, gz }] of groups) {
    console.log(`| ${group} | ${kb(raw)} | ${kb(gz)} |`);
  }
  const g = (name: string) => groups.get(name)?.gz ?? 0;
  const runtime =
    g('runtime (demo + playground + es-module-lexer)') + g('runtime CSS');
  console.log(
    `\nRuntime without editor + sucrase: ${kb(runtime + g('sucrase'))}`
  );
  console.log(
    `Runtime with editor + sucrase: ${kb(runtime + g('sucrase') + g('CodeMirror editor'))}`
  );
  console.log(
    `Runtime with editor + ts-blank-space: ${kb(runtime + g('ts-blank-space + typescript') + g('CodeMirror editor'))}`
  );
}

// 2. Transform time -------------------------------------------------------

async function fixtures(): Promise<Record<string, PlaygroundFiles>> {
  const dir = new URL('demo/examples/', root);
  const result: Record<string, PlaygroundFiles> = {};
  for (const id of await readdir(dir)) {
    const files: PlaygroundFiles = {};
    for (const file of ['index.html', 'src/main.ts', 'src/style.css']) {
      try {
        files[file] = await readFile(new URL(`${id}/${file}`, dir), 'utf8');
      } catch {
        // optional file
      }
    }
    result[id] = files;
  }
  return result;
}

async function timings() {
  const examples = await fixtures();
  console.log('\n## Transform time (Node 22, this machine)\n');
  console.log(
    '| Transformer | Load (cold) | First transform | Warm transform (median of 200) | Full compile() warm |\n| --- | ---: | ---: | ---: | ---: |'
  );
  for (const name of ['sucrase', 'ts-blank-space'] as TransformerName[]) {
    let start = performance.now();
    const transform = await loadTransformer(name);
    const load = performance.now() - start;
    const code = examples['line-path-animation']['src/main.ts'];
    start = performance.now();
    transform(code, 'src/main.ts');
    const first = performance.now() - start;
    const runs: number[] = [];
    for (let i = 0; i < 200; i++) {
      for (const files of Object.values(examples)) {
        const t = performance.now();
        transform(files['src/main.ts'], 'src/main.ts');
        runs.push(performance.now() - t);
      }
    }
    const compileRuns: number[] = [];
    for (let i = 0; i < 50; i++) {
      for (const files of Object.values(examples)) {
        const result = await compile(files, {
          chartistUrl: 'https://x.test/chartist.js',
          stylesUrl: 'https://x.test/chartist.css',
          transformer: name
        });
        compileRuns.push(result.time);
      }
    }
    console.log(
      `| ${name} | ${load.toFixed(0)} ms | ${first.toFixed(2)} ms | ${median(runs).toFixed(3)} ms | ${median(compileRuns).toFixed(3)} ms |`
    );
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// 3. Error messages -------------------------------------------------------

const BROKEN: Record<string, string> = {
  'missing brace': `const data = { series: [[1, 2]] ;\nnew LineChart('#chart', data);`,
  'unclosed call': `new LineChart('#chart', { series: [[1, 2]] };`,
  'bad type annotation': `const options: = { low: 0 };`,
  'stray token': `const x = 1 +;\n`,
  'unterminated string': `const label = 'Mon;\n`,
  enum: `enum Color { Red }\nconsole.log(Color.Red);`
};

async function errors() {
  console.log('\n## Error messages\n');
  console.log('| Input | sucrase | ts-blank-space |\n| --- | --- | --- |');
  const transformers = {
    sucrase: await loadTransformer('sucrase'),
    'ts-blank-space': await loadTransformer('ts-blank-space')
  };
  for (const [label, code] of Object.entries(BROKEN)) {
    const cells = Object.values(transformers).map(transform => {
      try {
        transform(code, 'src/main.ts');
        return '(no error: transformed or passed through)';
      } catch (error) {
        const d = (error as CompileError).diagnostic;
        return `${d.line}:${d.column} ${d.message}`.replace(/\|/g, '\\|');
      }
    });
    console.log(`| ${label} | ${cells.join(' | ')} |`);
  }
}

// 4. Cold start -----------------------------------------------------------

async function coldStart() {
  const PORT = 4322;
  const server = spawn(process.execPath, ['test/e2e/serve.mjs', String(PORT)], {
    cwd: root,
    stdio: 'ignore'
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(
    '\n## Cold start: navigation → first svg.ct-chart-line (local server, median of 5, fresh context each)\n'
  );
  console.log('| Engine | sucrase | ts-blank-space |\n| --- | ---: | ---: |');
  const engines: Array<[string, BrowserType, boolean?]> = [
    ['Chromium', chromium],
    ['Chromium, throttled 10 Mbit/s + 40 ms RTT', chromium, true],
    ['Firefox', firefox],
    ['WebKit', webkit]
  ];
  try {
    for (const [label, type, throttle] of engines) {
      const browser = await type.launch();
      const cells: string[] = [];
      for (const transformer of ['sucrase', 'ts-blank-space']) {
        const runs: number[] = [];
        for (let i = 0; i < 5; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          if (throttle) {
            const cdp = await context.newCDPSession(page);
            await cdp.send('Network.emulateNetworkConditions', {
              offline: false,
              latency: 40,
              downloadThroughput: (10 * 1024 * 1024) / 8,
              uploadThroughput: (5 * 1024 * 1024) / 8
            });
          }
          await page.goto(
            `http://localhost:${PORT}/chartist/?example=line-area&transformer=${transformer}`
          );
          await page
            .frameLocator('iframe.playground-preview')
            .locator('svg.ct-chart-line')
            .waitFor({ timeout: 60_000 });
          runs.push(await page.evaluate(() => performance.now()));
          await context.close();
        }
        cells.push(`${median(runs).toFixed(0)} ms`);
      }
      console.log(`| ${label} | ${cells.join(' | ')} |`);
      await browser.close();
    }
  } finally {
    server.kill();
  }
}

await sizes();
await timings();
await errors();
await coldStart();
