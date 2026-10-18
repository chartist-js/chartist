/**
 * Renders the docs' Mermaid diagrams to SVG while the site is built or
 * served. Mermaid lays text out with the browser's layout engine
 * (`getBBox()`, `getComputedTextLength()`), which Node doesn't have, so it
 * runs in Playwright's headless Chromium, the one the e2e tests use: one
 * page per process, opened for the first diagram that isn't cached, with
 * the site's fonts, tokens and `diagrams.css`, so text is measured as it's
 * shown. Mermaid's output is cached in `.cache/diagrams/`, keyed by the
 * source and everything that changes the layout, and post-processed
 * (`svg.ts`) on every render.
 *
 * Loads outside Astro (no `astro:*` imports): the component passes the
 * project's root, from which Playwright and Mermaid are resolved, since the
 * build's output folder can't resolve them.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import type { Browser, Page } from '@playwright/test';
// With its extension: the Astro config loads this module natively in Node.
import { processSvg, themeVariables, type DiagramSvg } from './svg.ts';

/** The command that installs the Chromium the renderer needs. */
export const INSTALL_COMMAND =
  'pnpm --dir apps/docs exec playwright install chromium';

/**
 * The text Mermaid measures with where it doesn't read the page's CSS
 * (sequence diagrams measure with these settings): the same as the text in
 * `diagrams.css`.
 */
const FONT_FAMILY = "'Atkinson Hyperlegible Next Variable', sans-serif";
const FONT_SIZE = 15;

/** The error when Playwright's Chromium doesn't start, usually since it isn't installed. */
export const chromiumError = (message: string): Error =>
  new Error(
    `Diagrams render in Playwright's Chromium, which didn't start. Install it once with \`${INSTALL_COMMAND}\`.\n${message}`
  );

/** Mermaid's configuration for every diagram. */
export const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'base',
  look: 'classic',
  // Labels as SVG text: HTML labels need foreignObject and inline styles.
  htmlLabels: false,
  securityLevel: 'strict',
  deterministicIds: true,
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE,
  themeVariables: {
    ...themeVariables(),
    fontFamily: FONT_FAMILY,
    fontSize: `${FONT_SIZE}px`
  },
  flowchart: {
    wrappingWidth: 240,
    padding: 16,
    nodeSpacing: 40,
    rankSpacing: 44
  },
  sequence: {
    height: 48,
    actorFontFamily: FONT_FAMILY,
    actorFontSize: FONT_SIZE,
    actorFontWeight: 700,
    noteFontFamily: FONT_FAMILY,
    noteFontSize: FONT_SIZE,
    messageFontFamily: FONT_FAMILY,
    messageFontSize: FONT_SIZE
  },
  state: { padding: 12 }
} as const;

/** The site's stylesheets the render page loads, from the project root. */
const STYLESHEETS = ['src/styles/tokens.css', 'src/styles/diagrams.css'];

/** The site's fonts (as `BaseLayout.astro` loads them), without the italics. */
const FONT_STYLESHEETS = [
  '@fontsource/zilla-slab/500.css',
  '@fontsource/zilla-slab/600.css',
  '@fontsource/zilla-slab/700.css',
  '@fontsource-variable/atkinson-hyperlegible-next/wght.css',
  '@fontsource-variable/jetbrains-mono/wght.css'
];

/** Where and for whom a diagram is rendered. */
export interface RenderOptions {
  /** The docs project's root (`apps/docs/`), as Astro's `root`. */
  readonly root: URL;
  /** The page that shows the diagram, for error messages. */
  readonly page?: string;
}

