import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { playgroundLib } from './integrations/playground-lib.mjs';

// Hosting is decided in the release phase: the site URL and base path come
// from the environment.
export default defineConfig({
  site: process.env.DOCS_SITE ?? 'http://localhost:4321',
  base: process.env.DOCS_BASE ?? '/',
  trailingSlash: 'always',
  output: 'static',
  outDir: '../../dist/apps/docs',
  integrations: [mdx(), playgroundLib()],
  // 4321 (Astro's default) is the playground e2e server's port.
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
        '@codemirror/commands',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-javascript',
        '@codemirror/language',
        '@codemirror/state',
        '@codemirror/view',
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
