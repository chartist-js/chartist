// A seismometer's readings from a seeded generator, so every run records
// the same quakes.

let seed = 5;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const READINGS = 150;
let time = 0;
let quake = 0;
const read = () => {
  time += 1;
  // Now and then a quake starts, then fades out.
  if (quake < 0.05 && random() < 0.01) {
    quake = 3 + random() * 5;
  }
  quake *= 0.96;
  const value = Math.sin(time * 0.9) * quake + (random() - 0.5) * 0.6;
  return { label: time, value: Math.round(value * 100) / 100 };
};
let readings = Array.from({ length: READINGS }, read);

/** The readings by their time. */
const dataOf = () => ({
  labels: readings.map(reading => reading.label),
  series: [readings.map(reading => reading.value)]
});

/** The last 150 readings. */
export const firstReadings = dataOf();

/** Calls `listener` with the last 150 readings, two more every 80 ms. */
export function onReadings(listener: (data: typeof firstReadings) => void) {
  setInterval(() => {
    readings = [...readings.slice(2), read(), read()];
    listener(dataOf());
  }, 80);
}
