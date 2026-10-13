// Serves the built site like a static host: index.html for directories,
// 404.html (status 404) for unknown paths. Used by the e2e tests, because
// `astro preview` detaches into the background when there is no terminal.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(
  new URL('../../../dist/apps/docs/', import.meta.url)
);
const port = Number(process.env.PORT ?? 4329);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json'
};

async function resolve(pathname) {
  const file = normalize(join(root, decodeURIComponent(pathname)));
  if (!file.startsWith(root)) {
    return undefined;
  }
  try {
    const info = await stat(file);
    return info.isDirectory() ? join(file, 'index.html') : file;
  } catch {
    return undefined;
  }
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
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
