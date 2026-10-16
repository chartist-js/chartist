// Sales by month in three series, from a seeded generator, so every run
// shows the same numbers.

let seed = 21;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const series = () => months.map(() => Math.round(2 + random() * 8));

/** New sales numbers for every month, in three series. */
export const salesData = () => ({
  labels: months,
  series: [series(), series(), series()]
});
