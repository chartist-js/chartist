/**
 * robots.txt: everything may be crawled, the share cards (/og/) included,
 * since chat apps' preview bots honor robots.txt when they fetch a card.
 * Generated rather than in public/, as the sitemap's URL must be absolute
 * and the site's URL and base come from the environment (astro.config.mjs).
 */
import type { APIRoute } from 'astro';
import { href } from '../lib/site';

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL(href('sitemap-index.xml'), site).href}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    }
  );
