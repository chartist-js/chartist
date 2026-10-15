import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

// The built stylesheet; `test` depends on `build`.
const css = readFileSync(
  new URL('../dist/styles.css', import.meta.url),
  'utf8'
);

interface ParsedFont {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  charToGlyph(char: string): {
    unicode?: number;
    advanceWidth: number;
    path: { commands: { type: string }[] };
  };
}
const parse = (
  opentype as unknown as { parse(buffer: ArrayBuffer): ParsedFont }
).parse;

/** The font embedded in the stylesheet. */
function embeddedFont(): ParsedFont {
  const data = /url\(data:font\/woff;base64,([^)]+)\)/.exec(css)?.[1];
  expect(data).toBeDefined();
  const bytes = Buffer.from(data ?? '', 'base64');
  return parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  );
}

/** Every character the renderer draws besides text. */
const GRAPHIC = [
  ...Array.from({ length: 256 }, (_, bits) =>
    String.fromCharCode(0x2800 + bits)
  ),
  '┈',
  '┊',
  '┼',
  ...' ▁▂▃▄▅▆▇█'.slice(1),
  ...' ▏▎▍▌▋▊▉'.slice(1),
  '▀',
  '▔',
  '▐',
  '▕',
  '■'
];

describe('dist/styles.css', () => {
  it('embeds the Chartist Terminal font', () => {
    expect(css).toMatch(/@font-face \{\s*font-family: 'Chartist Terminal';/);
  });

  it('has a glyph for every character the renderer draws, one cell wide', () => {
    const font = embeddedFont();
    for (const char of GRAPHIC) {
      const glyph = font.charToGlyph(char);
      expect(glyph.unicode, char).toBe(char.codePointAt(0));
      expect(glyph.advanceWidth, char).toBe(600);
    }
  });

  it('fills a cell of 1 em: 0.8 above the baseline, 0.2 below', () => {
    const font = embeddedFont();
    expect([font.unitsPerEm, font.ascender, font.descender]).toEqual([
      1000, 800, -200
    ]);
  });

  it('draws a dot for each bit of a braille pattern', () => {
    const font = embeddedFont();
    const contours = (char: string) =>
      font
        .charToGlyph(char)
        .path.commands.filter(command => command.type === 'M').length;
    expect(contours('⠀')).toBe(0);
    expect(contours('⠁')).toBe(1);
    expect(contours('⣿')).toBe(8);
  });
});
