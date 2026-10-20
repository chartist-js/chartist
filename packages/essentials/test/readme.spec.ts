import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The README's examples, against the build; `test` depends on `build`.
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const blocks = (lang: string) =>
  [
    ...readme.matchAll(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'g'))
  ].map(match => match[1]);

describe('README', () => {
  // Inside the package, so `@chartist-js/essentials` resolves to itself.
  const dir = mkdtempSync(join(root, 'test/.readme-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const files = blocks('ts').map((code, index) => {
    const file = join(dir, `example-${index}.ts`);
    writeFileSync(file, code);
    return { file, code };
  });

  it('has TypeScript examples that type-check', () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        extends: '../../tsconfig.json',
        // Bundlers declare CSS imports; the stylesheet example needs them.
        compilerOptions: {
          types: ['node'],
          noUncheckedSideEffectImports: false
        },
        include: ['*.ts']
      })
    );
    try {
      execFileSync(
        process.execPath,
        [require.resolve('typescript/bin/tsc'), '-p', dir],
        { cwd: root, encoding: 'utf8' }
      );
    } catch (error) {
      throw new Error((error as { stdout?: string }).stdout || String(error));
    }
  });

  it('has a server example that renders the titles', () => {
    // Browser examples need a page; the server one runs in Node.js.
    const server = files.filter(({ code }) => code.includes('chartist/server'));
    expect(server).toHaveLength(1);
    const output = execFileSync(process.execPath, [server[0].file], {
      cwd: root,
      encoding: 'utf8'
    });
    expect(output).toMatch(
      /<text[^>]*class="ct-axis-title[^"]*"[^>]*>Visits<\/text>/
    );
  });

  it('shows the import map with both packages', () => {
    const [html] = blocks('html');
    const map = JSON.parse(
      /<script type="importmap">([\s\S]*?)<\/script>/.exec(html)![1]
    );
    expect(Object.keys(map.imports)).toEqual([
      'chartist',
      '@chartist-js/essentials'
    ]);
  });
});
