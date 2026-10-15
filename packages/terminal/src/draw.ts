import {
  SvgPath,
  textAscent,
  type MeasureText,
  type SceneNode,
  type SceneSize
} from 'chartist';
import {
  DOTS_X,
  DOTS_Y,
  createCanvas,
  type Canvas,
  type Ink
} from './canvas.ts';

/**
 * The width in px a terminal cell stands for in a scene: a glyph is half
 * as wide as high.
 * @experimental
 */
export const CELL_WIDTH = 8;
/**
 * The height in px a terminal cell stands for in a scene: one line.
 * @experimental
 */
export const CELL_HEIGHT = 16;

/** The px a braille dot stands for: 4 × 4, so circles stay round. */
const DOT_WIDTH = CELL_WIDTH / DOTS_X;
const DOT_HEIGHT = CELL_HEIGHT / DOTS_Y;

/** The ring width of donuts without `donutWidth`: `--ct-donut-width`. */
const DEFAULT_DONUT_WIDTH = 60;

/**
 * Measures text in terminal cells: each character is one cell wide and
 * one cell high, so labels are laid out on the character grid.
 * @experimental
 */
export const measureCells: MeasureText = text => ({
  width: [...text].length * CELL_WIDTH,
  height: CELL_HEIGHT,
  fontSize: CELL_HEIGHT
});

/**
 * The size to lay out a chart at for `columns` × `rows` terminal cells,
 * for `toScene()`: in px, with text measured in cells and SVG text labels.
 * @experimental
 */
export function terminalSize(columns: number, rows: number): SceneSize {
  return {
    width: columns * CELL_WIDTH,
    height: rows * CELL_HEIGHT,
    measureText: measureCells,
    labels: 'svg'
  };
}

/** Draws a scene on a canvas of the scene's size in cells. */
export function drawScene(scene: SceneNode): Canvas {
  const width = Number.parseFloat(String(scene.attrs.width));
  const height = Number.parseFloat(String(scene.attrs.height));
  if (!(width > 0 && height > 0)) {
    throw new Error(
      'Chartist terminal: the scene needs a width and height in px; lay it out with terminalSize().'
    );
  }
  const canvas = createCanvas(
    Math.round(width / CELL_WIDTH),
    Math.round(height / CELL_HEIGHT)
  );
  const grid = new Map<number, GridKind>();
  // Labels go last, so they can take the color of what's below them.
  const labels: SceneNode[] = [];

  const visit = (current: SceneNode, inherited: number | undefined) => {
    const series = seriesOf(current) ?? inherited;
    switch (current.role) {
      case 'gridBackground':
        return;
      case 'grid':
        drawGrid(canvas, grid, current.attrs);
        return;
      case 'bar':
        drawBar(canvas, current.attrs, series);
        return;
      case 'point':
        drawPoint(canvas, current.attrs.x1, current.attrs.y1, series);
        return;
      case 'line':
        strokePath(canvas, current.attrs.d, { kind: 'line', series });
        return;
      case 'area':
        fillPolygons(
          canvas,
          flatten(current.attrs.d),
          { kind: 'area', series },
          (x, y) => (x + y) % 2 === 0
        );
        return;
      case 'slice':
        fillSlice(canvas, current, series);
        return;
      case 'label':
        labels.push(current);
        return;
    }
    switch (current.name) {
      case 'text':
      case 'foreignObject':
        labels.push(current);
        return;
      case 'line':
        strokeSegment(
          canvas,
          Number(current.attrs.x1),
          Number(current.attrs.y1),
          Number(current.attrs.x2),
          Number(current.attrs.y2),
          { kind: 'line', series }
        );
        return;
      case 'circle':
        drawPoint(canvas, current.attrs.cx, current.attrs.cy, series);
        return;
      case 'path':
        strokePath(canvas, String(current.attrs.d), { kind: 'line', series });
        return;
    }
    for (const child of current.children) {
      visit(child, series);
    }
  };

  visit(scene, undefined);
  for (const label of labels) {
    drawLabel(canvas, label);
  }
  return canvas;
}

