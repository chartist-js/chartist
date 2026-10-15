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
  movedPage
} from '../../integrations/redirects.mjs';

describe('moved pages', () => {
  const path = 'plugins/chartist-plugin-targetline/';

  test('the target line plugin goes to the guide', () => {
    expect(MOVED_PAGES[path]).toBe('docs/target-lines-and-bands/');
    expect(movedFile(path)).toBe(
      'plugins/chartist-plugin-targetline/index.html'
    );
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
