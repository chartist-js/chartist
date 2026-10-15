/**
 * Markdown versions of the docs for language models and for pasting into a
 * chat: the guides from their MDX, the API
 * reference from the TypeDoc model, the examples from their files, and
 * `llms.txt` / `llms-full.txt` from all of them. Install text follows the
 * prerelease state, as on the pages (`rewriteInstallText`).
 */
import type { JSONOutput as J } from 'typedoc';
import {
  KIND,
  apiPath,
  blocksOf,
  commentOf,
  declarationHead,
  entryMembers,
  exampleCode,
  listsMembers,
  membersOf,
  pageOf,
  partHref,
  signatureTokens,
  packageApiEntries,
  sortedEntries,
  tagsOf,
  typeTokens,
  memberTypeTokens,
  type ApiEntry,
  type Token
} from './api';
import { defaultFor, hasDefaults } from './api-defaults';
import { API_PAGES } from './api-pages';
import {
  navPages,
  packageEntries,
  packagePagePath,
  packagePageParam,
  type DocEntry
} from './docs';
import { exampleFiles } from './examples';
import { TYPES, gallery, type GalleryExample } from './gallery';
import { PACKAGES, packageBySlug } from '../data/packages';
import { pluginFacts, type Plugin } from '../data/plugins';
import { npmUrl, pluginSlug, setupSnippet, sortedPlugins } from './plugins';
import { rewriteInstallText } from './release';
import { VERSIONS, href } from './site';

/** An absolute URL for a site path, so links work outside the page too. */
export function absolute(path: string): string {
  return new URL(path.startsWith('/') ? path : href(path), import.meta.env.SITE)
    .href;
}

/** The Markdown version of a page path (`docs/x/` → `docs/x.md`). */
export const markdownPath = (path: string) => `${path.replace(/\/$/, '')}.md`;

