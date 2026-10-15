// @vitest-environment node
import { readFileSync } from 'node:fs';
import { seriesColors } from './colors';

/** The `$ct-series-colors` list of the Sass settings. */
function sassSeriesColors(): string[] {
  const settings = readFileSync(
    new URL('../styles/_settings.scss', import.meta.url),
    'utf8'
  );
  const list = /\$ct-series-colors:\s*\(([^)]*)\)/.exec(settings);
  if (!list) {
    throw new Error('$ct-series-colors not found in _settings.scss');
  }
  return list[1]
    .split(',')
    .map(color => color.trim().toLowerCase())
    .filter(Boolean);
}

describe('render/colors', () => {
  it('seriesColors are the colors of the Sass settings, in order', () => {
    expect(seriesColors).toEqual(sassSeriesColors());
  });

  it('has one color per series name', () => {
    expect(seriesColors).toHaveLength(15);
  });
});
