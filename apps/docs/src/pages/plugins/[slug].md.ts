/** A plugin's page as Markdown. */
import type { APIRoute, GetStaticPaths } from 'astro';
import type { Plugin } from '../../data/plugins';
import { pluginMarkdown } from '../../lib/markdown';
import { pluginSlug, sortedPlugins } from '../../lib/plugins';

export const getStaticPaths = (() =>
  sortedPlugins().map(plugin => ({
    params: { slug: pluginSlug(plugin) },
    props: { plugin }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ plugin: Plugin }> = ({ props }) =>
  new Response(pluginMarkdown(props.plugin), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
