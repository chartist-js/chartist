/** An example as Markdown (polish-docs-site, design D6). */
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
