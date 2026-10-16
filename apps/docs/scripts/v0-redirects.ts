/**
 * Writes the new contents of the old 0.x site (the `gh-pages` branch of
 * gionkunz/chartist-js, served at https://gionkunz.github.io/chartist-js/)
 * to `tmp/v0-redirects/`: a redirect page per 0.x page, a 404 page for any
 * other path, `.nojekyll` and a `robots.txt` that lets search engines
 * follow the redirects. See src/lib/v0-redirects.ts for where links go.
 *
 * Every target is checked against the built site first (`docs:build`): its
 * file has to exist and its `#hash` has to be an id in it. A renamed v2
 * page or heading fails here instead of sending visitors to a 404. After a
 * fix, the pages have to be pushed to `gh-pages` again.
 *
 * The targets are on `DOCS_SITE` (default `https://chartist.dev`); set it to
 * a local server to try the pages out.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V0_PAGES,
  archivePath,
  v0NotFoundPage,
  v0RedirectPage,
  v0Targets
} from '../src/lib/v0-redirects.ts';

const DIST = fileURLToPath(
  new URL('../../../dist/apps/docs/', import.meta.url)
);
const OUT = fileURLToPath(
  new URL('../../../tmp/v0-redirects/', import.meta.url)
);
const SITE = (process.env.DOCS_SITE ?? 'https://chartist.dev').replace(
  /\/$/,
  ''
);

/** The built file of a target path below the site root. */
const builtFile = (path: string) =>
  path === '' || path.endsWith('/') ? `${path}index.html` : path;

/** Why `target` doesn't resolve on the built site, or undefined. */
async function problem(target: string): Promise<string | undefined> {
  const [path, hash] = target.split('#');
  let html: string;
  try {
    html = await readFile(join(DIST, builtFile(path)), 'utf8');
  } catch {
    return `${target}: no ${builtFile(path)} in the build`;
  }
  if (hash && !html.includes(` id="${hash}"`)) {
    return `${target}: no id "${hash}" in ${builtFile(path)}`;
  }
  return undefined;
}

const targets = new Set(
  V0_PAGES.flatMap(page => [...v0Targets(page), archivePath(page)])
);
const problems = (await Promise.all([...targets].map(problem))).filter(Boolean);
if (problems.length > 0) {
  console.error(
    `${problems.length} redirect targets don't resolve on the built site:\n${problems.join('\n')}`
  );
  process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
const files: Record<string, string> = {
  '.nojekyll': '',
  'robots.txt': 'User-agent: *\nAllow: /\n',
  '404.html': v0NotFoundPage(SITE)
};
for (const page of V0_PAGES) {
  files[page.file] = v0RedirectPage(page, SITE);
}
for (const [file, content] of Object.entries(files)) {
  await mkdir(dirname(join(OUT, file)), { recursive: true });
  await writeFile(join(OUT, file), content);
}
console.log(
  `Checked ${targets.size} targets on the build and wrote ${Object.keys(files).length} files for ${SITE} to tmp/v0-redirects/.`
);
