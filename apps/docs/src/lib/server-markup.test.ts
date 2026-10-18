/**
 * Server markup in example pages: finding it between its comments and
 * writing it there. scripts/server-markup.ts uses these on the examples.
 */
import { describe, expect, test } from 'vitest';
import {
  SERVER_MARKUP_END,
  SERVER_MARKUP_START,
  hasServerMarkup,
  serverMarkupOf,
  withServerMarkup
} from './server-markup';

const page = (markup: string) => `<body>
    <div id="chart">
      ${SERVER_MARKUP_START}
      ${markup}
      ${SERVER_MARKUP_END}
    </div>
  </body>`;

describe('server markup in example pages', () => {
  test('reads the markup between the comments', () => {
    expect(hasServerMarkup(page('<svg/>'))).toBe(true);
    expect(serverMarkupOf(page('<svg/>'))).toBe('<svg/>');
    expect(hasServerMarkup('<body></body>')).toBe(false);
    expect(serverMarkupOf('<body></body>')).toBeUndefined();
  });

  test('writes new markup in place, indented like the start comment', () => {
    expect(withServerMarkup(page('<svg/>'), '<svg class="new"/>')).toBe(
      page('<svg class="new"/>')
    );
  });

  test('writes into empty comments', () => {
    const empty = `  ${SERVER_MARKUP_START}${SERVER_MARKUP_END}`;
    expect(withServerMarkup(empty, '<svg/>')).toBe(
      `  ${SERVER_MARKUP_START}\n  <svg/>\n  ${SERVER_MARKUP_END}`
    );
  });

  test('throws for a page without the comments', () => {
    expect(() => withServerMarkup('<body></body>', '<svg/>')).toThrow(
      'no "<!-- server markup'
    );
  });
});
