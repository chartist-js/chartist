/**
 * A small WOFF2 decoder (https://www.w3.org/TR/WOFF2/): turns the site's
 * WOFF2 fonts into TrueType for the card images, since satori reads TTF,
 * OTF and WOFF only and the variable font packages ship WOFF2 alone.
 * Brotli comes from node:zlib. Handles the glyf/loca and hmtx transforms;
 * font collections aren't supported (no package ships one).
 */
import { brotliDecompressSync } from 'node:zlib';

const KNOWN_TAGS = [
  'cmap',
  'head',
  'hhea',
  'hmtx',
  'maxp',
  'name',
  'OS/2',
  'post',
  'cvt ',
  'fpgm',
  'glyf',
  'loca',
  'prep',
  'CFF ',
  'VORG',
  'EBDT',
  'EBLC',
  'gasp',
  'hdmx',
  'kern',
  'LTSH',
  'PCLT',
  'VDMX',
  'vhea',
  'vmtx',
  'BASE',
  'GDEF',
  'GPOS',
  'GSUB',
  'EBSC',
  'JSTF',
  'MATH',
  'CBDT',
  'CBLC',
  'COLR',
  'CPAL',
  'SVG ',
  'sbix',
  'acnt',
  'avar',
  'bdat',
  'bloc',
  'bsln',
  'cvar',
  'fdsc',
  'feat',
  'fmtx',
  'fvar',
  'gvar',
  'hsty',
  'just',
  'lcar',
  'mort',
  'morx',
  'opbd',
  'prop',
  'trak',
  'Zapf',
  'Silf',
  'Glat',
  'Gloc',
  'Feat',
  'Sill'
];

/** A forward-only reader over a byte range. */
class Reader {
  offset = 0;
  readonly bytes: Uint8Array;
  private view: DataView;
  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  u8() {
    return this.bytes[this.offset++];
  }
  u16() {
    const value = this.view.getUint16(this.offset);
    this.offset += 2;
    return value;
  }
  i16() {
    const value = this.view.getInt16(this.offset);
    this.offset += 2;
    return value;
  }
  u32() {
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }
  take(length: number) {
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }
  base128() {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = this.u8();
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) {
        return value;
      }
    }
    throw new Error('woff2: bad UIntBase128');
  }
  u255() {
    const code = this.u8();
    if (code === 253) {
      return this.u16();
    }
    if (code === 255) {
      return this.u8() + 253;
    }
    if (code === 254) {
      return this.u8() + 506;
    }
    return code;
  }
}

/** A growable big-endian byte writer. */
class Writer {
  private bytes = new Uint8Array(1024);
  length = 0;
  private ensure(extra: number) {
    if (this.length + extra > this.bytes.length) {
      const next = new Uint8Array(
        Math.max(this.bytes.length * 2, this.length + extra)
      );
      next.set(this.bytes);
      this.bytes = next;
    }
  }
  u8(value: number) {
    this.ensure(1);
    this.bytes[this.length++] = value & 0xff;
  }
  u16(value: number) {
    this.u8(value >> 8);
    this.u8(value);
  }
  u32(value: number) {
    this.u16(value >>> 16);
    this.u16(value);
  }
  write(data: Uint8Array) {
    this.ensure(data.length);
    this.bytes.set(data, this.length);
    this.length += data.length;
  }
  pad(to: number) {
    while (this.length % to) {
      this.u8(0);
    }
  }
  result() {
    return this.bytes.slice(0, this.length);
  }
}

interface Table {
  tag: string;
  version: number;
  origLength: number;
  length: number;
  data: Uint8Array;
}

const withSign = (flag: number, value: number) => (flag & 1 ? value : -value);

