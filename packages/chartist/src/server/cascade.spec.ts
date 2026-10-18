// @vitest-environment node
import { chartistCss } from '../../test/chartist-css';
import { lineChartConfig } from '../presets/lineChart';
import { findAll } from '../scene/tree';
import { node, type SceneNode } from '../scene/node';
import { toScene } from '../chart/toScene';
import type { ColorScheme } from './css';
import { applyStyles } from './applyStyles';

const apply = (
  scene: SceneNode,
  sheets: string[],
  scheme: ColorScheme = 'light'
) => applyStyles(scene, sheets, { colorScheme: scheme });

const lineScene = () =>
  toScene(
    lineChartConfig(
      {
        labels: ['Mon', 'Tue', 'Wed'],
        series: [
          [1, 3, 2],
          [2, 1, 3]
        ]
      },
      { showArea: true }
    ),
    { width: 600, height: 300 }
  );

/** The nodes of a role in series order: `[seriesA, seriesB]` per role. */
const byRole = (scene: SceneNode, role: 'line' | 'point' | 'area') =>
  findAll(scene, { role });

describe('server/cascade', () => {
  it('ranks by specificity, then by order', () => {
    const scene = apply(lineScene(), [
      '.ct-line { stroke-width: 2px }',
      '.ct-series-a .ct-line { stroke-width: 6px }',
      '.ct-line { stroke-width: 3px }'
    ]);
    expect(
      byRole(scene, 'line').map(line => line.attrs['stroke-width'])
    ).toEqual(['6px', '3px']);
  });

  it('ranks the later of two stylesheets, and the later declaration in a rule', () => {
    const scene = apply(lineScene(), [
      '.ct-line { stroke: red; stroke: blue }',
      '.ct-line { stroke: green }'
    ]);
    expect(byRole(scene, 'line').map(line => line.attrs.stroke)).toEqual([
      'green',
      'green'
    ]);
    const [first] = byRole(
      apply(lineScene(), ['.ct-line { stroke: red; stroke: blue }']),
      'line'
    );
    expect(first.attrs.stroke).toBe('blue');
  });

  it('lets !important win over specificity and order, and the style attribute over rules', () => {
    const root = node('svg').append(
      node('g', {}, 'group').append(
        node('path', { style: 'fill: red; stroke: blue' }, 'shape')
      )
    );
    const shape = (scene: SceneNode) => scene.children[0].children[0];
    const styledShape = shape(
      apply(root, [
        '.shape { opacity: 0.5 !important; fill: green; stroke: green !important }',
        '.group .shape { opacity: 1; stroke-width: 3px }'
      ])
    );
    expect(styledShape.attrs).toEqual({
      // The style attribute keeps fill; the !important stroke beats it and
      // leaves it.
      style: 'fill: red;',
      stroke: 'green',
      opacity: '0.5',
      'stroke-width': '3px'
    });
    expect(
      shape(apply(root, ['.shape { fill: green !important }'])).attrs
    ).toEqual({ fill: 'green', style: 'stroke: blue;' });
    const important = node('svg').append(
      node('path', { style: 'fill: red !important' }, 'shape')
    );
    expect(
      apply(important, ['.shape { fill: green !important }']).children[0].attrs
    ).toEqual({ style: 'fill: red !important' });
  });

  it('inherits custom properties through the scene, and your own override the stylesheet', () => {
    const scene = apply(lineScene(), [
      chartistCss,
      '.ct-series-a { --ct-color: teal; }'
    ]);
    const [lineA, lineB] = byRole(scene, 'line');
    const [pointA] = byRole(scene, 'point');
    const [areaA, areaB] = byRole(scene, 'area');
    expect(lineA.attrs.stroke).toBe('teal');
    expect(pointA.attrs.stroke).toBe('teal');
    expect(areaA.attrs.fill).toBe('teal');
    expect(lineB.attrs.stroke).toBe('#f05b4f');
    expect(areaB.attrs.fill).toBe('#f05b4f');
  });

  it('takes custom properties from style attributes and from ancestors', () => {
    const scene = toScene(
      lineChartConfig(
        { series: [[1, 2]] },
        {
          on: {
            scene: ({ scene: root }) => ({
              scene: root.attr({ style: '--ct-series-a: navy' })
            })
          }
        }
      ),
      { width: 300, height: 150 }
    );
    const [line] = byRole(apply(scene, [chartistCss]), 'line');
    expect(line.attrs.stroke).toBe('navy');
  });

  it('uses the dark values for the dark color scheme', () => {
    const grid = (scheme: ColorScheme) => {
      const scene = apply(lineScene(), [chartistCss], scheme);
      return {
        grid: findAll(scene, { role: 'grid' })[0].attrs.stroke,
        label: findAll(scene, { role: 'label' })[0].attrs.fill
      };
    };
    expect(grid('light')).toEqual({
      grid: 'rgba(0, 0, 0, 0.2)',
      label: 'rgba(0, 0, 0, 0.4)'
    });
    expect(grid('dark')).toEqual({
      grid: 'rgba(255, 255, 255, 0.2)',
      label: 'rgba(255, 255, 255, 0.6)'
    });
  });

  it('applies @media (prefers-color-scheme) rules for their scheme', () => {
    const css =
      '.ct-line { stroke: black } @media (prefers-color-scheme: dark) { .ct-line { stroke: white } }';
    expect(
      byRole(apply(lineScene(), [css], 'dark'), 'line')[0].attrs.stroke
    ).toBe('white');
    expect(byRole(apply(lineScene(), [css]), 'line')[0].attrs.stroke).toBe(
      'black'
    );
  });

  it("leaves declarations out that don't resolve, and custom properties in a cycle", () => {
    const scene = apply(lineScene(), [
      `.ct-series-a { --x: var(--y, red); --y: var(--x, blue); }
       .ct-series-a .ct-line { stroke: var(--x, green); fill: var(--nothing); }
       .ct-series-b .ct-line { stroke: var(--unset) }`
    ]);
    const [lineA, lineB] = byRole(scene, 'line');
    expect(lineA.attrs.stroke).toBe('green');
    expect(lineA.attrs.fill).toBeUndefined();
    expect(lineB.attrs.stroke).toBeUndefined();
  });

  it('writes only properties SVG has presentation attributes for', () => {
    const [line] = byRole(
      apply(lineScene(), [
        '.ct-line { stroke: red; transform: scale(2); line-height: 1; --mine: 1; x: 4 }'
      ]),
      'line'
    );
    expect(line.attrs.stroke).toBe('red');
    expect(line.attrs).not.toHaveProperty('transform');
    expect(line.attrs).not.toHaveProperty('line-height');
    expect(line.attrs).not.toHaveProperty('--mine');
    expect(line.attrs).not.toHaveProperty('x');
  });

  it("applies no rule whose only selector it can't match", () => {
    const scene = lineScene();
    expect(apply(scene, ['.ct-line:hover { stroke: red }'])).toBe(scene);
  });

  it('leaves the content of a foreignObject as it is', () => {
    const label = node('span', {}, 'ct-label');
    const object = node('foreignObject', {}, 'ct-object').append(label);
    const scene = apply(node('svg').append(object), [
      '.ct-label { fill: red; color: red } .ct-object { overflow: visible }'
    ]);
    expect(scene.children[0].attrs).toEqual({ overflow: 'visible' });
    expect(scene.children[0].children[0]).toBe(label);
  });

  it('keeps keys, roles, classes and text of the nodes it changes', () => {
    const scene = lineScene();
    const result = apply(scene, [chartistCss]);
    const [point] = findAll(scene, { role: 'point' });
    const [styledPoint] = findAll(result, { role: 'point' });
    expect(styledPoint).not.toBe(point);
    expect(styledPoint).toMatchObject({
      key: point.key,
      role: 'point',
      classes: point.classes,
      ctx: point.ctx
    });
    expect(point.key).toBeDefined();
    const [label] = findAll(scene, { role: 'label' });
    const [styledLabel] = findAll(result, { role: 'label' });
    expect(styledLabel.children.map(text => text.content)).toEqual(
      label.children.map(text => text.content)
    );
  });
});