/** A rendered diagram: the SVG, its size, and the id it was rendered with. */
export interface Diagram extends DiagramSvg {
  readonly id: string;
  readonly title: string;
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

/** The diagram's id: from its source, so ids differ between diagrams. */
export const diagramId = (source: string): string =>
  `diagram-${hash(source).slice(0, 10)}`;

/** The source's `accTitle`, or undefined. */
export const accessibleTitle = (source: string): string | undefined =>
  /^\s*accTitle\s*:\s*(.+?)\s*$/m.exec(source)?.[1];

const hasDescription = (source: string) =>
  /^\s*accDescr\s*(:\s*\S|\{)/m.test(source);

/** How an error names the diagram: its title, or its first line. */
const describe = (source: string, page: string | undefined) => {
  const title = accessibleTitle(source);
  const name = title
    ? `"${title}"`
    : `starting "${source.trim().split('\n')[0]}"`;
  return `The diagram ${name}${page ? ` on ${page}` : ''}`;
};

/** An error that names the diagram and the page, for the build's output. */
export const diagramError = (
  source: string,
  page: string | undefined,
  problem: string
): Error => new Error(`${describe(source, page)}: ${problem}`);

/** Fails when the source has no accessible title or description. */
export const checkSource = (source: string, page?: string): void => {
  if (!accessibleTitle(source)) {
    throw diagramError(
      source,
      page,
      'it has no accTitle. Give every diagram a title and a description (accTitle, accDescr).'
    );
  }
  if (!hasDescription(source)) {
    throw diagramError(
      source,
      page,
      'it has no accDescr. Give every diagram a title and a description (accTitle, accDescr).'
    );
  }
};

/** The page's CSS and what the cache key depends on, read once per process. */
interface Setup {
  readonly require: NodeJS.Require;
  readonly mermaidVersion: string;
  readonly css: string;
  readonly fontCss: string;
  readonly cacheDir: URL;
}

/** Everything that changes Mermaid's output, besides the source. */
export const cacheKey = (
  source: string,
  settings: {
    readonly mermaidVersion: string;
    readonly css: string;
    readonly fontCss: string;
  }
): string =>
  hash(
    JSON.stringify({
      source,
      mermaid: settings.mermaidVersion,
      config: MERMAID_CONFIG,
      css: hash(settings.css),
      fonts: hash(settings.fontCss)
    })
  );

const toDataUrls = async (css: string, base: string) => {
  const urls = [
    ...new Set([...css.matchAll(/url\(\.\/([^)]+)\)/g)].map(([, file]) => file))
  ];
  let result = css;
  for (const file of urls) {
    const data = await readFile(`${base}/${file}`);
    const type = file.endsWith('.woff2') ? 'font/woff2' : 'font/woff';
    result = result.replaceAll(
      `url(./${file})`,
      `url(data:${type};base64,${data.toString('base64')})`
    );
  }
  return result;
};

/** Per-process state, on globalThis: Astro's integration and the build's page chunks load this module separately. */
interface State {
  setup?: Promise<Setup>;
  page?: Promise<Page>;
  browser?: Browser;
  queue: Promise<unknown>;
  launches: number;
}

const STATE = Symbol.for('chartist.docs.diagrams');
const state = (): State =>
  ((globalThis as Record<symbol, State>)[STATE] ??= {
    queue: Promise.resolve(),
    launches: 0
  });

const loadSetup = async (root: URL): Promise<Setup> => {
  const require = createRequire(new URL('package.json', root));
  const mermaidVersion = (
    require('mermaid/package.json') as { version: string }
  ).version;
  const css = (
    await Promise.all(
      STYLESHEETS.map(file => readFile(new URL(file, root), 'utf8'))
    )
  ).join('\n');
  const fontCss = (
    await Promise.all(
      FONT_STYLESHEETS.map(async file => {
        const path = require.resolve(file);
        return toDataUrls(await readFile(path, 'utf8'), dirname(path));
      })
    )
  ).join('\n');
  return {
    require,
    mermaidVersion,
    css,
    fontCss,
    cacheDir: new URL('.cache/diagrams/', root)
  };
};

const launch = async (setup: Setup): Promise<Page> => {
  const { chromium } = setup.require(
    '@playwright/test'
  ) as typeof import('@playwright/test');
  let browser: Browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    throw chromiumError((error as Error).message);
  }
  state().browser = browser;
  state().launches += 1;
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${setup.fontCss}</style><style>${setup.css}</style></head>` +
      '<body><figure class="diagram"><div id="diagram-container"></div></figure></body></html>'
  );
  await page.addScriptTag({
    path: setup.require.resolve('mermaid/dist/mermaid.min.js')
  });
  await page.evaluate(async config => {
    // Load every face before Mermaid measures text with them.
    await Promise.all([...document.fonts].map(font => font.load()));
    (
      window as unknown as {
        mermaid: { initialize: (config: unknown) => void };
      }
    ).mermaid.initialize(config);
  }, MERMAID_CONFIG);
  return page;
};

/** Renders with Mermaid in the browser page; returns Mermaid's SVG or throws its error. */
const renderInBrowser = async (
  setup: Setup,
  id: string,
  source: string
): Promise<string> => {
  const current = state();
  current.page ??= launch(setup);
  const page = await current.page;
  const result = await page.evaluate(
    async request => {
      const container = document.getElementById('diagram-container');
      if (!container) {
        return { error: 'the render page has no container.' };
      }
      const { mermaid } = window as unknown as {
        mermaid: {
          render: (
            id: string,
            text: string,
            element: Element
          ) => Promise<{ svg: string }>;
        };
      };
      try {
        return {
          svg: (await mermaid.render(request.id, request.source, container)).svg
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error)
        };
      } finally {
        container.replaceChildren();
        document.getElementById(`d${request.id}`)?.remove();
      }
    },
    { id, source }
  );
  if ('error' in result) {
    throw new Error(`Mermaid can't render it: ${result.error}`);
  }
  return result.svg;
};

