/**
 * Guides as Markdown, for the pages' Markdown versions and llms-full.txt:
 * MDX in, Markdown out. Kept apart from markdown.ts, which reads the
 * content collections, so it runs in unit tests.
 */
import type { DocEntry } from './docs';
import { exampleFiles } from './examples';
import { rewriteInstallText } from './release';
import { href } from './site';

/** An absolute URL for a site path, so links work outside the page too. */
export function absolute(path: string): string {
  return new URL(path.startsWith('/') ? path : href(path), import.meta.env.SITE)
    .href;
}

export const fence = (code: string, lang: string) => {
  // A fence longer than any backtick run inside the code.
  const ticks = '`'.repeat(
    Math.max(3, ...[...code.matchAll(/`+/g)].map(m => m[0].length + 1))
  );
  return `${ticks}${lang}\n${code.replace(/\n+$/, '')}\n${ticks}`;
};

export const langOf = (file: string) => file.split('.').pop() ?? '';

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
