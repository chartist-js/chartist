// A temperature sensor that reports every second. The readings come from
// a seeded generator, so every run shows the same ones.

let seed = 42;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

let data = {
  labels: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s'],
  series: [[21.2, 21.4, 21.3, 21.7, 21.9, 21.8, 22.1, 22, 22.3, 22.2]]
};

/** The last ten readings. */
export const firstReadings = data;

/** Calls `listener` every second with the last ten readings. */
export function onReading(listener: (readings: typeof data) => void) {
  let second = 10;
  setInterval(() => {
    second += 1;
    const [values] = data.series;
    const next = values[values.length - 1] + random() - 0.5;
    const reading = Math.round(Math.min(23.5, Math.max(20.5, next)) * 10) / 10;
    // Drop the oldest reading and add the new one.
    data = {
      labels: [...data.labels.slice(1), `${second}s`],
      series: [[...values.slice(1), reading]]
    };
    listener(data);
  }, 1000);
}
