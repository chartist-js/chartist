// Numbers by region from a seeded generator, so every run shows the same.

let seed = 7;
const next = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const labels = ['North', 'East', 'South', 'West'];
const random = () => labels.map(() => Math.round(next() * 9) + 1);

/** Two series by region. */
export const firstNumbers = {
  labels,
  series: [
    [5, 4, 3, 7],
    [3, 2, 9, 5]
  ]
};

/** Calls `listener` with new numbers every two seconds. */
export function onNumbers(listener: (numbers: typeof firstNumbers) => void) {
  setInterval(() => listener({ labels, series: [random(), random()] }), 2000);
}
