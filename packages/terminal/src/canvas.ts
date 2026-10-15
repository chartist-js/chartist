/**
 * The character grid a chart is drawn on. Each cell is either a character
 * (text, a block, a grid line) or a braille pattern of 2 × 4 dots, and
 * keeps what it shows: its kind and series. Serializers turn that into
 * ANSI colors or HTML classes. What a cell shows is decided by priority,
 * so a line hides the grid it crosses and a label sits on top.
 */

/** What a cell draws. */
export type Kind =
  | 'grid'
  | 'area'
  | 'bar'
  | 'line'
  | 'slice'
  | 'point'
  | 'label';

/** What a cell shows: its kind, its series and the series behind it. */
export interface Ink {
  readonly kind: Kind;
  /** The series index, for its color. */
  readonly series?: number;
  /** The series whose color fills the rest of the cell. */
  readonly background?: number;
}

/** A resolved cell: its character and ink. */
export interface Cell {
  readonly char: string;
  readonly ink: Ink;
}

/** What draws over what; higher wins a cell. */
export const PRIORITY: Readonly<Record<Kind, number>> = {
  area: 1,
  grid: 2,
  bar: 3,
  line: 4,
  slice: 4,
  point: 5,
  label: 6
};

/** Braille dots per cell, across and down. */
export const DOTS_X = 2;
export const DOTS_Y = 4;

// Braille dot bits by [row][column] in a cell, from U+2800.
const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80]
];

interface CharCell {
  readonly char: string;
  readonly ink: Ink;
  readonly priority: number;
}

interface DotCell {
  mask: number;
  priority: number;
  /** Dots per ink at the cell's priority; the ink with most dots wins. */
  readonly inks: Map<string, { ink: Ink; dots: number }>;
}

export interface Canvas {
  readonly columns: number;
  readonly rows: number;
  /** Sets the dot at (`x`, `y`), in dots from the top left. */
  dot(x: number, y: number, ink: Ink): void;
  /** Sets a cell's character, if its ink's priority wins the cell. */
  char(column: number, row: number, char: string, ink: Ink): void;
  /** What the cell shows now, if anything. */
  cellAt(column: number, row: number): Cell | undefined;
  /** All cells, row by row; `undefined` for empty cells. */
  cells(): (Cell | undefined)[][];
}

const inkKey = (ink: Ink) =>
  `${ink.kind}/${ink.series ?? ''}/${ink.background ?? ''}`;

export function createCanvas(columns: number, rows: number): Canvas {
  const size = columns * rows;
  const chars: (CharCell | undefined)[] = Array.from({ length: size });
  const dots: (DotCell | undefined)[] = Array.from({ length: size });
  const inside = (column: number, row: number) =>
    column >= 0 && row >= 0 && column < columns && row < rows;

  const resolve = (index: number): Cell | undefined => {
    const text = chars[index];
    const braille = dots[index];
    if (braille && (!text || braille.priority > text.priority)) {
      let best: { ink: Ink; dots: number } | undefined;
      for (const entry of braille.inks.values()) {
        if (!best || entry.dots > best.dots) {
          best = entry;
        }
      }
      if (best) {
        return {
          char: String.fromCharCode(0x2800 + braille.mask),
          ink: best.ink
        };
      }
    }
    return text && { char: text.char, ink: text.ink };
  };

  return {
    columns,
    rows,
    dot(x, y, ink) {
      const dx = Math.floor(x);
      const dy = Math.floor(y);
      const column = Math.floor(dx / DOTS_X);
      const row = Math.floor(dy / DOTS_Y);
      if (!inside(column, row)) {
        return;
      }
      const priority = PRIORITY[ink.kind];
      const index = row * columns + column;
      let cell = dots[index];
      if (!cell) {
        cell = { mask: 0, priority, inks: new Map() };
        dots[index] = cell;
      }
      if (priority > cell.priority) {
        // A higher priority clears what was drawn below it in this cell.
        cell.mask = 0;
        cell.priority = priority;
        cell.inks.clear();
      } else if (priority < cell.priority) {
        return;
      }
      const bit = DOT_BITS[dy - row * DOTS_Y][dx - column * DOTS_X];
      if (cell.mask & bit) {
        return;
      }
      cell.mask |= bit;
      const key = inkKey(ink);
      cell.inks.set(key, { ink, dots: (cell.inks.get(key)?.dots ?? 0) + 1 });
    },
    char(column, row, char, ink) {
      column = Math.floor(column);
      row = Math.floor(row);
      if (!inside(column, row)) {
        return;
      }
      const priority = PRIORITY[ink.kind];
      const index = row * columns + column;
      const current = chars[index];
      if (!current || priority >= current.priority) {
        chars[index] = { char, ink, priority };
      }
    },
    cellAt(column, row) {
      return inside(column, row) ? resolve(row * columns + column) : undefined;
    },
    cells() {
      const all: (Cell | undefined)[][] = [];
      for (let row = 0; row < rows; row++) {
        const cells: (Cell | undefined)[] = [];
        for (let column = 0; column < columns; column++) {
          cells.push(resolve(row * columns + column));
        }
        all.push(cells);
      }
      return all;
    }
  };
}

/** The canvas as plain text: no colors, no trailing spaces or empty lines. */
export function toPlainText(canvas: Canvas): string {
  return trimLines(
    canvas.cells().map(row => row.map(cell => cell?.char ?? ' ').join(''))
  );
}

/** Drops trailing spaces of each line and empty lines at the end. */
export function trimLines(lines: string[]): string {
  const trimmed = lines.map(line => line.trimEnd());
  while (trimmed.length && trimmed[trimmed.length - 1] === '') {
    trimmed.pop();
  }
  return trimmed.join('\n');
}
