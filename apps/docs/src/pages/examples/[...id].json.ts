/**
 * One JSON file per gallery example (`/examples/<type>/<name>.json`), so the
 * playground can open an example by id without bundling them all.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { gallery } from '../../lib/gallery';

export const getStaticPaths = (() =>
  gallery.map(example => ({
    params: { id: example.id },
    props: { files: example.files, title: example.title }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props), {
    headers: { 'content-type': 'application/json' }
  });
