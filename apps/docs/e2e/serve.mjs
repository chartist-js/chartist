// Serves the built site like a static host: index.html for directories,
// 404.html (status 404) for unknown paths. Used by the e2e tests, because
// `astro preview` detaches into the background when there is no terminal.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// DOCS_DIST serves another build (docs:visual --dist).
const root = process.env.DOCS_DIST
  ? join(process.env.DOCS_DIST, '/')
  : fileURLToPath(new URL('../../../dist/apps/docs/', import.meta.url));
const port = Number(process.env.PORT ?? 4329);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml'
};

async function resolve(pathname) {
  const file = normalize(join(root, decodeURIComponent(pathname)));
  if (!file.startsWith(root)) {
    return undefined;
  }
  try {
    const info = await stat(file);
    if (info.isFile()) {
      return file;
    }
    // The 1.x docs (public/v1/) link `page` for `page.html`, next to
    // `page/` folders without an index.html.
    if (
      !(await isFile(join(file, 'index.html'))) &&
      (await isFile(`${file}.html`))
    ) {
      return `${file}.html`;
    }
    return join(file, 'index.html');
  } catch {
    return (await isFile(`${file}.html`)) ? `${file}.html` : undefined;
  }
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  // The live example's sandboxed preview (origin null) loads the Chartist
  // module from the site; static hosts like GitHub Pages send this too.
  response.setHeader('Access-Control-Allow-Origin', '*');
  const file = await resolve(pathname);
  try {
    const body = await readFile(file ?? '');
    response.writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream'
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': types['.html'] });
    response.end(await readFile(join(root, '404.html')));
  }
  // eslint-disable-next-line no-console
}).listen(port, () => console.log(`serving ${root} on ${port}`));
