// @vitest-environment node
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
  it('has TypeScript examples that type-check', () => {
    const dir = mkdtempSync(join(root, 'test/.readme-'));
    try {
      const files = blocks('ts');
      expect(files.length).toBeGreaterThanOrEqual(3);
      files.forEach((code, index) =>
        writeFileSync(join(dir, `example-${index}.ts`), code)
      );
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          extends: '../../tsconfig.json',
          // Bundlers declare CSS imports; the stylesheet example needs them.
          compilerOptions: { types: [], noUncheckedSideEffectImports: false },
          include: ['*.ts']
        })
      );
      execFileSync(
        process.execPath,
        [require.resolve('typescript/bin/tsc'), '-p', dir],
        { cwd: root, encoding: 'utf8' }
      );
    } catch (error) {
      throw new Error((error as { stdout?: string }).stdout || String(error));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('loads both browser builds without an import map', () => {
    const [html] = blocks('html');
    expect(html).not.toContain('importmap');
    expect(html).toContain('/chartist@2/dist/index.min.js');
    expect(html).toContain('/@chartist-js/tooltips@2/dist/index.min.js');
  });
});