/** The series index of a `ct-series-x` class (`a` is 0). */
function seriesOf(current: SceneNode): number | undefined {
  for (const name of current.classes) {
    const match = /^ct-series-([a-z])$/.exec(name);
    if (match) {
      return match[1].charCodeAt(0) - 97;
    }
  }
  return undefined;
}

// --- Grid -----------------------------------------------------------------

type GridKind = 'h' | 'v' | '+';
const GRID_CHARS: Readonly<Record<GridKind, string>> = {
  h: '┈',
  v: '┊',
  '+': '┼'
};

interface LineAttrs {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

function drawGrid(
  canvas: Canvas,
  grid: Map<number, GridKind>,
  attrs: LineAttrs
) {
  const put = (column: number, row: number, kind: 'h' | 'v') => {
    const key = row * canvas.columns + column;
    const current = grid.get(key);
    const next = current && current !== kind ? '+' : kind;
    grid.set(key, next);
    canvas.char(column, row, GRID_CHARS[next], { kind: 'grid' });
  };
  if (attrs.y1 === attrs.y2) {
    const row = Math.floor(attrs.y1 / CELL_HEIGHT);
    const [from, to] = cellSpan(attrs.x1, attrs.x2, CELL_WIDTH);
    for (let column = from; column <= to; column++) {
      put(column, row, 'h');
    }
  } else {
    const column = Math.floor(attrs.x1 / CELL_WIDTH);
    const [from, to] = cellSpan(attrs.y1, attrs.y2, CELL_HEIGHT);
    for (let row = from; row <= to; row++) {
      put(column, row, 'v');
    }
  }
}

/** The first and last cell a span of px touches. */
function cellSpan(a: number, b: number, size: number): [number, number] {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const first = Math.floor(low / size);
  return [first, Math.max(first, Math.ceil(high / size) - 1)];
}

// --- Bars -----------------------------------------------------------------

const LOWER = ' ▁▂▃▄▅▆▇█';
const LEFT = ' ▏▎▍▌▋▊▉█';

/**
 * Draws a bar one cell thick in block characters, with an eighth block
 * where it ends inside a cell. Eighth blocks fill from the bottom or the
 * left; at the other end, half blocks stand in.
 */
function drawBar(canvas: Canvas, attrs: LineAttrs, series: number | undefined) {
  const vertical = attrs.x1 === attrs.x2;
  const size = vertical ? CELL_HEIGHT : CELL_WIDTH;
  const [a, b] = vertical ? [attrs.y1, attrs.y2] : [attrs.x1, attrs.x2];
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  if (end - start < size / 16) {
    return;
  }
  const across = vertical
    ? Math.floor(attrs.x1 / CELL_WIDTH)
    : Math.floor(attrs.y1 / CELL_HEIGHT);
  const [from, to] = cellSpan(start, end, size);
  for (let cell = from; cell <= to; cell++) {
    const cellStart = cell * size;
    const cellEnd = cellStart + size;
    const eighths = Math.round(
      ((Math.min(end, cellEnd) - Math.max(start, cellStart)) / size) * 8
    );
    if (eighths <= 0) {
      continue;
    }
    const atEnd = end >= cellEnd - 0.01;
    const atStart = start <= cellStart + 0.01;
    // Eighth blocks fill from the cell's bottom (its end, downwards) or
    // from its left (its start).
    const eighthBlock = vertical ? atEnd : atStart;
    let char: string;
    if (eighths >= 8 || (atEnd && atStart)) {
      char = '█';
    } else if (vertical) {
      char = eighthBlock ? LOWER[eighths] : eighths >= 3 ? '▀' : '▔';
    } else {
      char = eighthBlock ? LEFT[eighths] : eighths >= 3 ? '▐' : '▕';
    }
    const [column, row] = vertical ? [across, cell] : [cell, across];
    // A stacked bar's base shares a cell with the end of the bar below
    // it: that bar's color fills the rest of the cell.
    const below =
      char === '█' || eighthBlock ? undefined : canvas.cellAt(column, row);
    const background = below?.ink.kind === 'bar' ? below.ink.series : undefined;
    canvas.char(column, row, char, { kind: 'bar', series, background });
  }
}

// --- Dots: points, lines, areas ------------------------------------------

function drawPoint(
  canvas: Canvas,
  x: unknown,
  y: unknown,
  series: number | undefined
) {
  const dx = Math.floor(Number(x) / DOT_WIDTH);
  const dy = Math.floor(Number(y) / DOT_HEIGHT);
  for (const [ox, oy] of [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ]) {
    canvas.dot(dx + ox, dy + oy, { kind: 'point', series });
  }
}

function strokeSegment(
  canvas: Canvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ink: Ink
) {
  const ax = x1 / DOT_WIDTH;
  const ay = y1 / DOT_HEIGHT;
  const bx = x2 / DOT_WIDTH;
  const by = y2 / DOT_HEIGHT;
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2)
  );
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    canvas.dot(ax + (bx - ax) * t, ay + (by - ay) * t, ink);
  }
}

