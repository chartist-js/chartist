/**
 * The plugins page's data, sorted, and the setup snippets the page and its
 * Markdown version show for each plugin.
 */
import files from '../data/plugin-files.json';
import {
  PLUGINS,
  pinnedVersion,
  pluginFacts,
  type Plugin
} from '../data/plugins';

const CDN = 'https://cdn.jsdelivr.net/npm';

/** The listed plugins, most downloaded first. */
export const sortedPlugins = (): Plugin[] =>
  [...PLUGINS].sort(
    (a, b) =>
      pluginFacts(b.package).monthlyDownloads -
      pluginFacts(a.package).monthlyDownloads
  );

/** The plugin's anchor on the page, e.g. `chartist-plugin-axistitle`. */
export const pluginSlug = (plugin: Plugin) =>
  plugin.package.replace(/^@/, '').replace(/\//g, '-');

export const npmUrl = (plugin: Plugin) =>
  `https://www.npmjs.com/package/${plugin.package}`;

type Files = { script: string; module?: string; style?: string };

/**
 * How to load the plugin on a site: script tags from a CDN for script
 * plugins, imports for module plugins.
 */
export function setupSnippet(plugin: Plugin): { lang: string; code: string } {
  const own = (files as Record<string, Files>)[plugin.package];
  const at = `${CDN}/${plugin.package}@${pinnedVersion(plugin.package)}`;
  if (plugin.loads === 'module') {
    return {
      lang: 'ts',
      code: [
        `// npm install chartist ${plugin.package}`,
        `import { lineChart } from 'chartist';`,
        `import { fromLegacyPlugin } from 'chartist/compat';`,
        `import plugin from '${plugin.package}';`,
        `import 'chartist/styles.css';`,
        ...(own.style ? [`import '${plugin.package}/${own.style}';`] : []),
        '',
        `lineChart('#chart', data, { plugins: [fromLegacyPlugin(plugin, {})] });`
      ].join('\n')
    };
  }
  return {
    lang: 'html',
    code: [
      `<link rel="stylesheet" href="${CDN}/chartist@2/dist/index.min.css">`,
      ...(own.style
        ? [`<link rel="stylesheet" href="${at}/${own.style}">`]
        : []),
      `<script src="${CDN}/chartist@2/dist/index.umd.js"></script>`,
      `<script src="${CDN}/chartist@2/dist/compat.umd.js"></script>`,
      `<script src="${at}/${own.script}"></script>`
    ].join('\n')
  };
}
