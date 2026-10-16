/**
 * The redirects for pages the site removed: where they go and what their
 * pages say. The built site is checked in the e2e tests
 * (e2e/redirects.spec.ts), which run after the build.
 */
import { describe, expect, test } from 'vitest';
import {
  MOVED_PAGES,
  REDIRECT_MARKER,
  movedFile,
  movedPage,
  redirectHtml
} from '../../integrations/redirects.mjs';

describe('moved pages', () => {
  const path = 'plugins/chartist-plugin-targetline/';

  test('the target line plugin goes to the guide', () => {
    expect(MOVED_PAGES[path]).toBe('docs/target-lines-and-bands/');
    expect(movedFile(path)).toBe(
      'plugins/chartist-plugin-targetline/index.html'
    );
  });

  test('the updating charts guide goes to the live updates guide', () => {
    expect(MOVED_PAGES['docs/updating-charts/']).toBe('docs/live-updates/');
  });

  test('redirects with and without JavaScript, keeping the hash', () => {
    const page = movedPage(path, { base: '/', site: 'https://chartist.dev' });
    expect(page).toContain(` ${REDIRECT_MARKER}>`);
    expect(page).toContain(
      '<meta http-equiv="refresh" content="0; url=/docs/target-lines-and-bands/">'
    );
    expect(page).toContain(
      'location.replace("/docs/target-lines-and-bands/" + location.search + location.hash)'
    );
    expect(page).toContain(
      '<link rel="canonical" href="https://chartist.dev/docs/target-lines-and-bands/">'
    );
    expect(page).toContain('<meta name="robots" content="noindex">');
    expect(page).not.toContain('data-pagefind-body');
  });

  test('follows the base path', () => {
    const page = movedPage(path, {
      base: '/chartist',
      site: 'https://example.org'
    });
    expect(page).toContain('url=/chartist/docs/target-lines-and-bands/"');
    expect(page).toContain(
      'href="https://example.org/chartist/docs/target-lines-and-bands/"'
    );
  });
});

describe('redirectHtml options', () => {
  const options = { title: 'Moved', text: 'Moved to' };

  test('stays out of search engines by default', () => {
    expect(redirectHtml('/docs/', options)).toContain(
      '<meta name="robots" content="noindex">'
    );
    expect(
      redirectHtml('https://chartist.dev/', { ...options, noindex: false })
    ).not.toContain('noindex');
  });

  test('picks the target by the hash with an anchor table', () => {
    const page = redirectHtml('https://chartist.dev/examples/', {
      ...options,
      anchors: {
        table: { 'stacked-bar': 'https://chartist.dev/examples/bar/stacked/' },
        fallback: 'https://chartist.dev/v0/examples.html'
      }
    });
    expect(page).toContain(
      '{"stacked-bar":"https://chartist.dev/examples/bar/stacked/"}'
    );
    expect(page).toContain(
      '"https://chartist.dev/v0/examples.html" + location.hash'
    );
    expect(page).not.toContain(
      'location.replace("https://chartist.dev/examples/" +'
    );
  });

  test('keeps script-breaking text out of the script', () => {
    const page = redirectHtml('/a/', {
      ...options,
      anchors: { table: { x: '</script><b>' }, fallback: '/v0/' }
    });
    expect(page).not.toContain('</script><b>');
  });
});
