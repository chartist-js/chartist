/** The guides and the API reference in one Markdown file. */
import type { APIRoute } from 'astro';
import { sortedDocs } from '../lib/docs';
import { llmsFullTxt } from '../lib/markdown';

export const GET: APIRoute = async () =>
  new Response(await llmsFullTxt(await sortedDocs()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
