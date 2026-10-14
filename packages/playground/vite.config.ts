import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const chartistDir = fileURLToPath(new URL('../chartist/', import.meta.url));
const LIB = 'lib/chartist/';
const LIB_FILES: Record<string, string> = {
  'index.js': 'text/javascript',
  // chartist/compat; it imports ./index.js, so it shares the core.
  'compat.js': 'text/javascript',
  'index.css': 'text/css',
  // Declarations for type-aware editing (types option).
  'index.d.ts': 'text/plain',
  'compat.d.ts': 'text/plain'
};

/**
 * Serves the workspace build of `chartist` (packages/chartist/dist) at
 * `{base}lib/chartist/` in dev and copies it into the build output, like the
 * docs site does. The preview runs in an opaque origin, so the
 * module needs `Access-Control-Allow-Origin` (GitHub Pages sends `*`).
 */
function chartistLib(): Plugin {
  let base = '/';
  return {
    name: 'chartist-lib',
    configResolved(config) {
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        const file =
          path.startsWith(base + LIB) && path.slice((base + LIB).length);
        if (!file || !(file in LIB_FILES)) {
          return next();
        }
        res.setHeader('Content-Type', LIB_FILES[file]);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(await readFile(`${chartistDir}dist/${file}`));
      });
    },
    async generateBundle() {
      for (const file of Object.keys(LIB_FILES)) {
        this.emitFile({
          type: 'asset',
          fileName: LIB + file,
          source: await readFile(`${chartistDir}dist/${file}`)
        });
      }
    }
  };
}

const { version } = JSON.parse(
  await readFile(`${chartistDir}package.json`, 'utf8')
) as { version: string };

export default defineConfig({
  root: 'demo',
  // The Nx build target passes `--base /chartist/` (like GitHub Pages).
  base: '/',
  define: {
    __CHARTIST_VERSION__: JSON.stringify(version)
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022'
  },
  plugins: [chartistLib()]
});
