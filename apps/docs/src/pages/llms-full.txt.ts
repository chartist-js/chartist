/** The guides and the API reference in one Markdown file (polish-docs-site, design D6). */
import type { APIRoute } from 'astro';
import { sortedDocs } from '../lib/docs';
import { llmsFullTxt } from '../lib/markdown';

export const GET: APIRoute = async () =>
  new Response(await llmsFullTxt(await sortedDocs()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
