/**
 * Server markup in example pages: the HTML between two comments, which a
 * script writes from the example's own `serverMarkup()` (see
 * scripts/server-markup.ts), so the markup a chart takes over is what the
 * current build renders.
 */

/** The comment before the markup, with the command that writes it. */
export const SERVER_MARKUP_START =
  '<!-- server markup, written by: pnpm nx run docs:server-markup --write -->';
/** The comment after the markup. */
export const SERVER_MARKUP_END = '<!-- end of server markup -->';

const between = (html: string) => {
  const start = html.indexOf(SERVER_MARKUP_START);
  const end = html.indexOf(SERVER_MARKUP_END);
  return start < 0 || end < start
    ? undefined
    : { from: start + SERVER_MARKUP_START.length, to: end };
};

/** Whether an example page has a place for server markup. */
export const hasServerMarkup = (html: string) => between(html) !== undefined;

/** The server markup in an example page, without the indentation around it. */
export function serverMarkupOf(html: string): string | undefined {
  const range = between(html);
  return range && html.slice(range.from, range.to).trim();
}

/**
 * The page with `markup` between the comments, on its own line and indented
 * like the start comment.
 */
export function withServerMarkup(html: string, markup: string): string {
  const range = between(html);
  if (!range) {
    throw new Error(
      `The page has no "${SERVER_MARKUP_START}" … "${SERVER_MARKUP_END}" comments`
    );
  }
  const lineStart = html.lastIndexOf('\n', range.from) + 1;
  const indent = /^[ \t]*/.exec(html.slice(lineStart))![0];
  return `${html.slice(0, range.from)}\n${indent}${markup}\n${indent}${html.slice(range.to)}`;
}