const fence = (code: string, lang: string) => {
  // A fence longer than any backtick run inside the code.
  const ticks = '`'.repeat(
    Math.max(3, ...[...code.matchAll(/`+/g)].map(m => m[0].length + 1))
  );
  return `${ticks}${lang}\n${code.replace(/\n+$/, '')}\n${ticks}`;
};

const langOf = (file: string) => file.split('.').pop() ?? '';

// Guides ------------------------------------------------------------------

/** Turns a site-relative link in a guide (`../line-charts/`) absolute. */
function absoluteLinks(markdown: string, pagePath: string): string {
  const base = absolute(pagePath);
  return markdown.replace(
    /\]\((?!https?:|mailto:|#)([^)\s]+)\)/g,
    (_, link: string) => `](${new URL(link, base).href})`
  );
}

/** The value of a string prop: `name='x'` or `name="x"`. */
const prop = (tag: string, name: string) =>
  new RegExp(`\\b${name}=(['"])(.*?)\\1`, 's').exec(tag)?.[2];

/** A live example as its files: the shown file first, then the rest. */
function liveExample(tag: string): string {
  const id = prop(tag, 'example');
  const title = prop(tag, 'title');
  if (!id) {
    return '';
  }
  const files = exampleFiles(id);
  const shown = prop(tag, 'show') ?? 'src/main.ts';
  const order = [
    shown,
    ...Object.keys(files).filter(
      file => file !== shown && file !== 'index.html'
    ),
    'index.html'
  ];
  const parts = order
    .filter((file, i) => files[file] !== undefined && order.indexOf(file) === i)
    .map(file => `\`${file}\`:\n\n${fence(files[file], langOf(file))}`);
  return [
    `**${title ?? 'Live example'}** (runs in the browser):`,
    ...parts
  ].join('\n\n');
}

/**
 * A guide's MDX as Markdown: component imports and data exports dropped,
 * `LiveExample` replaced by its files, `Callout` as a blockquote, `Step`
 * unwrapped. Code blocks stay as they are.
 */
export function guideMarkdown(
  entry: Pick<DocEntry, 'body'> & {
    readonly data: { readonly title: string; readonly description: string };
  },
  path: string
): string {
  const lines = (entry.body ?? '').split('\n');
  const out: string[] = [];
  let inFence = false;
  let fenceMark = '';
  let skipDepth = 0;
  let tag: string[] | undefined;
  let callout: string[] | undefined;
  for (const line of lines) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch && (!inFence || line.trim().startsWith(fenceMark))) {
      if (!inFence) {
        fenceMark = fenceMatch[1];
      }
      inFence = !inFence;
      (callout ?? out).push(callout ? line.trim() : line);
      continue;
    }
    if (inFence) {
      (callout ?? out).push(callout ? line.replace(/^ {2}/, '') : line);
      continue;
    }
    // `export const x = { … };` blocks: skip to their end by brace depth.
    if (skipDepth > 0 || line.startsWith('export const ')) {
      skipDepth +=
        (line.match(/[[{(]/g)?.length ?? 0) -
        (line.match(/[\]})]/g)?.length ?? 0);
      if (skipDepth <= 0) {
        skipDepth = 0;
      }
      continue;
    }
    if (/^import .* from ['"]\.\.?\//.test(line)) {
      continue;
    }
    // A component tag, possibly over several lines.
    if (tag || /^<LiveExample\b/.test(line)) {
      tag = [...(tag ?? []), line];
      if (/\/>\s*$/.test(line)) {
        out.push(liveExample(tag.join('\n')));
        tag = undefined;
      }
      continue;
    }
    if (/^<\/?Step\b[^>]*>\s*$/.test(line)) {
      continue;
    }
    if (/^<Callout\b[^>]*>\s*$/.test(line)) {
      callout = [];
      continue;
    }
    if (callout && /^<\/Callout>\s*$/.test(line)) {
      out.push(
        callout
          .map(text => (text.trim() ? `> ${text.replace(/^ {2}/, '')}` : '>'))
          .join('\n')
      );
      callout = undefined;
      continue;
    }
    (callout ?? out).push(line);
  }
  const body = out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const head = `# ${entry.data.title}\n\n> ${entry.data.description}`;
  return rewriteInstallText(`${absoluteLinks(`${head}\n\n${body}`, path)}\n`);
}

// API reference -------------------------------------------------------------

const text = (tokens: Token[]) => tokens.map(token => token.text).join('');

/** Comment parts as Markdown, with {@link} links made absolute. */
function partsMarkdown(parts: J.CommentDisplayPart[]): string {
  return blocksOf(parts)
    .map(block => {
      const inline = (items: J.CommentDisplayPart[]) =>
        items
          .map(part => {
            if (part.kind === 'inline-tag') {
              const link = partHref(part);
              const label = `\`${part.text.trim() || String(part.target)}\``;
              return link ? `[${label}](${absolute(link)})` : label;
            }
            return part.text;
          })
          .join('');
      return block.kind === 'list'
        ? block.items.map(item => `- ${inline(item)}`).join('\n')
        : inline(block.items[0]);
    })
    .join('\n\n');
}

function entryMarkdown(entry: ApiEntry): string {
  const reflection = entry.reflection;
  const page = pageOf(entry.page);
  const isFunction = reflection.kind === KIND.Function;
  const signatures = isFunction ? (reflection.signatures ?? []) : [];
  const comment = commentOf(isFunction ? signatures[0] : reflection);
  const out = [`## ${entry.name}`];
  const badges = [
    comment?.modifiers.includes('@experimental') && 'experimental',
    page?.legacy && '1.x',
    entry.module === 'chartist/compat' && 'from `chartist/compat`'
  ].filter(Boolean);
  if (badges.length) {
    out.push(`*${badges.join(' · ')}*`);
  }
  const code = signatures.length
    ? signatures
        .map(signature => text(signatureTokens(entry.name, signature)))
        .join('\n')
    : text(declarationHead(entry));
  out.push(fence(code, 'ts'));
  if (comment?.summary.length) {
    out.push(partsMarkdown(comment.summary));
  }
  if (page?.compact) {
    return out.join('\n\n');
  }
  const parameters = signatures[0]?.parameters ?? [];
  if (parameters.length) {
    out.push(
      `Parameters:\n\n${parameters
        .map(parameter => {
          const description = parameter.comment
            ? ` ${partsMarkdown(parameter.comment.summary).replace(/\n+/g, ' ')}`
            : '';
          return `- \`${parameter.name}${parameter.flags.isOptional || parameter.defaultValue ? '?' : ''}: ${text(typeTokens(parameter.type))}\`${description}`;
        })
        .join('\n')}`
    );
  }
  for (const tag of tagsOf(comment, '@returns')) {
    out.push(`Returns: ${partsMarkdown(tag.content)}`);
  }
  if (listsMembers(entry)) {
    const members = entryMembers(entry);
    const line = (
      name: string,
      member: (typeof members)[number],
      value: string | undefined,
      indent = ''
    ) => {
      const own = commentOf(member.signature ?? member.reflection);
      const description = own
        ? ` ${partsMarkdown(own.summary).replace(/\n+/g, ' ')}`
        : '';
      const defaults = value ? ` Default: \`${value}\`.` : '';
      return `${indent}- \`${name}${member.optional ? '?' : ''}: ${text(memberTypeTokens(member, true))}\`${description}${defaults}`;
    };
    if (members.length) {
      out.push(
        `${reflection.kind === KIND.Class ? 'Members' : 'Properties'}:\n\n${members
          .flatMap(member => {
            const nested = hasDefaults(entry.name)
              ? (membersOf(member.type) ?? [])
              : [];
            return [
              line(
                member.name,
                member,
                defaultFor(entry.name, member.name, nested.length > 0)
              ),
              ...nested.map(child =>
                line(
                  `${member.name}.${child.name}`,
                  child,
                  defaultFor(entry.name, `${member.name}.${child.name}`),
                  '  '
                )
              )
            ];
          })
          .join('\n')}`
      );
    }
  }
  if (reflection.kind === KIND.Namespace) {
    out.push(
      (reflection.children ?? [])
        .map(child => {
          const signature = child.signatures?.[0];
          const own = commentOf(signature ?? child);
          const head = signature
            ? `\`${text(signatureTokens(child.name, signature, 'method'))}\``
            : `\`${child.name}\``;
          return `- ${head}${own ? ` ${partsMarkdown(own.summary).replace(/\n+/g, ' ')}` : ''}`;
        })
        .join('\n')
    );
  }
  for (const tag of tagsOf(comment, '@example')) {
    const example = exampleCode(tag);
    out.push(fence(example.code, example.lang));
  }
  const see = tagsOf(comment, '@see');
  if (see.length) {
    out.push(
      `See also: ${see.map(tag => partsMarkdown(tag.content)).join(' · ')}`
    );
  }
  return out.join('\n\n');
}

/** An API page as Markdown: its description and every entry. */
export function apiMarkdown(slug: string): string {
  const page = pageOf(slug);
  if (!page) {
    throw new Error(`No API page "${slug}"`);
  }
  const entries = sortedEntries(slug).map(entryMarkdown);
  return rewriteInstallText(
    `# ${page.title} (Chartist API)\n\n> ${page.description}\n\n${entries.join('\n\n')}\n`
  );
}

/** A package's API page as Markdown: every export. */
export function packageApiMarkdown(slug: string): string {
  const pkg = packageBySlug(slug);
  const entries = packageApiEntries(slug).map(entryMarkdown);
  return rewriteInstallText(
    `# ${pkg.name} API\n\n> Every function and type ${pkg.name} exports. Types from \`chartist\` link to the Chartist API reference.\n\n${entries.join('\n\n')}\n`
  );
}

// Examples -----------------------------------------------------------------

export function exampleMarkdown(example: GalleryExample): string {
  const files = Object.entries(example.files)
    .sort(([a], [b]) =>
      a === 'src/main.ts' ? -1 : b === 'src/main.ts' ? 1 : a.localeCompare(b)
    )
    .map(([file, code]) => `\`${file}\`:\n\n${fence(code, langOf(file))}`);
  const classic = example.classicCode
    ? [
        `The same chart with the 1.x classes (\`src/main.classic.ts\`):\n\n${fence(example.classicCode, 'ts')}`
      ]
    : [];
  return rewriteInstallText(
    `# ${example.title} (Chartist example)\n\n${example.description ? `> ${example.description}\n\n` : ''}${files.join('\n\n')}${classic.length ? `\n\n${classic.join('')}` : ''}\n`
  );
}

// Plugins ------------------------------------------------------------------

/** One plugin's page as Markdown: facts, setup and the example's code. */
export function pluginMarkdown(plugin: Plugin): string {
  const stats = pluginFacts(plugin.package);
  const setup = setupSnippet(plugin);
  const main = exampleFiles(plugin.example)['src/main.ts'];
  return `${[
    `# ${plugin.title} (\`${plugin.package}\`, Chartist plugin)`,
    `> ${plugin.description}`,
    ...(plugin.note ? [plugin.note] : []),
    [
      `- Author: ${plugin.author}`,
      `- Source: ${plugin.repository ?? 'repository gone'}, npm: ${npmUrl(plugin)}`,
      `- License: ${plugin.license}`,
      `- Written for the Chartist ${plugin.chartist} API; runs on v2 with \`chartist/compat\` (${plugin.loads === 'module' ? 'an ES module' : 'a script that reads the global `Chartist`, for backwards compatibility'})`,
      `- Charts: ${plugin.types.join(', ')}`,
      `- Server rendering: ${plugin.ssr ? 'yes' : 'no, it needs a browser'}`,
      `- Downloads: ${stats.monthlyDownloads} a month, last release ${stats.lastRelease}`
    ].join('\n'),
    `Setup:\n\n${fence(setup.code, setup.lang)}`,
    `Example (\`src/main.ts\`):\n\n${fence(main, 'ts')}`,
    `All plugins: ${absolute(markdownPath('plugins/'))}`
  ].join('\n\n')}\n`;
}

/** The plugins overview as Markdown: each plugin with a link to its page. */
export function pluginsMarkdown(): string {
  const entries = sortedPlugins().map(
    plugin =>
      `- [${plugin.title}](${absolute(markdownPath(`plugins/${pluginSlug(plugin)}/`))}) (\`${plugin.package}\`): ${plugin.description}`
  );
  return `# Plugins (Chartist)\n\n> Community plugins for Chartist, sorted by npm downloads in the last month. Script plugins load after Chartist's UMD builds and \`compat.umd.js\`, which give them the global \`Chartist\` they were written for; wrap them with \`fromLegacyPlugin\` on the v2 API. Each page has the plugin's facts, setup and a v2 example.\n\n${entries.join('\n')}\n`;
}

