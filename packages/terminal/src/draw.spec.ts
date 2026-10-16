import {
  barChartConfig,
  lineChartConfig,
  node,
  pieChartConfig,
  toScene,
  type AttrValue,
  type NodeRole,
  type SceneNode
} from 'chartist';
import { toPlainText } from './canvas.ts';
import { drawScene, measureCells, terminalSize } from './draw.ts';

const BRAILLE = /[⠁-⣿]/;

/** A hand-made scene of `columns` × `rows` cells. */
function scene(
  columns: number,
  rows: number,
  children: SceneNode[]
): SceneNode {
  return children.reduce(
    (root, child) => root.append(child),
    node('svg', { width: columns * 8, height: rows * 16 })
  );
}

/** A node with a built-in role (its context is left empty). */
function withRole(
  name: string,
  attrs: Record<string, AttrValue>,
  role: NodeRole,
  ctx: object = {}
): SceneNode {
  return node(name, attrs, undefined, { role, ctx } as never);
}

const series = (letter: string, ...children: SceneNode[]) =>
  children.reduce(
    (group, child) => group.append(child),
    node('g', {}, `ct-series ct-series-${letter}`)
  );

const plain = (root: SceneNode) => toPlainText(drawScene(root));
const lines = (text: string) => text.split('\n');

describe('cell geometry', () => {
  it('measures text one cell per character', () => {
    expect(measureCells('Tue')).toEqual({
      width: 24,
      height: 16,
      fontSize: 16
    });
    expect(terminalSize(10, 5)).toMatchObject({
      width: 80,
      height: 80,
      labels: 'svg'
    });
  });

  it('fits the output into the columns and rows', () => {
    const output = plain(
      toScene(
        lineChartConfig({ labels: ['Mon', 'Tue', 'Wed'], series: [[1, 4, 2]] }),
        terminalSize(60, 15)
      )
    );
    expect(lines(output).length).toBeLessThanOrEqual(15);
    for (const line of lines(output)) {
      expect([...line].length).toBeLessThanOrEqual(60);
      expect(line).toBe(line.trimEnd());
    }
  });

  it('needs a scene with a size in px', () => {
    expect(() => drawScene(node('svg'))).toThrow('terminalSize()');
  });
});

describe('lines, points and areas', () => {
  it('draws a line chart in braille', () => {
    const output = plain(
      toScene(lineChartConfig({ series: [[1, 4, 2]] }), terminalSize(40, 10))
    );
    expect(output).toMatch(BRAILLE);
  });

  it('follows curves', () => {
    const output = plain(
      scene(10, 2, [
        withRole('path', { d: 'M0,28C20,-10,60,-10,79,28' }, 'line')
      ])
    );
    // The curve rises into the top row and comes back down.
    expect(lines(output)[0]).toMatch(BRAILLE);
    expect(lines(output)[1]).toMatch(BRAILLE);
  });

  it('shades areas below the grid', () => {
    const output = plain(
      scene(10, 2, [
        withRole('line', { x1: 0, y1: 8, x2: 80, y2: 8 }, 'grid'),
        series('a', withRole('path', { d: 'M0,0L80,0L80,32L0,32Z' }, 'area'))
      ])
    );
    expect(lines(output)[0]).toBe('┈'.repeat(10));
    expect(lines(output)[1]).toMatch(/^[⠁-⣿]{10}$/);
  });
});

