/**
 * Install text follows the prerelease state: plain forms for a final
 * version, `chartist@next` and the exact CDN version for a prerelease.
 */
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { setupSnippet } from './plugins';
import { PLUGINS } from '../data/plugins';
import {
  installTextTransformer,
  release,
  releaseOf,
  rewriteInstallText
} from './release';

const RC = releaseOf('2.0.0-rc.1');
const FINAL = releaseOf('2.0.0');

describe('releaseOf', () => {
  test('a prerelease installs from the next tag and pins the CDN version', () => {
    expect(RC).toEqual({
      version: '2.0.0-rc.1',
      prerelease: true,
      npmSpecifier: 'chartist@next',
      cdnVersion: '2.0.0-rc.1',
      stackblitzVersion: 'next'
    });
  });

  test('a final version installs the plain package at the major', () => {
    expect(FINAL).toEqual({
      version: '2.0.0',
      prerelease: false,
      npmSpecifier: 'chartist',
      cdnVersion: '2',
      stackblitzVersion: 'latest'
    });
  });

  test('the site follows the package version', () => {
    const { version } = JSON.parse(
      readFileSync(
        new URL('../../../../packages/chartist/package.json', import.meta.url),
        'utf8'
      )
    );
    expect(release.version).toBe(
      process.env.CHARTIST_VERSION_OVERRIDE || version
    );
  });
});

describe('rewriteInstallText', () => {
  const rc = (text: string) => rewriteInstallText(text, RC);

  test('leaves everything alone for a final version', () => {
    const text =
      'npm install chartist\nhttps://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js';
    expect(rewriteInstallText(text, FINAL)).toBe(text);
  });

  test.each([
    ['npm install chartist', 'npm install chartist@next'],
    ['npm i chartist', 'npm i chartist@next'],
    ['npm install --save-dev chartist', 'npm install --save-dev chartist@next'],
    ['pnpm add chartist', 'pnpm add chartist@next'],
    ['yarn add chartist', 'yarn add chartist@next'],
    ['// npm install chartist', '// npm install chartist@next'],
    [
      'npm install chartist chartist-plugin-legend',
      'npm install chartist@next chartist-plugin-legend'
    ],
    [
      '// npm install chartist @stklcode/chartist-plugin-tooltips',
      '// npm install chartist@next @stklcode/chartist-plugin-tooltips'
    ],
    [
      'npm install chartist-plugin-legend chartist',
      'npm install chartist-plugin-legend chartist@next'
    ],
    ["'npm install chartist'", "'npm install chartist@next'"],
    [
      'npm install chartist && npm test',
      'npm install chartist@next && npm test'
    ]
  ])('%s', (text, expected) => {
    expect(rc(text)).toBe(expected);
  });

  test.each([
    'npm install chartist-plugin-legend',
    'npm install chartist@2',
    'npm install chartist@next',
    'npm install @chartist/examples',
    'npm install chartist2',
    "import { lineChart } from 'chartist';",
    'npm test chartist',
    'npm install foo\nchartist'
  ])('keeps %j', text => {
    expect(rc(text)).toBe(text);
  });

  test('pins chartist@2 CDN URLs to the exact version', () => {
    expect(
      rc(
        "import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js';"
      )
    ).toBe(
      "import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist@2.0.0-rc.1/dist/index.min.js';"
    );
  });

  test.each([
    'https://cdn.jsdelivr.net/npm/chartist-plugin-legend@0.6.2/chartist-plugin-legend.js',
    'https://cdn.jsdelivr.net/npm/chartist@1/dist/index.js',
    'https://cdn.jsdelivr.net/npm/chartist@2.1.0/dist/index.js',
    'https://cdn.jsdelivr.net/npm/@stklcode/chartist-plugin-tooltips@2.0.1/dist/x.js'
  ])('keeps %s', url => {
    expect(rc(url)).toBe(url);
  });

  test('rewrites a whole snippet and is idempotent', () => {
    const text = `<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.css">
<script type="module">
  import { lineChart } from
    'https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js';
</script>
<!-- or: npm install chartist -->`;
    const once = rc(text);
    expect(once).not.toContain('chartist@2/');
    expect(once.match(/chartist@2\.0\.0-rc\.1\/dist/g)).toHaveLength(2);
    expect(once).toContain('npm install chartist@next -->');
    expect(rc(once)).toBe(once);
  });

  test('the Shiki transformer applies the site release', () => {
    expect(installTextTransformer.preprocess('npm install chartist')).toBe(
      rewriteInstallText('npm install chartist')
    );
  });
});

describe('getting started during a prerelease', () => {
  const source = readFileSync(
    new URL('../content/docs/getting-started.mdx', import.meta.url),
    'utf8'
  );

  test('the guide keeps the final forms', () => {
    expect(source).toContain('npm install chartist\n');
    expect(source).toContain('cdn.jsdelivr.net/npm/chartist@2/');
  });

  test('its code says chartist@next and loads the exact version', () => {
    const rendered = rewriteInstallText(source, RC);
    expect(rendered).toContain('npm install chartist@next\n');
    expect(rendered).not.toContain('chartist@2/');
    expect(rendered).toContain(
      'https://cdn.jsdelivr.net/npm/chartist@2.0.0-rc.1/dist/index.min.js'
    );
  });

  test('plugin setup snippets keep their own versions', () => {
    for (const plugin of PLUGINS) {
      const { code } = setupSnippet(plugin);
      const rendered = rewriteInstallText(code, RC);
      expect(rendered).not.toContain('chartist@2/');
      const own = (s: string) =>
        s.match(new RegExp(`${plugin.package}@[^/]+`, 'g')) ?? [];
      expect(own(rendered)).toEqual(own(code));
    }
  });
});

describe('install text goes through the rewrite', () => {
  const INSTALL_TEXT =
    /\b(?:npm\s+(?:install|i|add)|pnpm\s+add|yarn\s+add)\b.*(?<![\w@./-])chartist(?![\w@/-])|cdn\.jsdelivr\.net\/npm\/chartist@2\//;
  const src = new URL('../', import.meta.url);
  const files = (pattern: string) =>
    globSync(pattern, { cwd: fileURLToPath(src) }).map(file => ({
      file,
      text: readFileSync(new URL(file, src), 'utf8')
    }));

  // The Shiki transformer covers code blocks, not inline code or prose.
  test('guides have it in code blocks only', () => {
    const outside: string[] = [];
    for (const { file, text } of files('content/**/*.{md,mdx}')) {
      let fence = '';
      text.split('\n').forEach((line, i) => {
        const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
        if (mark && (!fence || mark.startsWith(fence))) {
          fence = fence ? '' : mark;
        } else if (!fence && INSTALL_TEXT.test(line)) {
          outside.push(`${file}:${i + 1}`);
        }
      });
    }
    expect(outside).toEqual([]);
  });

  test('components and pages that show it use rewriteInstallText', () => {
    const missing = files(
      '{components,pages,lib,layouts,scripts}/**/*.{astro,ts}'
    )
      .filter(({ file }) => !/(^|\/)release(\.test)?\.ts$/.test(file))
      .filter(
        ({ text }) =>
          INSTALL_TEXT.test(text) && !text.includes('rewriteInstallText(')
      )
      .map(({ file }) => file);
    expect(missing).toEqual([]);
  });
});
