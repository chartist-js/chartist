/**
 * Make block definition method skipable.
 * @param fn - Jest's block definition method.
 * @param skip - Skip test block.
 * @returns Skipable block definition methid.
 */
export function skipable(fn, skip) {
  return skip ? fn.skip : fn;
}
