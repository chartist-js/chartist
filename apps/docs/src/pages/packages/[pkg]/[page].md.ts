/** A package's guides as Markdown. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { PACKAGES } from '../../../data/packages';
import {
  packageEntries,
  packagePagePath,
  packagePageParam,
  type PackageEntry
} from '../../../lib/docs';
import { guideMarkdown } from '../../../lib/markdown';

export const getStaticPaths = (async () =>
  (
    await Promise.all(
      PACKAGES.map(async pkg =>
        (await packageEntries(pkg.slug)).flatMap(entry => {
          const page = packagePageParam(entry);
          return page
            ? [{ params: { pkg: pkg.slug, page }, props: { entry } }]
            : [];
        })
      )
    )
  ).flat()) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: PackageEntry }> = ({ params, props }) =>
  new Response(
    guideMarkdown(props.entry, packagePagePath(params.pkg!, params.page!)),
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
  );
