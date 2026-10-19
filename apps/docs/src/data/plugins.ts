/**
 * The community plugins of the plugins page. What can be measured comes
 * from elsewhere: monthly downloads and the last release from the facts
 * snapshot, the files the site serves from plugin-files.json, the version
 * from the docs app's package.json. Plugins that don't run on v2 for a
 * reason in their own code aren't listed. Plugins an official package
 * replaces (axis titles, tooltips) aren't listed either; their packages
 * are on /packages/.
 */
import { z } from 'astro/zod';
import pkg from '../../package.json' with { type: 'json' };
import files from './plugin-files.json' with { type: 'json' };
import { facts } from './facts';

export const CHART_TYPES = ['line', 'bar', 'pie'] as const;

const schema = z.array(
  z.object({
    /** The npm package. */
    package: z.string(),
    title: z.string(),
    /** One or two sentences on what it adds. */
    description: z.string(),
    author: z.string(),
    /** The source repository; missing when it's gone. */
    repository: z.string().url().optional(),
    license: z.enum(['MIT', 'ISC', 'WTFPL']),
    types: z.array(z.enum(CHART_TYPES)).min(1),
    /**
     * How it loads: `module`, an ES module that imports `chartist`;
     * `script`, a classic script that registers on the global `Chartist`.
     * Either way it runs on v2 through `fromLegacyPlugin` from
     * `chartist/compat`.
     */
    loads: z.enum(['module', 'script']),
    /**
     * Draws its additions in server rendering (`toScene()`). Only v2-native
     * plugins can: 1.x events (`draw`, `created`) come from the mount phase,
     * which server rendering never reaches, so plugins of the 0.x and 1.x
     * APIs need a browser.
     */
    ssr: z.boolean(),
    /** Where a script plugin registers: `Chartist.plugins.<name>`. */
    registers: z.string().optional(),
    /** The Chartist version the plugin was written for, shown as a tag. */
    chartist: z.enum(['0.x', '1.x', '2.x']),
    /** The live example, `plugins/<name>` in src/examples. */
    example: z.string(),
    /** What to do in the example to see the plugin, for interactive ones. */
    hint: z.string().optional(),
    /** Anything a reader should know before using it. */
    note: z.string().optional()
  })
);

export const PLUGINS = schema.parse([
  {
    package: 'chartist-plugin-legend',
    registers: 'legend',
    title: 'Legend',
    description:
      'Adds a legend from the series names. Click an entry to hide or show its series.',
    author: 'Kees Kluskens',
    repository: 'https://github.com/CodeYellowBV/chartist-plugin-legend',
    license: 'ISC',
    types: ['line', 'bar', 'pie'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/legend',
    hint: 'Click a legend entry to hide its series.',
    note: 'It ships no stylesheet; its README has the CSS, as in the example.'
  },
  {
    package: 'chartist-plugin-pointlabels',
    registers: 'ctPointLabels',
    title: 'Point labels',
    description:
      'Writes each value next to its point, so readers see exact numbers without hovering.',
    author: 'Gion Kunz',
    repository: 'https://github.com/gionkunz/chartist-plugin-pointlabels',
    license: 'WTFPL',
    types: ['line', 'bar'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/pointlabels'
  },
  {
    package: 'chartist-hover',
    registers: 'hover',
    title: 'Hover',
    description:
      'Calls your functions when the pointer enters or leaves a point, so you can show the value anywhere you like.',
    author: 'Pier-Luc Gendreau',
    repository: 'https://github.com/Zertz/chartist-hover',
    license: 'MIT',
    types: ['line', 'bar', 'pie'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/hover',
    hint: 'Hover a point; the caption shows its value.'
  },
  {
    package: 'chartist-plugin-zoom',
    registers: 'zoom',
    title: 'Zoom',
    description:
      'Drag a box over a line chart to zoom into it, and reset the zoom from your own button.',
    author: 'Hannes Kamecke',
    repository: 'https://github.com/hansmaad/chartist-plugin-zoom',
    license: 'WTFPL',
    types: ['line'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/zoom',
    hint: 'Drag across the chart to zoom in, then press "Reset zoom".',
    note: 'It zooms auto and fixed scale axes, so the X axis needs one of them instead of the default step axis.'
  },
  {
    package: 'chartist-plugin-fill-donut',
    registers: 'fillDonut',
    title: 'Fill donut',
    description:
      'Draws a copy of the donut behind it, so an animated donut looks filled from the start, and puts HTML labels in or around it. Together they make gauges.',
    author: 'moxx',
    repository: 'https://github.com/moxx/chartist-plugin-fill-donut',
    license: 'MIT',
    types: ['pie'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/fill-donut'
  },
  {
    package: 'chartist-plugin-barlabels',
    registers: 'ctBarLabels',
    title: 'Bar labels',
    description: 'Writes each value at the end of its bar.',
    author: 'Matt Gibbs',
    repository: 'https://github.com/mtgibbs/chartist-plugin-barlabels',
    license: 'WTFPL',
    types: ['bar'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/barlabels'
  },
  {
    package: 'chartist-plugin-accessibility',
    registers: 'ctAccessibility',
    title: 'Accessibility',
    description:
      'Adds a visually hidden table with the data, a caption and a summary, so screen reader users get the numbers.',
    author: 'Gion Kunz',
    repository: 'https://github.com/gionkunz/chartist-plugin-accessibility',
    license: 'WTFPL',
    types: ['line', 'bar', 'pie'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/accessibility',
    hint: 'The example makes the hidden table visible below the chart.'
  },
  {
    package: 'chartist-plugin-threshold',
    registers: 'ctThreshold',
    title: 'Threshold',
    description:
      'Splits lines and bars at a value and gives the parts above and below their own classes to style.',
    author: 'Gion Kunz',
    repository: 'https://github.com/gionkunz/chartist-plugin-threshold',
    license: 'WTFPL',
    types: ['line', 'bar'],
    loads: 'script',
    chartist: '0.x',
    ssr: false,
    example: 'plugins/threshold'
  }
]);

export type Plugin = (typeof PLUGINS)[number];

/** The version the site serves and tests, from the docs app's package.json. */
export function pinnedVersion(name: string): string {
  const version = (pkg.devDependencies as Record<string, string>)[name];
  if (!version) {
    throw new Error(`plugins: ${name} is not a dev dependency of the docs app`);
  }
  return version;
}

/** The plugin's monthly downloads and last release, from the facts snapshot. */
export function pluginFacts(name: string) {
  const entry = facts.plugins[name];
  if (!entry) {
    throw new Error(
      `plugins: no download count for ${name} in facts.json; run \`pnpm nx run docs:facts\``
    );
  }
  return entry;
}

for (const plugin of PLUGINS) {
  if (plugin.ssr && plugin.chartist !== '2.x') {
    throw new Error(
      `plugins: ${plugin.package} is written for the ${plugin.chartist} API, whose events don't run in server rendering`
    );
  }
  if (plugin.loads === 'script' && !plugin.registers) {
    throw new Error(
      `plugins: ${plugin.package} loads as a script but has no \`registers\``
    );
  }
  pinnedVersion(plugin.package);
  pluginFacts(plugin.package);
  if (!(plugin.package in files)) {
    throw new Error(
      `plugins: ${plugin.package} has no entry in plugin-files.json`
    );
  }
}
