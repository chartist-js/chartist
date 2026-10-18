// @vitest-environment node
/**
 * The markup of applyStyles() drawn by a real SVG rasterizer, resvg, which
 * reads `<style>` elements but no custom properties, `var()` or
 * `light-dark()`: the lines, points, grid and labels get Chartist's colors
 * from the attributes alone.
 */
import { Resvg } from '@resvg/resvg-js';
import { chartistCss } from '../../test/chartist-css';
import { toScene } from '../chart/toScene';
import { lineChartConfig } from '../presets/lineChart';
import { findAll } from '../scene/tree';
import type { SceneNode } from '../scene/node';
import { applyStyles } from './applyStyles';
import { renderToString } from './string';

// Drawn at twice the size, so 1px lines on whole coordinates cover whole
// pixels.
const ZOOM = 2;
const scene = toScene(
  lineChartConfig(
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3]
      ]
    },
    { lineSmooth: false }
  ),
  { width: 600, height: 300 }
);

type Rgb = readonly [number, number, number];

function raster(markup: string) {
  const image = new Resvg(markup, {
    background: 'white',
    fitTo: { mode: 'zoom', value: ZOOM }
  }).render();
  // A copy on every read, so read once.
  const { pixels, width } = image;
  const at = (x: number, y: number): Rgb => {
    const i = (Math.round(y * ZOOM) * width + Math.round(x * ZOOM)) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };
  /** The darkest pixel in a box, in scene units. */
  const darkest = (x: number, y: number, width: number, height: number) => {
    let found: Rgb = [255, 255, 255];
    for (let dy = 0; dy < height; dy += 1 / ZOOM) {
      for (let dx = 0; dx < width; dx += 1 / ZOOM) {
        const pixel = at(x + dx, y + dy);
        if (pixel[0] + pixel[1] + pixel[2] < found[0] + found[1] + found[2]) {
          found = pixel;
        }
      }
    }
    return found;
  };
  return { at, darkest };
}

const near = (actual: Rgb, expected: Rgb, tolerance = 4) =>
  actual.every((value, i) => Math.abs(value - expected[i]) <= tolerance);

const num = (current: SceneNode, name: string) => Number(current.attrs[name]);

// Chartist's colors over white: the first series, the grid at 0.2 black,
// labels at 0.4 black.
const SERIES_A: Rgb = [0xd7, 0x02, 0x06];
const GRID: Rgb = [204, 204, 204];
const LABEL: Rgb = [153, 153, 153];

describe('server/applyStyles in a rasterizer', () => {
  const styled = raster(renderToString(applyStyles(scene, chartistCss)));
  const plain = raster(renderToString(scene));
  const [first, second] = findAll(scene, { role: 'point' });
  // Halfway between the first two points of the first series, on its line.
  const lineX = (num(first, 'x1') + num(second, 'x1')) / 2;
  const lineY = (num(first, 'y1') + num(second, 'y1')) / 2;

  it("draws the first series' line and points in its color", () => {
    expect(styled.at(lineX, lineY)).toSatisfy(pixel => near(pixel, SERIES_A));
    expect(styled.at(num(first, 'x1'), num(first, 'y1'))).toSatisfy(pixel =>
      near(pixel, SERIES_A)
    );
  });

  it('draws the grid lines and labels in their colors', () => {
    // The grid line at Wed, near the top, where no series runs.
    const grid = findAll(scene, { role: 'grid' }).filter(line =>
      line.classes.includes('ct-horizontal')
    )[2];
    const x = num(grid, 'x1');
    expect(styled.darkest(x, num(grid, 'y1') + 2, 0.5, 8)).toSatisfy(pixel =>
      near(pixel, GRID)
    );

    const label = findAll(scene, { role: 'label' })[0];
    const box = styled.darkest(
      num(label, 'x') - 2,
      num(label, 'y') - 14,
      30,
      16
    );
    expect(box).toSatisfy(pixel => near(pixel, LABEL, 12));
  });

  it('without applyStyles(), draws the line in another color', () => {
    expect(plain.at(lineX, lineY)).not.toSatisfy(pixel =>
      near(pixel, SERIES_A, 40)
    );
  });
});
