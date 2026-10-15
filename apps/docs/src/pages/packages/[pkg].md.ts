/** A package's overview as Markdown. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { PACKAGES } from '../../data/packages';
import {
  packageEntries,
  packagePageParam,
  type PackageEntry
} from '../../lib/docs';
import { guideMarkdown } from '../../lib/markdown';

export const getStaticPaths = (async () =>
  Promise.all(
    PACKAGES.map(async pkg => ({
      params: { pkg: pkg.slug },
      props: {
        entry: (await packageEntries(pkg.slug)).find(
          entry => packagePageParam(entry) === undefined
        )!
      }
    }))
  )) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: PackageEntry }> = ({ params, props }) =>
  new Response(guideMarkdown(props.entry, `packages/${params.pkg}/`), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
