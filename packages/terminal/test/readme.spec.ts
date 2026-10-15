import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The README's examples, run against the build; `test` depends on `build`.
const root = fileURLToPath(new URL('..', import.meta.url));
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const blocks = (lang: string) =>
  [
    ...readme.matchAll(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'g'))
  ].map(match => match[1]);

describe('README', () => {
  const typescript = blocks('ts');
  // Inside the package, so `@chartist-js/terminal` resolves to itself.
  const dir = mkdtempSync(join(root, 'test/.readme-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const files = typescript.map((code, index) => {
    const file = join(dir, `example-${index}.ts`);
    writeFileSync(file, code);
    return { file, code };
  });

  it('has TypeScript examples that type-check', () => {
    expect(files.length).toBeGreaterThanOrEqual(3);
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        extends: '../../tsconfig.json',
        // Bundlers declare CSS imports; the stylesheet example needs one.
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
        {
          cwd: root,
          encoding: 'utf8'
        }
      );
    } catch (error) {
      throw new Error((error as { stdout?: string }).stdout || String(error));
    }
  });

  it('has TypeScript examples that run', () => {
    // A stylesheet import needs a bundler; those are checked by type only.
    for (const { file } of files.filter(({ code }) => !code.includes('.css'))) {
      const output = execFileSync(process.execPath, [file], {
        cwd: root,
        encoding: 'utf8'
      });
      expect(output).toMatch(/[⠁-⣿█]/);
    }
  });

  it('has commands that run', () => {
    const cli = `"${process.execPath}" "${join(root, 'dist/cli.js')}"`;
    const commands = blocks('sh')
      .flatMap(block => block.split('\n'))
      .filter(line => /ct-cli|npx @chartist-js\/terminal/.test(line));
    expect(commands.length).toBeGreaterThanOrEqual(6);
    for (const command of commands) {
      const output = execFileSync(
        'sh',
        [
          '-c',
          command
            .replace('npx @chartist-js/terminal', cli)
            .replace(/\bct-cli\b/, cli)
        ],
        { cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } }
      );
      expect(output, command).toMatch(/[⠁-⣿█]/);
    }
  });
});
