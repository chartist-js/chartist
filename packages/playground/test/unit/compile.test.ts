import { describe, expect, test } from 'vitest';
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
      expect(result.diagnostics).toEqual([]);
      const doc = result.html!;
      expect(doc).toMatch(
        /<script type="module">import "playground:\/src\/main.ts";<\/script>/
      );
      expect(importMap(doc).chartist).toBe(`${BASE}lib/chartist/index.js`);
      expect(
        doc.indexOf('<script type="importmap">') <
          doc.indexOf('<script type="module">')
      ).toBeTruthy();
      // Bootstrap, import map and styles go right after <head>.
      expect(
        doc.indexOf('<script>(') < doc.indexOf('<meta charset')
      ).toBeTruthy();
      expect(moduleCode(doc, 'src/main.ts')).toMatch(/from 'chartist'/);
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
      expect(link > 0 && style > link, 'link before style').toBeTruthy();
      expect(doc).toMatch(/\.ct-line \{ stroke: red; \}/);
      const code = moduleCode(doc, 'src/main.ts');
      expect(code).not.toMatch(/\.css/);
      // Line numbers are kept: the LineChart import stays on line 3.
      expect(code.split('\n')[2].trim()).toBe(
        "import { LineChart } from 'chartist';"
      );
    });

    test('serves other chartist stylesheets next to the main one', async () => {
      const result = await compile(
        project(
          `import 'chartist/styles.css';\nimport 'chartist/themes/accessible.css';\nimport { barChart } from 'chartist';\nbarChart('#chart', { series: [] });`
        ),
        opts
      );
      const doc = result.html!;
      const main = doc.indexOf(`href="${BASE}lib/chartist/index.css"`);
      const theme = doc.indexOf(
        `href="${BASE}lib/chartist/themes/accessible.css"`
      );
      expect(
        main > 0 && theme > main,
        'theme after the main sheet'
      ).toBeTruthy();
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
      expect(result.diagnostics).toEqual([]);
      const doc = result.html!;
      expect(moduleCode(doc, 'src/main.ts')).toMatch(
        /from 'playground:\/src\/data.ts'/
      );
      expect(moduleCode(doc, 'src/main.ts')).toMatch(
        /import\("playground:\/src\/lazy.ts"\)/
      );
      expect(moduleCode(doc, 'src/data.ts')).toMatch(
        /playground:\/src\/nested\/label\.ts/
      );
      expect(moduleCode(doc, 'src/data.ts')).not.toMatch(/number\[\]/);
      expect(
        importMap(doc)['playground:/src/nested/label.ts'].startsWith(
          'data:text/javascript'
        )
      ).toBeTruthy();
    });

    test('reports unresolved imports with file and line', async () => {
      const result = await compile(
        project(`\nimport { x } from './missing';\nconsole.log(x);`),
        opts
      );
      expect(result.html).toBe(null);
      expect(result.diagnostics[0].file).toBe('src/main.ts');
      expect(result.diagnostics[0].line).toBe(2);
      expect(result.diagnostics[0].message).toMatch(
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
      expect(result.html).toBe(null);
      const [diagnostic] = result.diagnostics;
      expect(diagnostic.file).toBe('src/main.ts');
      expect(diagnostic.line).toBe(3);
      expect(diagnostic.message.length > 0).toBeTruthy();
    });

    test('type-only imports with the type keyword are removed', async () => {
      const result = await compile(
        project(
          `import type { LineChartData } from 'chartist';\nimport { type Options, LineChart } from 'chartist';\nconst d: LineChartData = { series: [] };\nconst o: Options = {};\nnew LineChart('#chart', d, o);`
        ),
        opts
      );
      const code = moduleCode(result.html!, 'src/main.ts');
      expect(code).not.toMatch(/LineChartData|Options/);
    });
  });
}

test('sucrase elides imports only used as types, ts-blank-space keeps them', async () => {
  const files = project(
    `import { PieChart, PieChartOptions } from 'chartist';\nconst o: PieChartOptions = {};\nnew PieChart('#chart', { series: [1] }, o);`
  );
  const sucrase = await compile(files, { ...options, transformer: 'sucrase' });
  expect(moduleCode(sucrase.html!, 'src/main.ts')).not.toMatch(
    /PieChartOptions/
  );
  const blank = await compile(files, {
    ...options,
    transformer: 'ts-blank-space'
  });
  expect(moduleCode(blank.html!, 'src/main.ts')).toMatch(/PieChartOptions/);
});

test('ts-blank-space rejects non-erasable syntax', async () => {
  const result = await compile(
    project(`enum Color { Red }\nconsole.log(Color.Red);`),
    {
      ...options,
      transformer: 'ts-blank-space'
    }
  );
  expect(result.html).toBe(null);
  expect(result.diagnostics[0].message).toMatch(
    /Unsupported TypeScript syntax/
  );
});

test('stackblitz project adds package.json and keeps the files', () => {
  const project = stackblitzProject(
    { 'index.html': html, 'src/main.ts': 'x', 'src/style.css': 'y' },
    { title: 'Line chart', chartistVersion: '^1.5.0' }
  );
  expect(project.template).toBe('node');
  expect(project.files['src/main.ts']).toBe('x');
  expect(project.files['src/style.css']).toBe('y');
  const pkg = JSON.parse(project.files['package.json']);
  expect(pkg.scripts.dev).toBe('vite');
  expect(pkg.dependencies.chartist).toBe('^1.5.0');
  expect(pkg.devDependencies.vite).toBeTruthy();
  expect(pkg.devDependencies.typescript).toBeTruthy();
  expect(project.files['tsconfig.json']).toBeTruthy();
});
