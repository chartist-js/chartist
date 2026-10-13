import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Hosting is decided in the release phase: the site URL and base path come
// from the environment.
export default defineConfig({
  site: process.env.DOCS_SITE ?? 'http://localhost:4321',
  base: process.env.DOCS_BASE ?? '/',
  trailingSlash: 'always',
  output: 'static',
  outDir: '../../dist/apps/docs',
  integrations: [mdx()],
  // 4321 (Astro's default) is the playground e2e server's port.
  server: { port: 4322 },
  vite: {
    // The live example's sandboxed preview (origin null) loads the
    // Chartist module from the dev server.
    server: { cors: { origin: '*' } }
  },
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});