// llms.txt -----------------------------------------------------------------

/** Each package with its subsite pages: overview, guides, API page. */
const packagePages = () =>
  Promise.all(
    PACKAGES.map(async pkg => ({
      pkg,
      pages: await navPages('packages', pkg.slug)
    }))
  );

/** Notes that keep generated code on the v2 API. */
const NOTES = `Chartist draws responsive SVG charts and leaves their look to CSS. This is Chartist v2, a TypeScript library with no dependencies, available from npm (\`chartist\`) or as ES modules from a CDN, without a build step.

When writing Chartist code:

- Create charts with the functions: \`lineChart(target, data, options)\`, \`barChart(…)\` and \`pieChart(…)\` for the classic chart types, and \`chart({ data, axes, layers })\` for composed charts (bars and lines together, several axes). Import them from \`chartist\`, and the default styles with \`import 'chartist/styles.css'\`.
- Don't write \`new Chartist.Line(…)\`, \`new LineChart(…)\` or \`Chartist.Interpolation\`: that's the 1.x and 0.x API. The 1.x classes are deprecated and leave \`chartist\` in 3.0; they still work, for compatibility only.
- Style charts with CSS and custom properties (\`--ct-series-a\`, \`--ct-line-width\`, …), not with options.
- Change what a chart draws with plugins: listeners on the pipeline's phase events (\`compose\` for scene nodes, \`mount\` for the DOM). 1.x \`draw\` events need the \`compat\` plugin from \`chartist/compat\`.
- Size charts with their container (CSS), and use responsive options for what changes with the size.
- Packages under \`@chartist-js\` (listed below) take the same data and options: \`@chartist-js/terminal\` draws charts as terminal text or HTML text art.`;

