// Network speed samples, four per second, from a seeded generator, so every
// run measures the same speeds.

let seed = 11;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** How many samples the chart shows. */
export const SAMPLES = 60;

let sample = 0;
let speed = 80;
const measure = () => {
  // Wanders around 80 Mbit/s, with a dip now and then.
  speed += (80 - speed) * 0.2 + (random() - 0.5) * 30;
  if (random() < 0.04) {
    speed *= 0.3;
  }
  sample += 1;
  return { label: sample, mbps: Math.max(1, Math.round(speed)) };
};
let samples = Array.from({ length: SAMPLES }, measure);

/** The samples by number, as a speed series and its running average. */
const dataOf = () => {
  const speeds = samples.map(s => s.mbps);
  const average = speeds.map((_, i) => {
    const recent = speeds.slice(Math.max(0, i - 7), i + 1);
    return recent.reduce((sum, value) => sum + value, 0) / recent.length;
  });
  return {
    labels: samples.map(s => s.label),
    series: [
      { name: 'speed', data: speeds },
      { name: 'average', data: average }
    ]
  };
};

/** The last 60 samples. */
export const firstSamples = dataOf();

/** Calls `listener` with the last 60 samples, four times a second. */
export function onSample(listener: (data: typeof firstSamples) => void) {
  setInterval(() => {
    samples = [...samples.slice(1), measure()];
    listener(dataOf());
  }, 250);
}