/** Mermaid's SVG for a source, from the cache or the browser. */
const mermaidSvg = async (
  setup: Setup,
  id: string,
  source: string
): Promise<string> => {
  const file = new URL(`${cacheKey(source, setup)}.svg`, setup.cacheDir);
  try {
    return await readFile(file, 'utf8');
  } catch {
    // Not cached yet.
  }
  // One diagram at a time: Mermaid renders into one page.
  const current = state();
  const rendered = current.queue.then(() => renderInBrowser(setup, id, source));
  current.queue = rendered.catch(() => undefined);
  const svg = await rendered;
  await mkdir(setup.cacheDir, { recursive: true });
  await writeFile(file, svg);
  return svg;
};

const setupFor = (root: URL) => (state().setup ??= loadSetup(root));

/**
 * Mermaid's own SVG for a source, before the post-processing: from the
 * cache, or rendered with `id`.
 */
export const renderMermaid = async (
  source: string,
  id: string,
  root: URL
): Promise<string> => mermaidSvg(await setupFor(root), id, source);

/**
 * Renders a diagram source to the site's SVG. Throws an error naming the
 * diagram, the page and the problem: a syntax error, a missing `accTitle`
 * or `accDescr`, or a color without a token.
 */
export const renderDiagram = async (
  source: string,
  { root, page }: RenderOptions
): Promise<Diagram> => {
  checkSource(source, page);
  const id = diagramId(source);
  try {
    const svg = await renderMermaid(source, id, root);
    return { id, title: accessibleTitle(source) ?? '', ...processSvg(svg, id) };
  } catch (error) {
    throw diagramError(source, page, (error as Error).message);
  }
};

/** How many times this process started the browser (for tests of the cache). */
export const browserLaunches = (): number => state().launches;

/** Closes the browser, if one was started: when the build ends or the dev server stops. */
export const closeDiagramBrowser = async (): Promise<void> => {
  const current = state();
  const { page } = current;
  current.page = undefined;
  await page?.catch(() => undefined);
  const { browser } = current;
  current.browser = undefined;
  await browser?.close();
};
