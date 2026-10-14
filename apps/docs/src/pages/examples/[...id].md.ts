/** An example as Markdown. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { gallery, type GalleryExample } from '../../lib/gallery';
import { exampleMarkdown } from '../../lib/markdown';

export const getStaticPaths = (() =>
  gallery.map(example => ({
    params: { id: example.id },
    props: { example }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ example: GalleryExample }> = ({ props }) =>
  new Response(exampleMarkdown(props.example), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
