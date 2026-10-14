// Importing chartist/compat sets up the global `Chartist`; plugin scripts
// register on its `plugins`.
declare const Chartist: {
  plugins: Record<string, (options?: unknown) => import('chartist').Plugin>;
};
