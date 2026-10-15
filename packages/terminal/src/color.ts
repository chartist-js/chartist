/** An RGB color, e.g. `[215, 2, 6]`. */
export type Rgb = readonly [number, number, number];

/**
 * How text output is colored: 24-bit colors, the 256-color palette, the
 * 16 standard colors, or none (plain text without escape codes).
 * @experimental
 */
export type ColorMode = 'truecolor' | '256' | '16' | 'none';

/** What {@link detectColorMode} reads from an output stream. */
export interface ColorStream {
  /** Whether the stream is a terminal, as `process.stdout.isTTY`. */
  readonly isTTY?: boolean;
}

/**
 * Picks the color mode for an output stream from environment variables,
 * the way most CLI tools do:
 *
 * - none when `NO_COLOR` is set, `TERM` is `dumb` or the stream isn't a
 *   terminal;
 * - `FORCE_COLOR` overrides that: `0` none, `1` 16 colors, `2` 256 colors,
 *   `3` 24-bit;
 * - otherwise 24-bit when `COLORTERM` is `truecolor` or `24bit`, else 256
 *   colors.
 *
 * It reads only what it's given, so it works outside Node.js too.
 *
 * @param stream The output, usually `process.stdout`
 * @param env The environment variables, usually `process.env`
 * @example
 * ```ts
 * import { detectColorMode, lineChart } from '@chartist-js/terminal';
 *
 * const color = detectColorMode(process.stdout, process.env);
 * console.log(lineChart({ series: [[1, 3, 2]] }, { color }));
 * ```
 * @experimental
 */
export function detectColorMode(
  stream: ColorStream,
  env: Readonly<Record<string, string | undefined>>
): ColorMode {
  const force = env.FORCE_COLOR;
  if (force !== undefined) {
    const level =
      force === '' || force === 'true'
        ? 1
        : force === 'false'
          ? 0
          : Number(force);
    if (level >= 0 && level <= 3) {
      return (['none', '16', '256', 'truecolor'] as const)[Math.floor(level)];
    }
  }
  if (env.NO_COLOR || env.TERM === 'dumb' || !stream.isTTY) {
    return 'none';
  }
  return /^(truecolor|24bit)$/i.test(env.COLORTERM ?? '') ? 'truecolor' : '256';
}

/** Parses `#rrggbb` or `#rgb`. */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3 ? [...value].map(char => char + char).join('') : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(
      `Chartist terminal: "${hex}" is not a hex color like #d70206.`
    );
  }
  const number = Number.parseInt(full, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

/** The nearest color of the 256-color palette's 6 × 6 × 6 cube. */
export function to256([r, g, b]: Rgb): number {
  const level = (value: number) =>
    value < 48
      ? 0
      : value < 115
        ? 1
        : Math.min(5, Math.floor((value - 35) / 40));
  return 16 + 36 * level(r) + 6 * level(g) + level(b);
}

/** The 16 standard colors as xterm draws them, by index. */
const STANDARD: readonly Rgb[] = [
  [0, 0, 0],
  [205, 0, 0],
  [0, 205, 0],
  [205, 205, 0],
  [0, 0, 238],
  [205, 0, 205],
  [0, 205, 205],
  [229, 229, 229],
  [127, 127, 127],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [92, 92, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255]
];

/** The index (0–15) of the nearest of the 16 standard colors. */
export function to16([r, g, b]: Rgb): number {
  let best = 0;
  let distance = Infinity;
  STANDARD.forEach(([sr, sg, sb], index) => {
    const d = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2;
    if (d < distance) {
      best = index;
      distance = d;
    }
  });
  return best;
}

/** Black or white, whichever reads better on `background`. */
export function contrast([r, g, b]: Rgb): Rgb {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? [0, 0, 0] : [255, 255, 255];
}

/** The SGR parameters for a foreground (`38`) or background (`48`) color. */
export function colorCode(
  color: Rgb,
  mode: Exclude<ColorMode, 'none'>,
  base: 38 | 48
): string {
  if (mode === 'truecolor') {
    return `${base};2;${color.join(';')}`;
  }
  if (mode === '256') {
    return `${base};5;${to256(color)}`;
  }
  const index = to16(color);
  const offset = base === 38 ? 30 : 40;
  return String(index < 8 ? offset + index : offset + 60 + index - 8);
}
