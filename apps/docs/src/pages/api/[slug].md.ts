/** An API reference page as Markdown (polish-docs-site, design D6). */
import type { APIRoute, GetStaticPaths } from 'astro';
import { API_PAGES } from '../../lib/api-pages';
import { apiMarkdown } from '../../lib/markdown';

export const getStaticPaths = (() =>
  API_PAGES.map(page => ({
    params: { slug: page.slug }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(apiMarkdown(params.slug!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
