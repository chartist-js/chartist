/**
 * Renders the fixtures with the pinned Mermaid in Playwright's Chromium:
 * every class name `diagrams.css` styles must still be in Mermaid's output,
 * so a Mermaid update that renames one fails here. Run with
 * UPDATE_DIAGRAM_FIXTURES=1 to record Mermaid's SVGs for svg.test.ts.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
  browserLaunches,
  closeDiagramBrowser,
  diagramId,
  renderDiagram,
  renderMermaid
} from './render';

const root = new URL('../../../', import.meta.url);
const TYPES = ['flowchart', 'sequence', 'state'];
/** Classes in the stylesheet that aren't in the SVG: the figure's own. */
const SITE_CLASSES = new Set(['diagram']);

const rendered = new Map<string, string>();

beforeAll(async () => {
  for (const type of TYPES) {
    const source = await readFile(
      new URL(`fixtures/${type}.mmd`, import.meta.url),
      'utf8'
    );
    if (process.env.UPDATE_DIAGRAM_FIXTURES) {
      const svg = await renderMermaid(source, diagramId(source), root);
      await writeFile(new URL(`fixtures/${type}.svg`, import.meta.url), svg);
    }
    rendered.set(type, (await renderDiagram(source, { root })).svg);
  }
}, 60_000);

afterAll(closeDiagramBrowser);

it('renders every class name diagrams.css relies on', async () => {
  const css = await readFile(
    new URL('../../styles/diagrams.css', import.meta.url),
    'utf8'
  );
  const selectors = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{[^}]*\}/g, ',');
  const styled = new Set(
    [...selectors.matchAll(/\.([a-zA-Z][\w-]*)/g)]
      .map(([, name]) => name)
      .filter(name => !SITE_CLASSES.has(name))
  );
  const classes = new Set(
    [...rendered.values()].flatMap(svg =>
      [...svg.matchAll(/\sclass="([^"]*)"/g)].flatMap(([, list]) =>
        list.split(/\s+/)
      )
    )
  );
  expect([...styled].filter(name => !classes.has(name))).toEqual([]);
  // The activation bars, selected by prefix.
  expect([...classes].some(name => /^activation\d$/.test(name))).toBe(true);
});

it("fails on a syntax error with Mermaid's message", async () => {
  const source =
    'flowchart TD\n  accTitle: Broken\n  accDescr: A flow with a syntax error.\n  a --> [b';
  await expect(
    renderDiagram(source, { root, page: '/docs/broken/' })
  ).rejects.toThrow(
    /^The diagram "Broken" on \/docs\/broken\/: Mermaid can't render it: .*Parse error/s
  );
});

it('takes an unchanged diagram from the cache, without starting the browser', async () => {
  const source = await readFile(
    new URL('fixtures/flowchart.mmd', import.meta.url),
    'utf8'
  );
  await closeDiagramBrowser();
  const launches = browserLaunches();
  const { svg } = await renderDiagram(source, { root });
  expect(svg).toBe(rendered.get('flowchart'));
  expect(browserLaunches()).toBe(launches);
});