type Polyline = { x: number; y: number }[];

/** A path's subpaths as polylines in px; curves become short segments. */
export function flatten(d: string): Polyline[] {
  const polylines: Polyline[] = [];
  let current: Polyline = [];
  let x = 0;
  let y = 0;
  for (const element of new SvgPath().parse(d).pathElements) {
    const command = element.command.toUpperCase();
    const at = element as unknown as Readonly<Record<string, number>>;
    if (command === 'M') {
      if (current.length) {
        polylines.push(current);
      }
      current = [{ x: at.x, y: at.y }];
    } else if (command === 'C') {
      const segments = 16;
      for (let step = 1; step <= segments; step++) {
        const t = step / segments;
        const u = 1 - t;
        current.push({
          x:
            u * u * u * x +
            3 * u * u * t * at.x1 +
            3 * u * t * t * at.x2 +
            t * t * t * at.x,
          y:
            u * u * u * y +
            3 * u * u * t * at.y1 +
            3 * u * t * t * at.y2 +
            t * t * t * at.y
        });
      }
    } else {
      // Lines, and arcs as their chord: only slices have arcs, and those
      // are filled by angle instead.
      current.push({ x: at.x, y: at.y });
    }
    x = at.x;
    y = at.y;
  }
  if (current.length) {
    polylines.push(current);
  }
  return polylines;
}

function strokePath(canvas: Canvas, d: string, ink: Ink) {
  for (const polyline of flatten(d)) {
    for (let index = 1; index < polyline.length; index++) {
      const from = polyline[index - 1];
      const to = polyline[index];
      strokeSegment(canvas, from.x, from.y, to.x, to.y, ink);
    }
  }
}

/** Fills closed polygons (even-odd) with dots where `pattern` says so. */
function fillPolygons(
  canvas: Canvas,
  polygons: Polyline[],
  ink: Ink,
  pattern: (x: number, y: number) => boolean
) {
  for (let dy = 0; dy < canvas.rows * DOTS_Y; dy++) {
    const y = (dy + 0.5) * DOT_HEIGHT;
    const crossings: number[] = [];
    for (const polygon of polygons) {
      for (let index = 0; index < polygon.length; index++) {
        const a = polygon[index];
        const b = polygon[(index + 1) % polygon.length];
        if (a.y <= y !== b.y <= y) {
          crossings.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
        }
      }
    }
    crossings.sort((a, b) => a - b);
    for (let index = 0; index + 1 < crossings.length; index += 2) {
      const from = Math.ceil(crossings[index] / DOT_WIDTH - 0.5);
      const to = Math.floor(crossings[index + 1] / DOT_WIDTH - 0.5);
      for (let dx = from; dx <= to; dx++) {
        if (pattern(dx, dy)) {
          canvas.dot(dx, dy, ink);
        }
      }
    }
  }
}