/** Rebuilds glyf and loca from the transformed glyf table. */
function decodeGlyf(data: Uint8Array) {
  const header = new Reader(data);
  header.u16(); // reserved
  const optionFlags = header.u16();
  const numGlyphs = header.u16();
  const indexFormat = header.u16();
  const sizes = Array.from({ length: 7 }, () => header.u32());
  const streams: Reader[] = [];
  let offset = header.offset;
  for (const size of sizes) {
    streams.push(new Reader(data.subarray(offset, offset + size)));
    offset += size;
  }
  const [
    nContourStream,
    nPointsStream,
    flagStream,
    glyphStream,
    compositeStream,
    bboxStream,
    instructionStream
  ] = streams;
  const overlap =
    optionFlags & 1
      ? data.subarray(offset, offset + ((numGlyphs + 7) >> 3))
      : undefined;
  const bboxBitmap = bboxStream.take(((numGlyphs + 31) >> 5) << 2);

  const glyf = new Writer();
  const offsets: number[] = [];
  const xMins: number[] = [];

  for (let glyph = 0; glyph < numGlyphs; glyph++) {
    offsets.push(glyf.length);
    const nContours = nContourStream.i16();
    const hasBbox = bboxBitmap[glyph >> 3] & (0x80 >> (glyph & 7));
    if (nContours === 0) {
      xMins.push(0);
      continue;
    }
    if (nContours === -1) {
      // Composite: bbox explicit, component records copied as they are.
      const bbox = [
        bboxStream.i16(),
        bboxStream.i16(),
        bboxStream.i16(),
        bboxStream.i16()
      ];
      const start = compositeStream.offset;
      let more = true;
      let instructions = false;
      while (more) {
        const flags = compositeStream.u16();
        compositeStream.u16(); // glyph index
        compositeStream.offset += flags & 0x0001 ? 4 : 2;
        if (flags & 0x0008) {
          compositeStream.offset += 2;
        } else if (flags & 0x0040) {
          compositeStream.offset += 4;
        } else if (flags & 0x0080) {
          compositeStream.offset += 8;
        }
        if (flags & 0x0100) {
          instructions = true;
        }
        more = (flags & 0x0020) !== 0;
      }
      const components = compositeStream.bytes.subarray(
        start,
        compositeStream.offset
      );
      glyf.u16(0xffff);
      bbox.forEach(value => glyf.u16(value));
      glyf.write(components);
      if (instructions) {
        const length = glyphStream.u255();
        glyf.u16(length);
        glyf.write(instructionStream.take(length));
      }
      xMins.push(bbox[0]);
      glyf.pad(4);
      continue;
    }
    // Simple glyph: points from the triplet encoding.
    const endPoints: number[] = [];
    let total = 0;
    for (let c = 0; c < nContours; c++) {
      total += nPointsStream.u255();
      endPoints.push(total - 1);
    }
    const xs: number[] = [];
    const ys: number[] = [];
    const onCurve: boolean[] = [];
    let x = 0;
    let y = 0;
    for (let p = 0; p < total; p++) {
      let flag = flagStream.u8();
      onCurve.push(!(flag >> 7));
      flag &= 0x7f;
      let dx: number;
      let dy: number;
      if (flag < 10) {
        dx = 0;
        dy = withSign(flag, ((flag & 14) << 7) + glyphStream.u8());
      } else if (flag < 20) {
        dx = withSign(flag, (((flag - 10) & 14) << 7) + glyphStream.u8());
        dy = 0;
      } else if (flag < 84) {
        const b0 = flag - 20;
        const b1 = glyphStream.u8();
        dx = withSign(flag, 1 + (b0 & 0x30) + (b1 >> 4));
        dy = withSign(flag >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f));
      } else if (flag < 120) {
        const b0 = flag - 84;
        dx = withSign(flag, 1 + (Math.floor(b0 / 12) << 8) + glyphStream.u8());
        dy = withSign(
          flag >> 1,
          1 + (((b0 % 12) >> 2) << 8) + glyphStream.u8()
        );
      } else if (flag < 124) {
        const b1 = glyphStream.u8();
        const b2 = glyphStream.u8();
        const b3 = glyphStream.u8();
        dx = withSign(flag, (b1 << 4) + (b2 >> 4));
        dy = withSign(flag >> 1, ((b2 & 0x0f) << 8) + b3);
      } else {
        const b1 = glyphStream.u8();
        const b2 = glyphStream.u8();
        const b3 = glyphStream.u8();
        const b4 = glyphStream.u8();
        dx = withSign(flag, (b1 << 8) + b2);
        dy = withSign(flag >> 1, (b3 << 8) + b4);
      }
      x += dx;
      y += dy;
      xs.push(x);
      ys.push(y);
    }
    const instructionLength = glyphStream.u255();
    const bbox = hasBbox
      ? [bboxStream.i16(), bboxStream.i16(), bboxStream.i16(), bboxStream.i16()]
      : [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    glyf.u16(nContours);
    bbox.forEach(value => glyf.u16(value));
    endPoints.forEach(value => glyf.u16(value));
    glyf.u16(instructionLength);
    glyf.write(instructionStream.take(instructionLength));
    const overlapFlag =
      overlap && overlap[glyph >> 3] & (0x80 >> (glyph & 7)) ? 0x40 : 0;
    onCurve.forEach((on, p) =>
      glyf.u8((on ? 1 : 0) | (p === 0 ? overlapFlag : 0))
    );
    xs.forEach((value, p) => glyf.u16(value - (p ? xs[p - 1] : 0)));
    ys.forEach((value, p) => glyf.u16(value - (p ? ys[p - 1] : 0)));
    xMins.push(bbox[0]);
    glyf.pad(4);
  }
  offsets.push(glyf.length);

  const loca = new Writer();
  for (const value of offsets) {
    if (indexFormat) {
      loca.u32(value);
    } else {
      loca.u16(value >> 1);
    }
  }
  return { glyf: glyf.result(), loca: loca.result(), xMins, numGlyphs };
}

