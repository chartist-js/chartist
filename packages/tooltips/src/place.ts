/** Where a tooltip goes, in px from the viewport's top left corner. */
export interface Placement {
  readonly x: number;
  readonly y: number;
  /** Above or below the anchor. */
  readonly side: 'top' | 'bottom';
}

/** Space kept between the tooltip and the viewport's edges, in px. */
export const EDGE = 8;

/**
 * Places a tooltip of `size` at `anchor`, in viewport coordinates: centered
 * above it at `offset` px, below it when the top doesn't fit, and moved
 * sideways to stay inside the viewport.
 */
export function place(
  anchor: { readonly x: number; readonly y: number },
  size: { readonly width: number; readonly height: number },
  viewport: { readonly width: number; readonly height: number },
  offset: number
): Placement {
  const above = anchor.y - offset - size.height;
  const fitsAbove = above >= EDGE;
  const fitsBelow = anchor.y + offset + size.height <= viewport.height - EDGE;
  const side = fitsAbove || !fitsBelow ? 'top' : 'bottom';
  const right = viewport.width - EDGE - size.width;
  const x = Math.max(EDGE, Math.min(anchor.x - size.width / 2, right));
  return {
    x,
    y: side === 'top' ? Math.max(EDGE, above) : anchor.y + offset,
    side
  };
}
