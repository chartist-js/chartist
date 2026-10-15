/**
 * Full-circle slices: 1.x draws one arc from 359.99° back to the start,
 * whose centre moves once its endpoints are rounded (#1302). v2 draws two
 * half circles through the start and the opposite point. Both are written
 * here as `full(<start>,<radius>)`, followed by the pie's `L<centre>Z`, so
 * the parity tests still compare the start, the radius and the centre.
 */
const N = '-?\\d+(?:\\.\\d+)?';
const ONE_ARC = new RegExp(
  `d="M(${N}),(${N})A(${N}),${N},0,1,0,((${N}),(${N}))`,
  'g'
);
const TWO_ARCS = new RegExp(
  `d="M(${N},${N})A(${N}),${N},0,0,0,${N},${N}A${N},${N},0,0,0,\\1`,
  'g'
);

/**
 * Whether a slice fills the circle by itself: one non-zero value, at least
 * the total. 1.x also clamps a slice that only reaches round with its
 * overlap of the previous slice (`[0.001, 2]`); v2 draws that one as 1.x.
 */
export function hasFullSlice(
  data: { readonly series: readonly unknown[] },
  options?: { readonly total?: number }
) {
  const values = data.series.map(value =>
    Number(
      typeof value === 'object' && value !== null && 'value' in value
        ? value.value
        : value
    )
  );
  const nonZero = values.filter(value => value !== 0);
  return (
    nonZero.length === 1 && (!options?.total || nonZero[0] >= options.total)
  );
}

/** 1.x markup with full circles in the shared form. */
export function fullCircles1x(markup: string, full: boolean) {
  if (!full) {
    return markup;
  }
  return markup.replace(
    ONE_ARC,
    (match, x1: string, y1: string, radius: string, start: string, x2, y2) =>
      // A large arc that ends where it starts (0.01° away) is a full circle.
      Math.hypot(Number(x1) - Number(x2), Number(y1) - Number(y2)) < 0.1
        ? `d="full(${start},${radius})`
        : match
  );
}

/** v2 markup with full circles in the shared form. */
export function fullCirclesV2(markup: string) {
  return markup.replace(
    TWO_ARCS,
    (_match, start: string, radius: string) => `d="full(${start},${radius})`
  );
}
