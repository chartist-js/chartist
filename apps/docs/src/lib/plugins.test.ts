import { describe, expect, test } from 'vitest';
import { PLUGINS, pluginFacts } from '../data/plugins';
import {
  pluginBySlug,
  pluginNeighbors,
  pluginSlug,
  sortedPlugins
} from './plugins';

describe('plugin pages', () => {
  const sorted = sortedPlugins();
  const slugs = sorted.map(pluginSlug);

  test('the overview lists every plugin, most downloaded first', () => {
    expect(sorted).toHaveLength(PLUGINS.length);
    const downloads = sorted.map(
      plugin => pluginFacts(plugin.package).monthlyDownloads
    );
    expect(downloads).toEqual([...downloads].sort((a, b) => b - a));
  });

  test('every plugin has a unique slug without @ or /', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test('a slug finds its plugin', () => {
    expect(pluginBySlug('chartist-plugin-threshold')?.package).toBe(
      'chartist-plugin-threshold'
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
