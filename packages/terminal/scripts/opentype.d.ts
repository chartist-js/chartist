// The parts of opentype.js the font build uses; the package ships no types.
declare module 'opentype.js' {
  export class Path {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number
    ): void;
    close(): void;
  }
  export class Glyph {
    constructor(options: {
      name: string;
      unicode?: number;
      advanceWidth: number;
      path: Path;
    });
  }
  export class Font {
    constructor(options: {
      familyName: string;
      styleName: string;
      unitsPerEm: number;
      ascender: number;
      descender: number;
      createdTimestamp?: number;
      glyphs: Glyph[];
    });
    toArrayBuffer(): ArrayBuffer;
  }
  const opentype: { Font: typeof Font; Glyph: typeof Glyph; Path: typeof Path };
  export default opentype;
}
