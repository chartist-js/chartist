/** A package's API page as Markdown. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { PACKAGES } from '../../../data/packages';
import { packageApiMarkdown } from '../../../lib/markdown';

export const getStaticPaths = (() =>
  PACKAGES.map(pkg => ({
    params: { pkg: pkg.slug }
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(packageApiMarkdown(params.pkg!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
