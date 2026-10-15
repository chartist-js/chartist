/**
 * Builds "Chartist Terminal", the font the HTML output draws its graphic
 * characters with: the 256 braille patterns, the grid's box-drawing
 * characters, the block characters of bars and the legend marker. Most
 * fonts lack some of these, and the fallback fonts browsers pick don't fill
 * a cell, so dots, grid lines and bars would break apart. These glyphs are
 * drawn from geometry to fill a cell of 0.6 × 1 em edge to edge.
 *
 * The output is WOFF 1.0: the font's tables, each compressed with zlib.
 */
import { deflateSync } from 'node:zlib';
import opentype from 'opentype.js';

const { Font, Glyph, Path } = opentype;
type Path = InstanceType<typeof Path>;

const EM = 1000;
const WIDTH = 600;
const ASCENT = 800;
const DESCENT = -200;
const MIDDLE = (ASCENT + DESCENT) / 2;
const LINE = 50;

const rect = (path: Path, x1: number, y1: number, x2: number, y2: number) => {
  path.moveTo(x1, y1);
  path.lineTo(x2, y1);
  path.lineTo(x2, y2);
  path.lineTo(x1, y2);
  path.close();
};

/** A circle from four cubic curves. */
const circle = (path: Path, cx: number, cy: number, r: number) => {
  const k = 0.5523 * r;
  path.moveTo(cx + r, cy);
  path.curveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  path.curveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
  path.curveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  path.curveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
  path.close();
};

const glyph = (
  name: string,
  unicode: number | undefined,
  draw: (path: Path) => void
) => {
  const path = new Path();
  draw(path);
  return new Glyph({ name, unicode, advanceWidth: WIDTH, path });
};

// Braille dots: two columns, four rows, a quarter of the cell's height
// each. Bits as in Unicode: 1–3 and 7 down the left, 4–6 and 8 the right.
const DOTS: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 1],
  [1, 2],
  [0, 3],
  [1, 3]
];
const braille = (bits: number) =>
  glyph(`braille${bits}`, 0x2800 + bits, path => {
    DOTS.forEach(([column, row], bit) => {
      if (bits & (1 << bit)) {
        circle(
          path,
          (column + 0.5) * (WIDTH / 2),
          ASCENT - (row + 0.5) * (EM / 4),
          95
        );
      }
    });
  });

const horizontal = (path: Path) =>
  rect(path, 0, MIDDLE - LINE / 2, WIDTH, MIDDLE + LINE / 2);
const vertical = (path: Path) =>
  rect(path, WIDTH / 2 - LINE / 2, DESCENT, WIDTH / 2 + LINE / 2, ASCENT);

/** Building blocks: the block characters as rectangles in the cell. */
const BLOCKS: readonly [number, [number, number, number, number]][] = [
  // Lower eighths, ▁ to █.
  ...Array.from(
    { length: 8 },
    (_, i): [number, [number, number, number, number]] => [
      0x2581 + i,
      [0, DESCENT, WIDTH, DESCENT + ((i + 1) * EM) / 8]
    ]
  ),
  // Left eighths, ▉ (seven) down to ▏ (one).
  ...Array.from(
    { length: 7 },
    (_, i): [number, [number, number, number, number]] => [
      0x2589 + i,
      [0, DESCENT, ((7 - i) * WIDTH) / 8, ASCENT]
    ]
  ),
  [0x2580, [0, MIDDLE, WIDTH, ASCENT]], // ▀
  [0x2594, [0, ASCENT - EM / 8, WIDTH, ASCENT]], // ▔
  [0x2590, [WIDTH / 2, DESCENT, WIDTH, ASCENT]], // ▐
  [0x2595, [WIDTH - WIDTH / 8, DESCENT, WIDTH, ASCENT]], // ▕
  [0x25a0, [100, MIDDLE - 200, 500, MIDDLE + 200]] // ■
];

/** The font as WOFF bytes. */
export function terminalFont(): Uint8Array {
  const glyphs = [
    glyph('.notdef', undefined, () => undefined),
    glyph('space', 0x20, () => undefined),
    ...Array.from({ length: 256 }, (_, bits) => braille(bits)),
    // ┈ and ┊: the grid, dashed in four as the characters show.
    glyph('dashH', 0x2508, path => {
      for (let i = 0; i < 4; i++) {
        rect(
          path,
          i * 150 + 25,
          MIDDLE - LINE / 2,
          i * 150 + 125,
          MIDDLE + LINE / 2
        );
      }
    }),
    glyph('dashV', 0x250a, path => {
      for (let i = 0; i < 4; i++) {
        const top = ASCENT - i * 250 - 50;
        rect(path, WIDTH / 2 - LINE / 2, top - 150, WIDTH / 2 + LINE / 2, top);
      }
    }),
    // ┼ where grid lines cross: solid through the whole cell.
    glyph('cross', 0x253c, path => {
      horizontal(path);
      vertical(path);
    }),
    ...BLOCKS.map(([unicode, [x1, y1, x2, y2]]) =>
      glyph(`block${unicode.toString(16)}`, unicode, path =>
        rect(path, x1, y1, x2, y2)
      )
    )
  ];
  const font = new Font({
    familyName: 'Chartist Terminal',
    styleName: 'Regular',
    unitsPerEm: EM,
    ascender: ASCENT,
    descender: DESCENT,
    // Fixed, so every build writes the same bytes.
    createdTimestamp: 0,
    glyphs
  });
  return woff(new Uint8Array(font.toArrayBuffer()));
}

/** Wraps an OpenType font in WOFF 1.0, with each table compressed. */
export function woff(sfnt: Uint8Array): Uint8Array {
  const view = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength);
  const count = view.getUint16(4);
  const tables = Array.from({ length: count }, (_, i) => {
    const at = 12 + i * 16;
    const offset = view.getUint32(at + 8);
    const length = view.getUint32(at + 12);
    const data = sfnt.subarray(offset, offset + length);
    const compressed = deflateSync(data);
    return {
      tag: view.getUint32(at),
      checksum: view.getUint32(at + 4),
      length,
      data: compressed.length < length ? compressed : data
    };
  });
  const pad = (n: number) => (n + 3) & ~3;
  const header = 44 + 20 * count;
  const size = tables.reduce(
    (sum, table) => sum + pad(table.data.length),
    header
  );
  const out = new Uint8Array(size);
  const write = new DataView(out.buffer);
  write.setUint32(0, 0x774f4646); // 'wOFF'
  write.setUint32(4, view.getUint32(0)); // the font's flavor, e.g. 'OTTO'
  write.setUint32(8, size);
  write.setUint16(12, count);
  write.setUint32(
    16,
    tables.reduce((sum, table) => sum + pad(table.length), 12 + 16 * count)
  );
  write.setUint16(20, 1); // version 1.0
  let offset = header;
  tables.forEach((table, i) => {
    const at = 44 + i * 20;
    write.setUint32(at, table.tag);
    write.setUint32(at + 4, offset);
    write.setUint32(at + 8, table.data.length);
    write.setUint32(at + 12, table.length);
    write.setUint32(at + 16, table.checksum);
    out.set(table.data, offset);
    offset += pad(table.data.length);
  });
  return out;
}