// --- Slices ---------------------------------------------------------------

function fillSlice(
  canvas: Canvas,
  current: SceneNode,
  series: number | undefined
) {
  if (current.role !== 'slice') {
    return;
  }
  const { center, radius, startAngle, endAngle } = current.ctx;
  const span = endAngle - startAngle;
  let inner = 0;
  let outer = radius;
  if (current.classes.some(name => name.startsWith('ct-slice-donut'))) {
    const style = /stroke-width:\s*([\d.]+)px/.exec(
      String(current.attrs.style ?? '')
    );
    const ring = style ? Number(style[1]) : DEFAULT_DONUT_WIDTH;
    inner = radius - ring / 2;
    outer = radius + ring / 2;
  }
  const ink: Ink = { kind: 'slice', series };
  for (
    let dy = Math.floor((center.y - outer) / DOT_HEIGHT);
    dy <= Math.ceil((center.y + outer) / DOT_HEIGHT);
    dy++
  ) {
    for (
      let dx = Math.floor((center.x - outer) / DOT_WIDTH);
      dx <= Math.ceil((center.x + outer) / DOT_WIDTH);
      dx++
    ) {
      const x = (dx + 0.5) * DOT_WIDTH - center.x;
      const y = (dy + 0.5) * DOT_HEIGHT - center.y;
      const distance = Math.hypot(x, y);
      if (distance > outer || distance < inner) {
        continue;
      }
      // Degrees clockwise from the top, as the slice's angles are.
      const angle = (Math.atan2(x, -y) * 180) / Math.PI;
      const offset = (((angle - startAngle) % 360) + 360) % 360;
      if (span >= 360 || offset < span) {
        canvas.dot(dx, dy, ink);
      }
    }
  }
}

// --- Labels ---------------------------------------------------------------

interface LabelLine {
  readonly text: string;
  /** The anchor's X, in px. */
  readonly x: number;
  /** The line's vertical center, in px. */
  readonly y: number;
  readonly anchor: 'start' | 'middle' | 'end';
}

function drawLabel(canvas: Canvas, current: SceneNode) {
  for (const line of labelLines(current)) {
    const chars = [...line.text];
    const anchor = line.x / CELL_WIDTH;
    const start = Math.round(
      line.anchor === 'middle'
        ? anchor - chars.length / 2
        : line.anchor === 'end'
          ? anchor - chars.length
          : anchor
    );
    const row = Math.floor(line.y / CELL_HEIGHT);
    chars.forEach((char, index) => {
      const column = start + index;
      const below = canvas.cellAt(column, row)?.ink;
      canvas.char(column, row, char, {
        kind: 'label',
        background: below?.kind === 'label' ? below.background : below?.series
      });
    });
  }
}

function labelLines(current: SceneNode): LabelLine[] {
  if (current.name === 'text') {
    const anchor =
      (current.attrs['text-anchor'] as LabelLine['anchor'] | undefined) ??
      'start';
    // Pie labels are placed with `dx` and `dy` at their center, as in 1.x;
    // other text at its baseline, `textAscent` of a line below its top.
    const centered = current.attrs.dy !== undefined;
    const spans = current.children.filter(child => child.name === 'tspan');
    return (spans.length ? spans : [current]).map(source => ({
      text: source.content ?? '',
      x: Number(source.attrs.x ?? current.attrs.x ?? current.attrs.dx),
      y: centered
        ? Number(current.attrs.dy)
        : Number(source.attrs.y ?? current.attrs.y) -
          (textAscent - 0.5) * CELL_HEIGHT,
      anchor
    }));
  }
  // HTML labels: the axis label's box, its text at the top left.
  if (current.role === 'label' && current.ctx.kind === 'axis') {
    const { text, x, y } = current.ctx;
    return [{ text: String(text), x, y: y + CELL_HEIGHT / 2, anchor: 'start' }];
  }
  return [];
}
