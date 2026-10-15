/**
 * Install text follows the prerelease state. The site under test is built
 * for the package's version; this spec builds it once more as a release
 * candidate (`CHARTIST_VERSION_OVERRIDE`, into dist/apps/docs-prerelease/)
 * and reads the pages from disk.
 */
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';
import { rewriteInstallText } from '../src/lib/release';

const VERSION = '2.0.0-rc.1';
const OUT = fileURLToPath(
  new URL('../../../dist/apps/docs-prerelease/', import.meta.url)
);
const CDN = `https://cdn.jsdelivr.net/npm/chartist@${VERSION}/dist/index.min.js`;

const read = (file: string) => readFile(OUT + file, 'utf8');
/** The text of a page, without its tags. */
const text = async (file: string) =>
  (await read(file)).replace(/<[^>]+>/g, '').replace(/&#39;/g, "'");

test('the site under test follows the package version', async ({ page }) => {
  await page.goto('/docs/getting-started/');
  const code = page.locator('main pre');
  await expect(code.filter({ hasText: /^npm install/ })).toHaveText(
    rewriteInstallText('npm install chartist')
  );
  await expect(
    code.filter({ hasText: 'cdn.jsdelivr.net' }).first()
  ).toContainText(rewriteInstallText('cdn.jsdelivr.net/npm/chartist@2/dist/'));
});

test.describe('a prerelease build', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    await promisify(execFile)(
      'pnpm',
      ['exec', 'astro', 'build', '--outDir', OUT],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        env: { ...process.env, CHARTIST_VERSION_OVERRIDE: VERSION },
        maxBuffer: 64 * 1024 * 1024
      }
    );
  });

  test('getting started installs chartist@next and loads the exact version', async () => {
    const page = await text('docs/getting-started/index.html');
    expect(page).toContain('npm install chartist@next');
    expect(page).not.toMatch(/npm install chartist(?!@)/);
    expect(page).toContain(CDN);
    expect(page).not.toContain('chartist@2/');
  });

  test('the Markdown versions and llms-full.txt follow', async () => {
    for (const file of ['docs/getting-started.md', 'llms-full.txt']) {
      const markdown = await read(file);
      expect(markdown).toContain('npm install chartist@next');
      expect(markdown).toContain(CDN);
      expect(markdown).not.toContain('chartist@2/');
    }
  });

  test('the landing page, plugins and playground follow', async () => {
    const home = await text('index.html');
    expect(home).toContain('npm install chartist@next');
    expect(home).not.toContain('chartist@2/');
    expect(await text('plugins/index.html')).not.toContain('chartist@2/');
    // The setup snippet is on each plugin's page.
    const plugins = await text(
      'plugins/chartist-plugin-pointlabels/index.html'
    );
    expect(plugins).toContain(`chartist@${VERSION}/dist/compat.min.js`);
    expect(plugins).not.toContain('chartist@2/');
    // Plugins keep their own pinned versions.
    expect(plugins).toMatch(/chartist-plugin-[a-z]+@\d+\.\d+\.\d+\//);
    expect(await read('playground/index.html')).toContain(
      'data-chartist-version="next"'
    );
  });
});
