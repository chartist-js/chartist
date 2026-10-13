/**
 * Live example projects in src/examples/<page>/<example>/ (index.html,
 * src/main.ts, optionally src/style.css), as LiveExample takes them. Real
 * files, not strings in MDX: formatted, linted and type-checked like code.
 */
const raw = import.meta.glob<string>('../examples/*/*/**/*', {
  query: '?raw',
  import: 'default',
  eager: true
});

/** The files of an example by id (`<page>/<example>`), keyed by path. */
export function exampleFiles(id: string): Record<string, string> {
  const prefix = `../examples/${id}/`;
  const files = Object.fromEntries(
    Object.entries(raw)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, source]) => [path.slice(prefix.length), source])
  );
  if (!files['src/main.ts']) {
    throw new Error(`No live example "${id}" (src/examples/${id}/src/main.ts)`);
  }
  return files;
}
