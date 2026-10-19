/**
 * Every registered package has a preview, rendered as HTML at build time.
 */
import { describe, expect, test } from 'vitest';
import { PACKAGES } from '../data/packages';
import { packagePreview } from './package-previews';

describe('packagePreview', () => {
  test.each(PACKAGES.map(pkg => pkg.slug))('%s has a preview', slug => {
    const preview = packagePreview(slug);
    expect(preview.html).not.toBe('');
    expect(preview.label).not.toBe('');
  });

  test('the terminal package draws text art with series classes', () => {
    const { html, terminal } = packagePreview('terminal');
    expect(html).toMatch(/^<pre class="ct-terminal">/);
    expect(html).toContain('ct-series-a');
    expect(html).toContain('ct-series-b');
    expect(terminal).toBe('ct-cli');
  });

  test('the essentials package draws a chart with axis titles', () => {
    const { html, terminal } = packagePreview('essentials');
    expect(html).toMatch(/^<svg[^>]*viewBox="0 0 480 280"/);
    expect(html).toMatch(/^<svg[^>]*aria-hidden="true"/);
    expect(html).not.toMatch(/^<svg[^>]*\sheight=/);
    expect(html).toMatch(
      /<text[^>]*class="ct-axis-title[^"]*"[^>]*>Day<\/text>/
    );
    expect(html).toMatch(
      /<text[^>]*class="ct-axis-title[^"]*"[^>]*>Visits<\/text>/
    );
    expect(terminal).toBeUndefined();
  });

  test('an unknown package throws', () => {
    expect(() => packagePreview('nope')).toThrow(/No preview/);
  });
});