/** Rebuilds hmtx from its transformed form (left side bearings from xMin). */
function decodeHmtx(
  data: Uint8Array,
  numHMetrics: number,
  numGlyphs: number,
  xMins: number[]
) {
  const reader = new Reader(data);
  const flags = reader.u8();
  const advances = Array.from({ length: numHMetrics }, () => reader.u16());
  const lsbs = Array.from({ length: numHMetrics }, (_, i) =>
    flags & 1 ? xMins[i] : reader.i16()
  );
  const rest = Array.from({ length: numGlyphs - numHMetrics }, (_, i) =>
    flags & 2 ? xMins[numHMetrics + i] : reader.i16()
  );
  const out = new Writer();
  advances.forEach((advance, i) => {
    out.u16(advance);
    out.u16(lsbs[i]);
  });
  rest.forEach(value => out.u16(value));
  return out.result();
}

function checksum(data: Uint8Array) {
  const padded = new Uint8Array((data.length + 3) & ~3);
  padded.set(data);
  const view = new DataView(padded.buffer);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) {
    sum = (sum + view.getUint32(i)) >>> 0;
  }
  return sum;
}

/**
 * Decodes a WOFF2 font into an sfnt (TrueType or CFF-flavored OpenType),
 * leaving out the tables in `omit`.
 */
export function woff2ToSfnt(
  input: Uint8Array,
  omit: string[] = []
): Uint8Array {
  const reader = new Reader(input);
  if (reader.u32() !== 0x774f4632) {
    throw new Error('woff2: not a WOFF2 file');
  }
  const flavor = reader.u32();
  if (flavor === 0x74746366) {
    throw new Error('woff2: font collections are not supported');
  }
  reader.u32(); // length
  const numTables = reader.u16();
  reader.u16(); // reserved
  reader.u32(); // totalSfntSize
  const compressedSize = reader.u32();
  reader.offset += 24; // versions, metadata and private block

  const tables: Table[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = reader.u8();
    const tag =
      (flags & 0x3f) === 63
        ? String.fromCharCode(...reader.take(4))
        : KNOWN_TAGS[flags & 0x3f];
    const version = flags >> 6;
    const origLength = reader.base128();
    const transformed =
      tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    const length = transformed ? reader.base128() : origLength;
    tables.push({ tag, version, origLength, length, data: new Uint8Array() });
  }
  const stream = new Uint8Array(
    brotliDecompressSync(
      input.subarray(reader.offset, reader.offset + compressedSize)
    )
  );
  let offset = 0;
  for (const table of tables) {
    table.data = stream.subarray(offset, offset + table.length);
    offset += table.length;
  }

  const byTag = new Map(tables.map(table => [table.tag, table]));
  const glyfTable = byTag.get('glyf');
  let xMins: number[] = [];
  let numGlyphs = 0;
  if (glyfTable && glyfTable.version === 0) {
    const decoded = decodeGlyf(glyfTable.data);
    glyfTable.data = decoded.glyf;
    byTag.get('loca')!.data = decoded.loca;
    xMins = decoded.xMins;
    numGlyphs = decoded.numGlyphs;
  }
  const hmtx = byTag.get('hmtx');
  if (hmtx && hmtx.version === 1) {
    const hhea = byTag.get('hhea')!.data;
    const numHMetrics = (hhea[34] << 8) | hhea[35];
    hmtx.data = decodeHmtx(hmtx.data, numHMetrics, numGlyphs, xMins);
  }

  // The sfnt: offset table, table records sorted by tag, then the tables.
  const sorted = tables
    .filter(table => !omit.includes(table.tag))
    .sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const out = new Writer();
  const entrySelector = Math.floor(Math.log2(sorted.length));
  const searchRange = 2 ** entrySelector * 16;
  out.u32(flavor);
  out.u16(sorted.length);
  out.u16(searchRange);
  out.u16(entrySelector);
  out.u16(sorted.length * 16 - searchRange);
  let tableOffset = 12 + sorted.length * 16;
  for (const table of sorted) {
    for (const char of table.tag) {
      out.u8(char.charCodeAt(0));
    }
    out.u32(checksum(table.data));
    out.u32(tableOffset);
    out.u32(table.data.length);
    tableOffset += (table.data.length + 3) & ~3;
  }
  for (const table of sorted) {
    out.write(table.data);
    out.pad(4);
  }
  return out.result();
}
