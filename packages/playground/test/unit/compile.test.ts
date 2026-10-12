import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '../../src/compile.ts';
import { stackblitzProject } from '../../src/stackblitz.ts';
import type { PlaygroundFiles, TransformerName } from '../../src/types.ts';

const BASE = 'https://example.test/chartist/';
const options = {
  chartistUrl: 'lib/chartist/index.js',
  stylesUrl: 'lib/chartist/index.css',
  baseUrl: BASE,
  runId: 'run-1'
};

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Test</title>
  </head>
  <body>
    <div id="chart"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

function project(main: string, extra: PlaygroundFiles = {}): PlaygroundFiles {
  return { 'index.html': html, 'src/main.ts': main, ...extra };
}

/** Extracts and decodes the import map of a compiled document. */
function importMap(doc: string): Record<string, string> {
  const json = /<script type="importmap">(.*?)<\/script>/s.exec(doc)![1];
  return JSON.parse(json).imports;
}

function moduleCode(doc: string, file: string): string {
  const url = importMap(doc)[`playground:/${file}`];
  return decodeURIComponent(url.slice(url.indexOf(',') + 1));
}

for (const transformer of ['sucrase', 'ts-blank-space'] as TransformerName[]) {
  describe(`compile (${transformer})`, () => {
    const opts = { ...options, transformer };

    test('rewrites the entry script and maps chartist to an absolute URL', async () => {
      const result = await compile(
        project(
          `import { LineChart } from 'chartist';\nnew LineChart('#chart', { series: [[1, 2]] });`
        ),
        opts
      );
      assert.deepEqual(result.diagnostics, []);
      const doc = result.html!;
      assert.match(
        doc,
        /<script type="module">import "playground:\/src\/main.ts";<\/script>/
      );
      assert.equal(importMap(doc).chartist, `${BASE}lib/chartist/index.js`);
      assert.ok(
        doc.indexOf('<script type="importmap">') <
          doc.indexOf('<script type="module">')
      );
      // Bootstrap, import map and styles go right after <head>.
      assert.ok(doc.indexOf('<script>(') < doc.indexOf('<meta charset'));
      assert.match(moduleCode(doc, 'src/main.ts'), /from 'chartist'/);
    });

    test('turns CSS imports into link and style tags, in import order', async () => {
      const result = await compile(
        project(
          `import 'chartist/styles.css';\nimport './style.css';\nimport { LineChart } from 'chartist';\nnew LineChart('#chart', { series: [] });`,
          { 'src/style.css': '.ct-line { stroke: red; }' }
        ),
        opts
      );
      const doc = result.html!;
      const link = doc.indexOf(
        `<link rel="stylesheet" href="${BASE}lib/chartist/index.css">`
      );
      const style = doc.indexOf('<style data-file="src/style.css">');
      assert.ok(link > 0 && style > link, 'link before style');
      assert.match(doc, /\.ct-line \{ stroke: red; \}/);
      const code = moduleCode(doc, 'src/main.ts');
      assert.doesNotMatch(code, /\.css/);
      // Line numbers are kept: the LineChart import stays on line 3.
      assert.equal(
        code.split('\n')[2].trim(),
        "import { LineChart } from 'chartist';"
      );
    });

    test('resolves relative module imports to virtual modules', async () => {
      const result = await compile(
        project(
          `import { series } from './data';\nimport('./lazy.ts');\nconsole.log(series);`,
          {
            'src/data.ts': `import { label } from './nested/label.js';\nexport const series: number[][] = [[1, 2, 3]];\nexport { label };`,
            'src/nested/label.ts': `export const label: string = 'x';`,
            'src/lazy.ts': `export default 1;`
          }
        ),
        opts
      );
      assert.deepEqual(result.diagnostics, []);
      const doc = result.html!;
      assert.match(
        moduleCode(doc, 'src/main.ts'),
        /from 'playground:\/src\/data.ts'/
      );
      assert.match(
        moduleCode(doc, 'src/main.ts'),
        /import\("playground:\/src\/lazy.ts"\)/
      );
      assert.match(
        moduleCode(doc, 'src/data.ts'),
        /playground:\/src\/nested\/label\.ts/
      );
      assert.doesNotMatch(moduleCode(doc, 'src/data.ts'), /number\[\]/);
      assert.ok(
        importMap(doc)['playground:/src/nested/label.ts'].startsWith(
          'data:text/javascript'
        )
      );
    });

    test('reports unresolved imports with file and line', async () => {
      const result = await compile(
        project(`\nimport { x } from './missing';\nconsole.log(x);`),
        opts
      );
      assert.equal(result.html, null);
      assert.equal(result.diagnostics[0].file, 'src/main.ts');
      assert.equal(result.diagnostics[0].line, 2);
      assert.match(
        result.diagnostics[0].message,
        /Cannot resolve import "\.\/missing"/
      );
    });

    test('reports syntax errors with file and line', async () => {
      const result = await compile(
        project(
          `import { LineChart } from 'chartist';\n\nconst data = { series: [[1, 2]] ;\nnew LineChart('#chart', data);`
        ),
        opts
      );
      assert.equal(result.html, null);
      const [diagnostic] = result.diagnostics;
      assert.equal(diagnostic.file, 'src/main.ts');
      assert.equal(diagnostic.line, 3);
      assert.ok(diagnostic.message.length > 0);
    });

    test('type-only imports with the type keyword are removed', async () => {
      const result = await compile(
        project(
          `import type { LineChartData } from 'chartist';\nimport { type Options, LineChart } from 'chartist';\nconst d: LineChartData = { series: [] };\nconst o: Options = {};\nnew LineChart('#chart', d, o);`
        ),
        opts
      );
      const code = moduleCode(result.html!, 'src/main.ts');
      assert.doesNotMatch(code, /LineChartData|Options/);
    });
  });
}

test('sucrase elides imports only used as types, ts-blank-space keeps them', async () => {
  const files = project(
    `import { PieChart, PieChartOptions } from 'chartist';\nconst o: PieChartOptions = {};\nnew PieChart('#chart', { series: [1] }, o);`
  );
  const sucrase = await compile(files, { ...options, transformer: 'sucrase' });
  assert.doesNotMatch(
    moduleCode(sucrase.html!, 'src/main.ts'),
    /PieChartOptions/
  );
  const blank = await compile(files, {
    ...options,
    transformer: 'ts-blank-space'
  });
  assert.match(moduleCode(blank.html!, 'src/main.ts'), /PieChartOptions/);
});

test('ts-blank-space rejects non-erasable syntax', async () => {
  const result = await compile(
    project(`enum Color { Red }\nconsole.log(Color.Red);`),
    {
      ...options,
      transformer: 'ts-blank-space'
    }
  );
  assert.equal(result.html, null);
  assert.match(result.diagnostics[0].message, /Unsupported TypeScript syntax/);
});

test('stackblitz project adds package.json and keeps the files', () => {
  const project = stackblitzProject(
    { 'index.html': html, 'src/main.ts': 'x', 'src/style.css': 'y' },
    { title: 'Line chart', chartistVersion: '^1.5.0' }
  );
  assert.equal(project.template, 'node');
  assert.equal(project.files['src/main.ts'], 'x');
  assert.equal(project.files['src/style.css'], 'y');
  const pkg = JSON.parse(project.files['package.json']);
  assert.equal(pkg.scripts.dev, 'vite');
  assert.equal(pkg.dependencies.chartist, '^1.5.0');
  assert.ok(pkg.devDependencies.vite);
  assert.ok(pkg.devDependencies.typescript);
  assert.ok(project.files['tsconfig.json']);
});
