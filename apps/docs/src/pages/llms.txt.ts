/** The entry point for language models, in the llmstxt.org format (polish-docs-site, design D6). */
import type { APIRoute } from 'astro';
import { sortedDocs } from '../lib/docs';
import { llmsTxt } from '../lib/markdown';

export const GET: APIRoute = async () =>
  new Response(await llmsTxt(await sortedDocs()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