export async function llmsTxt(guides: DocEntry[]): Promise<string> {
  const link = (title: string, path: string, description?: string) =>
    `- [${title}](${absolute(markdownPath(path))})${description ? `: ${description}` : ''}`;
  const sections = [
    `## Docs\n\n${guides.map(guide => link(guide.data.title, `docs/${guide.id}/`, guide.data.description)).join('\n')}`,
    `## API reference\n\n- [The whole reference and guides in one file](${absolute('llms-full.txt')})\n${API_PAGES.map(page => link(page.title, apiPath(page.slug), page.description)).join('\n')}`,
    `## Packages\n\n${(await packagePages()).map(({ pkg, pages }) => [`### ${pkg.name}`, ...pages.map(page => link(page.title, page.path, page.description))].join('\n\n')).join('\n\n')}`,
    `## Plugins\n\n${[link('Plugins', 'plugins/', 'Community plugins: tooltips, axis titles, legends, labels, zoom and more'), ...sortedPlugins().map(plugin => link(plugin.title, `plugins/${pluginSlug(plugin)}/`, plugin.description))].join('\n')}`,
    `## Examples\n\n${TYPES.map(({ type, title }) => [`### ${title}`, ...gallery.filter(example => example.type === type).map(example => link(example.title, `examples/${example.id}/`, example.description))].join('\n\n')).join('\n\n')}`,
    `## Optional\n\n${VERSIONS.filter(version => version.href)
      .map(
        version =>
          `- [${version.label}](${new URL(version.href!, absolute('/')).href}): the documentation of an older major version`
      )
      .join('\n')}`
  ];
  return `# Chartist\n\n> Simple, responsive charts drawn in SVG and styled with CSS. Tiny, typed, and happy without a build step.\n\n${NOTES}\n\n${sections.join('\n\n')}\n`;
}

/** Every heading one level down, leaving code blocks alone. */
function demote(markdown: string): string {
  let inFence = false;
  return markdown
    .split('\n')
    .map(line => {
      if (/^\s*(`{3,}|~{3,})/.test(line)) {
        inFence = !inFence;
      }
      return !inFence && /^#+ /.test(line) ? `#${line}` : line;
    })
    .join('\n');
}

export async function llmsFullTxt(guides: DocEntry[]): Promise<string> {
  const packages = await Promise.all(
    PACKAGES.map(async pkg => [
      ...(await packageEntries(pkg.slug)).map(entry =>
        guideMarkdown(
          entry,
          packagePagePath(pkg.slug, packagePageParam(entry) ?? 'index')
        )
      ),
      packageApiMarkdown(pkg.slug)
    ])
  );
  const parts = [
    `# Chartist v2: guides, API reference and packages\n\n${NOTES}`,
    ...guides.map(guide => guideMarkdown(guide, `docs/${guide.id}/`)),
    ...API_PAGES.map(page => apiMarkdown(page.slug)),
    ...packages.flat()
  ];
  // One level down, so each guide's and page's title is a section.
  return `${parts.map((part, i) => (i === 0 ? part : demote(part))).join('\n\n')}\n`;
}
