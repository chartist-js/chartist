/** The share card of every page (lib/og.ts): /og/<page path>.png. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { cards, type Card } from '../../lib/og';
import { renderCard } from '../../lib/og-card';

export const getStaticPaths = (async () =>
  (await cards()).map(card => ({
    params: { path: card.key },
    props: { card }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(
    new Uint8Array(await renderCard((props as { card: Card }).card)),
    {
      headers: { 'Content-Type': 'image/png' }
    }
  );
