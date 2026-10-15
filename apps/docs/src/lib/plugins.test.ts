import { describe, expect, test } from 'vitest';
import {
  pluginBySlug,
  pluginNeighbors,
  pluginSlug,
  sortedPlugins
} from './plugins';

describe('plugin pages', () => {
  const sorted = sortedPlugins();
  const slugs = sorted.map(pluginSlug);

  test('every plugin has a unique slug without @ or /', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test('a slug finds its plugin', () => {
    expect(pluginBySlug('stklcode-chartist-plugin-tooltips')?.package).toBe(
      '@stklcode/chartist-plugin-tooltips'
    );
    expect(pluginBySlug('nope')).toBeUndefined();
  });

  test('neighbors follow the overview order', () => {
    expect(pluginNeighbors(slugs[0])).toEqual({
      previous: undefined,
      next: sorted[1]
    });
    expect(pluginNeighbors(slugs[1])).toEqual({
      previous: sorted[0],
      next: sorted[2]
    });
    expect(pluginNeighbors(slugs.at(-1)!).next).toBeUndefined();
  });
});
