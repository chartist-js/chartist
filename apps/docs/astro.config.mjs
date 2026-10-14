import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { pagefind } from './integrations/pagefind.mjs';
import { playgroundLib } from './integrations/playground-lib.mjs';
import { v1Redirects } from './integrations/v1-redirects.mjs';

// Hosting is decided in the release phase: the site URL and base path come
// from the environment.
export default defineConfig({
  site: process.env.DOCS_SITE ?? 'http://localhost:4321',
  base: process.env.DOCS_BASE ?? '/',
  trailingSlash: 'always',
  output: 'static',
  outDir: '../../dist/apps/docs',
  integrations: [
    mdx(),
    playgroundLib(),
    pagefind(),
    // The archived 1.x docs (public/v1/) and the card images stay out.
    sitemap({ filter: page => !/\/(v1|og)\//.test(new URL(page).pathname) }),
    // After Pagefind, so the redirect pages aren't indexed for search.
    v1Redirects()
  ],
  // `nx dev docs` passes --port 4321 (nx-astro's default), which wins over
  // this; `astro dev` run directly uses 4322. The playground e2e uses 4331.
  // IPv4 loopback: Node may otherwise bind only [::1], which dev container
  // port forwarding (IPv4) can't reach. Still private to the machine.
  server: { port: 4322, host: '127.0.0.1' },
  vite: {
    plugins: [tailwindcss()],
    // The live example's sandboxed preview (origin null) loads the
    // Chartist module from the dev server.
    server: { cors: { origin: '*' } },
    // The live example loads the playground on demand. Without pre-bundling
    // its dependencies, Vite discovers them on first use, re-optimizes, and
    // the requests already made fail (504 "Outdated Optimize Dep").
    optimizeDeps: {
      include: [
        '@codemirror/autocomplete',
        '@codemirror/commands',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-javascript',
        '@codemirror/language',
        '@codemirror/lint',
        '@codemirror/state',
        '@codemirror/view',
        '@lezer/highlight',
        '@stackblitz/sdk',
        'es-module-lexer/minimal',
        'sucrase',
        'ts-blank-space',
        'typescript'
      ].map(dependency => `@chartist/playground > ${dependency}`)
    }
  },
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});
