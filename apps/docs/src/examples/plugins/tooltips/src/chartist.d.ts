// Chartist's UMD builds, loaded as scripts in index.html, set the global
// `Chartist`: the library, chartist/compat, and the plugins that register
// on `Chartist.plugins`.
declare const Chartist: typeof import('chartist') &
  typeof import('chartist/compat') & {
    plugins: Record<string, (options?: unknown) => (chart: unknown) => void>;
  };
