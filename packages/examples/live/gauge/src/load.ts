// A CPU's load in percent from a seeded generator, so every run shows the
// same load.

let seed = 75386;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** The load when the chart starts. */
export const firstLoad = 35;

/** Calls `listener` with the load every 1.2 seconds. */
export function onLoad(listener: (load: number) => void) {
  // Busy, then idle, then busy again: anywhere from 10% to 95%.
  setInterval(() => listener(Math.round(10 + random() * 85)), 1200);
}
