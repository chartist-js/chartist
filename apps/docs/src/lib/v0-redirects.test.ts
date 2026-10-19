/**
 * The redirects for 0.x URLs: where each page and anchor goes, and what the
 * redirect pages do. Whether every target exists on the built site is
 * checked by scripts/v0-redirects.ts before it writes the pages.
 */
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import {
  V0_PAGES,
  archivePath,
  v0NotFoundPage,
  v0RedirectPage,
  v0Target,
  type V0Page
} from './v0-redirects';

const page = (file: string): V0Page => {
  const found = V0_PAGES.find(entry => entry.file === file);
  if (!found) {
    throw new Error(`No 0.x page ${file}`);
  }
  return found;
};

/** Runs a redirect page's script at `href` and returns where it goes. */
function follow(html: string, href: string): string {
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1];
  const url = new URL(href);
  let to = '';
  const location = {
    href: url.href,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    replace: (target: string) => {
      to = target;
    }
  };
  new Function('location', script)(location);
  return to;
}

describe('the 0.x pages', () => {
  test('are the six pages of the old site', () => {
    expect(V0_PAGES.map(entry => entry.file)).toEqual([
      'index.html',
      'getting-started.html',
      'examples.html',
      'api-documentation.html',
      'plugins.html',
      'apidoc/index.html'
    ]);
  });

  test('go to their v2 counterpart without a hash', () => {
    expect(V0_PAGES.map(entry => v0Target(entry))).toEqual([
      '',
      'docs/getting-started/',
      'examples/',
      'api/',
      'plugins/',
      'api/'
    ]);
  });

  test('have their archived copy under /v0/', () => {
    expect(archivePath(page('index.html'))).toBe('v0/');
    expect(archivePath(page('examples.html'))).toBe('v0/examples.html');
    expect(archivePath(page('apidoc/index.html'))).toBe('v0/apidoc/');
  });

  test('every mapped anchor is an id of its 0.x page', async () => {
    const missing: string[] = [];
    for (const entry of V0_PAGES) {
      const html = await readFile(
        new URL(`../../public/v0/${entry.file}`, import.meta.url),
        'utf8'
      );
      for (const id of Object.keys(entry.anchors)) {
        if (!html.includes(` id="${id}"`)) {
          missing.push(`${entry.file}#${id}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('v0Target', () => {
  test('sends a mapped anchor to its v2 page', () => {
    expect(v0Target(page('examples.html'), 'example-line-modify-drawing')).toBe(
      'examples/line/modify-drawing/'
    );
    expect(v0Target(page('getting-started.html'), 'the-sass-way')).toBe(
      'docs/styling-with-css/#sass'
    );
    expect(v0Target(page('plugins.html'), 'tooltip-plugin')).toBe(
      'packages/tooltips/'
    );
    expect(v0Target(page('plugins.html'), 'target-line-plugin')).toBe(
      'docs/target-lines-and-bands/'
    );
    expect(v0Target(page('index.html'), 'crazy-animations-with-smil')).toBe(
      'docs/animations/#smil-for-what-css-cant-animate'
    );
  });

  test("treats a live example's code like the example", () => {
    expect(
      v0Target(
        page('getting-started.html'),
        'example-line-series-override-code'
      )
    ).toBe('docs/data-and-options/#options-per-series');
  });

  test('sends any other anchor to the same place in the archive', () => {
    expect(
      v0Target(page('api-documentation.html'), 'chartistcore-method-getbounds')
    ).toBe('v0/api-documentation.html#chartistcore-method-getbounds');
    expect(v0Target(page('getting-started.html'), 'advanced')).toBe(
      'v0/getting-started.html#advanced'
    );
    expect(v0Target(page('index.html'), 'browser-compatibility')).toBe(
      'v0/#browser-compatibility'
    );
  });

  test("doesn't take inherited keys for anchors", () => {
    expect(v0Target(page('examples.html'), 'constructor')).toBe(
      'v0/examples.html#constructor'
    );
  });
});

describe('the redirect pages', () => {
  const site = 'https://chartist.dev';
  const examples = v0RedirectPage(page('examples.html'), site);

  test('point search engines and browsers without scripts to v2', () => {
    expect(examples).toContain(
      '<link rel="canonical" href="https://chartist.dev/examples/">'
    );
    expect(examples).toContain(
      '<meta http-equiv="refresh" content="0; url=https://chartist.dev/examples/">'
    );
    expect(examples).not.toContain('noindex');
  });

  test('pick the target by the hash and keep the query', () => {
    const old = 'https://gionkunz.github.io/chartist-js/examples.html';
    expect(follow(examples, old)).toBe('https://chartist.dev/examples/');
    expect(follow(examples, `${old}?ref=so#stacked-bar`)).toBe(
      'https://chartist.dev/examples/bar/stacked/?ref=so'
    );
    expect(follow(examples, `${old}#pie-chart-examples`)).toBe(
      'https://chartist.dev/examples/#pie'
    );
    expect(follow(examples, `${old}#unknown`)).toBe(
      'https://chartist.dev/v0/examples.html#unknown'
    );
  });

  test('send the home page and its unmapped anchors on', () => {
    const home = v0RedirectPage(page('index.html'), site);
    const old = 'https://gionkunz.github.io/chartist-js/';
    expect(follow(home, old)).toBe('https://chartist.dev/');
    expect(follow(home, `${old}#browser-compatibility`)).toBe(
      'https://chartist.dev/v0/#browser-compatibility'
    );
  });

  test('the 404 page sends any other path to the archive', () => {
    const notFound = v0NotFoundPage(site);
    expect(
      follow(
        notFound,
        'https://gionkunz.github.io/chartist-js/styles/main.css?x=1#y'
      )
    ).toBe('https://chartist.dev/v0/styles/main.css?x=1#y');
    expect(notFound).toContain('<a href="https://chartist.dev/v0/">');
  });
});
