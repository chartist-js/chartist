/**
 * The Chartist version the site documents, and the install text that goes
 * with it.
 *
 * The guides and snippets are written for a final release: `npm install
 * chartist` and CDN URLs at `chartist@2`. While the package version is a
 * prerelease (`2.0.0-rc.1`), neither works: npm's `latest` tag still points
 * at the previous major, and jsDelivr's `@2` range doesn't match
 * prereleases. So during prereleases the site rewrites that text, in one
 * place, to `chartist@next` and to the exact version.
 *
 * `astro.config.mjs` imports this file, and Astro loads the config with
 * Node first: keep it to erasable TypeScript, without imports of other `.ts`
 * files, and the JSON import with its attribute. Otherwise Astro falls back
 * to loading the config through Vite, whose module runner is closed by the
 * time the Pagefind integration imports `pagefind` after the build.
 */
import pkg from '../../../../packages/chartist/package.json' with { type: 'json' };

/** What the site says about installing a Chartist version. */
export interface Release {
  readonly version: string;
  /** The version has a prerelease part (`2.0.0-rc.1`). */
  readonly prerelease: boolean;
  /** The package to install: `chartist@next` during prereleases. */
  readonly npmSpecifier: string;
  /** The version in CDN URLs: the exact one during prereleases, else the major. */
  readonly cdnVersion: string;
  /** The `chartist` version of a StackBlitz export's package.json. */
  readonly stackblitzVersion: string;
}

export function releaseOf(version: string): Release {
  const prerelease = version.includes('-');
  return {
    version,
    prerelease,
    npmSpecifier: prerelease ? 'chartist@next' : 'chartist',
    cdnVersion: prerelease ? version : version.split('.')[0],
    stackblitzVersion: prerelease ? 'next' : 'latest'
  };
}

/**
 * The version of `packages/chartist/package.json` at build time.
 * `CHARTIST_VERSION_OVERRIDE` replaces it, so tests can build or render the
 * site as it looks for another version (a prerelease, say).
 */
export const CHARTIST_VERSION: string =
  (typeof process === 'undefined'
    ? undefined
    : process.env.CHARTIST_VERSION_OVERRIDE) || pkg.version;

export const release: Release = releaseOf(CHARTIST_VERSION);

/**
 * An npm, pnpm or yarn command that adds packages, or an `npx` run, up to
 * the line's end or a shell operator.
 */
const INSTALL =
  /\b(?:npm\s+(?:install|i|add)|pnpm\s+(?:add|install|i)|yarn\s+add|npx)\b[^\n;&|]*/g;
/** `chartist` as a package argument: not `chartist-plugin-…`, not `chartist@…`. */
const PACKAGE = /(?<![\w@./-])chartist(?![\w@/-])/g;
/** A `@chartist-js` package, released with `chartist`, without a version. */
const SCOPED = /(?<![\w@./-])@chartist-js\/[\w.-]+(?![\w@/-])/g;
const CDN = /\bcdn\.jsdelivr\.net\/npm\/chartist@2\//g;

/**
 * Install text for the given release: unchanged for a final version; for a
 * prerelease, `npm install chartist` installs `chartist@next` (and the
 * `@chartist-js` packages, released with it, `@next` too, also for `npx`)
 * and CDN URLs at `chartist@2/` load the exact version. Other packages
 * (plugins with their own pinned CDN versions) are left alone.
 */
export function rewriteInstallText(
  text: string,
  { prerelease, cdnVersion }: Release = release
): string {
  if (!prerelease) {
    return text;
  }
  return text
    .replace(INSTALL, command =>
      command.replace(PACKAGE, 'chartist@next').replace(SCOPED, '$&@next')
    )
    .replace(CDN, `cdn.jsdelivr.net/npm/chartist@${cdnVersion}/`);
}

/**
 * A Shiki transformer that applies {@link rewriteInstallText} to a code
 * block before highlighting, while the text is still in one piece.
 */
export const installTextTransformer = {
  name: 'chartist-install-text',
  preprocess(code: string): string {
    return rewriteInstallText(code);
  }
};
