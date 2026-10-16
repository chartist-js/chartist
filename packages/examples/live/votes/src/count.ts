// The results of the districts as they report, from a seeded generator, so
// every run counts the same votes.

let seed = 3;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** The parties, in the order of the slices. */
export const parties = ['Greens', 'Blues', 'Reds', 'Yellows'];

/** A district's votes by party: each district has a mood of its own. */
const district = () => parties.map(() => Math.round(50 + random() * 450));

/** The first district's votes. */
export const firstCount = district();

/** Calls `listener` with the next district's votes every 1.5 seconds. */
export function onCount(listener: (votes: number[]) => void) {
  setInterval(() => listener(district()), 1500);
}
