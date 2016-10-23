export function translate(load) {
  return `export const version = '${JSON.parse(load.source).version}'`;
}
