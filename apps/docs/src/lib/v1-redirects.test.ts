/**
 * The redirects for 1.x URLs: which 1.x pages there are, where their
 * redirects go and what they say. The built site is checked in the e2e
 * tests (e2e/v1-redirects.spec.ts), which run after the build.
 */
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  redirectFile,
  redirectPage,
  v1Pages,
  v2Files
} from '../../integrations/v1-redirects.mjs';

const V1 = fileURLToPath(new URL('../../public/v1/', import.meta.url));

describe('v1Pages', () => {
  test('lists the 1.x pages without .html, the home page as ""', async () => {
    const pages = await v1Pages(V1);
    expect(pages).toContain('');
    expect(pages).toContain('api');
    expect(pages).toContain('api/basics');
    expect(pages).toContain('api/classes/LineChart');
    expect(pages).toContain('docs/plugins');
    expect(pages).not.toContain('404');
    expect(pages.some(page => page.startsWith('assets'))).toBe(false);
  });
});

describe('the files of a path', () => {
  test('the redirect takes the 1.x file name', () => {
    expect(redirectFile('api/classes/LineChart')).toBe(
      'api/classes/LineChart.html'
    );
  });

  test('a v2 page is a file or a folder with an index', () => {
    expect(v2Files('')).toEqual(['index.html']);
    expect(v2Files('api')).toEqual(['api.html', 'api/index.html']);
  });
});

describe('redirectPage', () => {
  const page = redirectPage('api/classes/LineChart', {
    base: '/',
    site: 'https://chartist.dev'
  });

  test('works without JavaScript and tells search engines', () => {
    expect(page).toContain(
      '<meta http-equiv="refresh" content="0; url=/v1/api/classes/LineChart">'
    );
    expect(page).toContain(
      '<link rel="canonical" href="https://chartist.dev/v1/api/classes/LineChart">'
    );
    expect(page).toContain('<meta name="robots" content="noindex">');
    expect(page).toContain('<a href="/v1/api/classes/LineChart">');
  });

  test('keeps the query and hash with JavaScript', () => {
    expect(page).toContain(
      'location.replace("/v1/api/classes/LineChart" + location.search + location.hash)'
    );
  });

  test('stays out of search', () => {
    expect(page).not.toContain('data-pagefind-body');
  });

  test('follows the base path', () => {
    const based = redirectPage('docs/plugins', {
      base: '/chartist',
      site: 'https://example.org'
    });
    expect(based).toContain('url=/chartist/v1/docs/plugins"');
    expect(based).toContain(
      'href="https://example.org/chartist/v1/docs/plugins"'
    );
  });
});