describe('target lines and bands', () => {
  /** A node with a role and classes, as the layers draw them. */
  const classed = (
    name: string,
    attrs: Record<string, AttrValue>,
    role: NodeRole,
    className?: string
  ): SceneNode => node(name, attrs, className, { role, ctx: {} } as never);
  const band = (d: string, className?: string) =>
    classed('path', { d }, 'band', className);

  it('shades a band below the grid and draws the line over it', () => {
    const canvas = drawScene(
      scene(10, 3, [
        withRole('line', { x1: 0, y1: 8, x2: 80, y2: 8 }, 'grid'),
        band('M0,0L80,0L80,32L0,32Z', 'ct-band-area'),
        series('a', withRole('path', { d: 'M0,40L80,40' }, 'line'))
      ])
    );
    const output = lines(toPlainText(canvas));
    expect(output[0]).toBe('┈'.repeat(10));
    expect(output[1]).toMatch(/^[⠁-⣿]{10}$/);
    expect(canvas.cellAt(0, 1)?.ink).toEqual({ kind: 'area' });
    expect(canvas.cellAt(0, 2)?.ink).toEqual({ kind: 'line', series: 0 });
  });

  it('gives a band the color of its series class or group', () => {
    const canvas = drawScene(
      scene(10, 2, [
        band('M0,0L40,0L40,32L0,32Z', 'ct-band-area ct-series-c'),
        series('b', band('M40,0L80,0L80,32L40,32Z', 'ct-band-area'))
      ])
    );
    expect(canvas.cellAt(0, 0)?.ink).toEqual({ kind: 'area', series: 2 });
    expect(canvas.cellAt(9, 0)?.ink).toEqual({ kind: 'area', series: 1 });
  });

  it('draws a target line in braille with its label next to it', () => {
    const canvas = drawScene(
      scene(16, 3, [
        withRole('line', { x1: 0, y1: 24, x2: 79, y2: 24 }, 'grid'),
        withRole('line', { x1: 0, y1: 24, x2: 79, y2: 24 }, 'targetLine'),
        classed(
          'text',
          { x: 80, y: 16 + 0.85 * 16, 'text-anchor': 'start' },
          'targetLabel',
          'ct-target-label'
        ).text('target')
      ])
    );
    const output = lines(toPlainText(canvas));
    expect(output[1]).toMatch(/^[⠁-⣿]{10}target$/);
    expect(canvas.cellAt(0, 1)?.ink).toEqual({ kind: 'line' });
    expect(canvas.cellAt(11, 1)?.ink).toEqual({ kind: 'label' });
  });

  it('gives a target line with a series class that series color', () => {
    const canvas = drawScene(
      scene(10, 1, [
        classed(
          'line',
          { x1: 0, y1: 8, x2: 79, y2: 8 },
          'targetLine',
          'ct-target-line ct-series-b'
        )
      ])
    );
    expect(canvas.cellAt(0, 0)?.ink).toEqual({ kind: 'line', series: 1 });
  });
});

describe('bars', () => {
  it('ends a vertical bar with an eighth block', () => {
    const output = plain(
      scene(1, 4, [withRole('line', { x1: 4, y1: 64, x2: 4, y2: 42 }, 'bar')])
    );
    expect(lines(output)).toEqual(['', '', '▃', '█']);
  });

  it('ends a horizontal bar with an eighth block', () => {
    const output = plain(
      scene(3, 1, [withRole('line', { x1: 0, y1: 8, x2: 11, y2: 8 }, 'bar')])
    );
    expect(output).toBe('█▍');
  });

  it('shows both stacked bars in the cell where they meet', () => {
    const canvas = drawScene(
      scene(1, 4, [
        series('a', withRole('line', { x1: 4, y1: 64, x2: 4, y2: 40 }, 'bar')),
        series('b', withRole('line', { x1: 4, y1: 40, x2: 4, y2: 20 }, 'bar'))
      ])
    );
    expect(canvas.cellAt(0, 2)).toEqual({
      char: '▀',
      ink: { kind: 'bar', series: 1, background: 0 }
    });
  });

  it('draws horizontal stacked bars from the bar preset', () => {
    const output = plain(
      toScene(
        barChartConfig(
          {
            labels: ['A', 'B'],
            series: [
              [3, 1],
              [2, 2]
            ]
          },
          { horizontalBars: true, stackBars: true }
        ),
        terminalSize(40, 10)
      )
    );
    expect(output).toContain('█');
  });
});

