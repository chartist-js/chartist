/** The plugins page as Markdown. */
import type { APIRoute } from 'astro';
import { pluginsMarkdown } from '../lib/markdown';

export const GET: APIRoute = () =>
  new Response(pluginsMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
