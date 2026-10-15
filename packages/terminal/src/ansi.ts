import { seriesColors, type SceneNode } from 'chartist';
import { trimLines, type Cell } from './canvas.ts';
import {
  colorCode,
  contrast,
  parseHex,
  type ColorMode,
  type Rgb
} from './color.ts';
import { drawScene } from './draw.ts';

/** Options of {@link renderToTerminal}. */
export interface TerminalRenderOptions {
  /** How colors are written; `none` writes plain text. */
  readonly color?: ColorMode;
  /**
   * Series colors as hex, by series letter (`a` first); Chartist's default
   * series colors otherwise. Series past the end start over.
   */
  readonly palette?: readonly string[];
}

const RESET = '\x1b[0m';

/**
 * Renders a scene as text for a terminal: lines, points and areas in
 * braille dots, bars in block characters, slices filled, the grid in dim
 * box-drawing characters, labels as text, all colored by series with ANSI
 * escape codes. Lay the scene out with {@link terminalSize}, so its px
 * map to cells.
 *
 * @example
 * ```ts
 * import { lineChartConfig, toScene } from 'chartist';
 * import { renderToTerminal, terminalSize } from '@chartist-js/terminal';
 *
 * const scene = toScene(
 *   lineChartConfig({ labels: ['Mon', 'Tue', 'Wed'], series: [[5, 2, 4]] }),
 *   terminalSize(60, 15)
 * );
 * console.log(renderToTerminal(scene, { color: '256' }));
 * ```
 * @experimental
 */
export function renderToTerminal(
  scene: SceneNode,
  options: TerminalRenderOptions = {}
): string {
  const mode = options.color ?? 'truecolor';
  const palette = paletteOf(options.palette);
  const lines = drawScene(scene)
    .cells()
    .map(row => {
      // Empty cells at the end of a row are left out.
      let last = row.length - 1;
      while (last >= 0 && !row[last]) {
        last--;
      }
      let line = '';
      let open = '';
      for (const cell of row.slice(0, last + 1)) {
        const style = mode === 'none' || !cell ? '' : sgr(cell, palette, mode);
        if (style !== open) {
          line += (open ? RESET : '') + style;
          open = style;
        }
        line += cell?.char ?? ' ';
      }
      return open ? line + RESET : line;
    });
  return trimLines(lines);
}

/** The palette as RGB colors. */
export function paletteOf(
  palette: readonly string[] = seriesColors
): readonly Rgb[] {
  if (!palette.length) {
    throw new Error('Chartist terminal: the palette needs at least one color.');
  }
  return palette.map(parseHex);
}

/** The color of a series, by its index; past the palette's end it starts over. */
export function colorOf(
  palette: readonly Rgb[],
  series: number | undefined
): Rgb | undefined {
  return series === undefined ? undefined : palette[series % palette.length];
}

function sgr(
  cell: Cell,
  palette: readonly Rgb[],
  mode: Exclude<ColorMode, 'none'>
): string {
  const { kind, series, background } = cell.ink;
  const behind = colorOf(palette, background);
  const codes: string[] = [];
  if (kind === 'label') {
    // On a colored cell: readable text on that color; else dim text.
    if (behind) {
      codes.push(
        colorCode(contrast(behind), mode, 38),
        colorCode(behind, mode, 48)
      );
    } else {
      codes.push('2');
    }
    return `\x1b[${codes.join(';')}m`;
  }
  if (kind === 'grid' || kind === 'area') {
    codes.push('2');
  }
  const color = colorOf(palette, series);
  if (color) {
    codes.push(colorCode(color, mode, 38));
  }
  if (behind) {
    codes.push(colorCode(behind, mode, 48));
  }
  return codes.length ? `\x1b[${codes.join(';')}m` : '';
}