describe('slices', () => {
  it('leaves a donut empty in the middle', () => {
    const output = plain(
      toScene(
        pieChartConfig(
          { series: [1] },
          { donut: true, donutWidth: 20, showLabel: false }
        ),
        terminalSize(30, 12)
      )
    );
    const middle = lines(output)[6];
    expect(middle).toMatch(/⣿[⠁-⣿]* {8,}[⠁-⣿]*⣿/);
  });

  it('fills a pie and puts each label on its slice', () => {
    const canvas = drawScene(
      toScene(
        pieChartConfig({ labels: ['A', 'B'], series: [1, 1] }),
        terminalSize(30, 12)
      )
    );
    const text = toPlainText(canvas);
    expect(text).toContain('⣿');
    const row = lines(text).findIndex(line => line.includes('A'));
    const column = [...lines(text)[row]].indexOf('A');
    expect(canvas.cellAt(column, row)?.ink).toEqual({
      kind: 'label',
      background: 0
    });
  });

  it('draws a label with a line break on two rows', () => {
    const text = toPlainText(
      drawScene(
        toScene(
          pieChartConfig({ labels: ['Ab\n60%', 'Cd\n40%'], series: [3, 2] }),
          terminalSize(30, 12)
        )
      )
    );
    const rows = lines(text);
    const first = rows.findIndex(line => line.includes('Ab'));
    expect(rows[first + 1]).toContain('60%');
    const second = rows.findIndex(line => line.includes('Cd'));
    expect(rows[second + 1]).toContain('40%');
  });
});

describe('grid', () => {
  it('crosses grid lines with ┼', () => {
    const output = plain(
      scene(5, 3, [
        withRole('line', { x1: 0, y1: 24, x2: 40, y2: 24 }, 'grid'),
        withRole('line', { x1: 20, y1: 0, x2: 20, y2: 48 }, 'grid')
      ])
    );
    expect(lines(output)).toEqual(['  ┊', '┈┈┼┈┈', '  ┊']);
  });

  it('lets lines replace the grid they cross', () => {
    const output = plain(
      scene(5, 1, [
        withRole('line', { x1: 0, y1: 8, x2: 40, y2: 8 }, 'grid'),
        withRole('path', { d: 'M20,0L20,15' }, 'line')
      ])
    );
    expect(output).toMatch(/^┈┈[⠁-⣿]┈┈$/);
  });
});

describe('labels', () => {
  it('writes a text line in the row of its vertical center', () => {
    // Baseline at 0.85 em below the top of a line that starts at y = 16.
    const label = node('text', {
      x: 8,
      y: 16 + 0.85 * 16,
      'text-anchor': 'start'
    }).text('Hi');
    expect(lines(plain(scene(4, 3, [label])))).toEqual(['', ' Hi']);
  });

  it('anchors text at its end or middle', () => {
    const end = node('text', { x: 32, y: 13.6, 'text-anchor': 'end' }).text(
      'ab'
    );
    const middle = node('text', {
      x: 16,
      y: 29.6,
      'text-anchor': 'middle'
    }).text('cd');
    expect(lines(plain(scene(4, 2, [end, middle])))).toEqual(['  ab', ' cd']);
  });

  it('writes each wrapped line of a label', () => {
    const label = node('text', { x: 0, y: 13.6 })
      .append(node('tspan', { x: 0, y: 13.6 }).text('one'))
      .append(node('tspan', { x: 0, y: 29.6 }).text('two'));
    expect(lines(plain(scene(4, 2, [label])))).toEqual(['one', 'two']);
  });
});

describe('nodes without a built-in role', () => {
  it('draws a plugin line in braille, and circles as points', () => {
    const output = plain(
      scene(10, 2, [
        node('line', { x1: 0, y1: 4, x2: 79, y2: 4 }),
        node('circle', { cx: 40, cy: 24, r: 3 })
      ])
    );
    expect(lines(output)[0]).toBe('⠒'.repeat(10));
    expect(lines(output)[1]).toMatch(BRAILLE);
  });

  it('draws a node a plugin replaced, keeping its role, by its element', () => {
    // As in the circles plugin of the plugin guide: a point becomes a circle.
    const output = plain(
      scene(4, 2, [
        series('b', withRole('circle', { cx: 12, cy: 16, r: 5 }, 'point'))
      ])
    );
    expect(output).toMatch(BRAILLE);
  });

  it('skips other elements and draws their children', () => {
    const group = node('g', {}, 'plugin').append(
      node('rect', { x: 0, y: 0, width: 8, height: 8 })
    );
    const output = plain(
      scene(2, 1, [group.append(node('text', { x: 0, y: 13.6 }).text('ok'))])
    );
    expect(output).toBe('ok');
  });
});
