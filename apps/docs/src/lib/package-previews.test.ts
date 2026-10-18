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

  test('an unknown package throws', () => {
    expect(() => packagePreview('nope')).toThrow(/No preview/);
  });
});
