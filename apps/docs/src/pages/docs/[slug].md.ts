/** A guide as Markdown (polish-docs-site, design D6). */
import type { APIRoute, GetStaticPaths } from 'astro';
import { sortedDocs, type DocEntry } from '../../lib/docs';
import { guideMarkdown } from '../../lib/markdown';

export const getStaticPaths = (async () =>
  (await sortedDocs()).map(entry => ({
    params: { slug: entry.id },
    props: { entry }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: DocEntry }> = ({ props }) =>
  new Response(guideMarkdown(props.entry), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
