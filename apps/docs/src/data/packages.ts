/**
 * The `@chartist-js` packages the site documents, each with a subsite at
 * `/packages/<slug>/`: its overview and guides come from
 * `src/content/packages/<slug>/`, its API page from its TypeDoc model
 * (`api/typedoc.<slug>.json`). A new package needs an entry here, an
 * `index.mdx`, a TypeDoc options file and a preview in
 * `src/lib/package-previews.ts`. Packages are the author's own, free or
 * commercial; community plugins are listed in `src/data/plugins.ts`.
 */
import terminal from '../../../../packages/terminal/package.json' with { type: 'json' };

/**
 * How a package is licensed: free under an open source license, or
 * commercial, with a yearly license that includes support.
 */
export type PackageLicense =
  | {
      readonly kind: 'free';
      /** The license, as in `package.json`, e.g. `MIT OR WTFPL`. */
      readonly name: string;
    }
  | {
      readonly kind: 'commercial';
      /** The terms in a few words, e.g. `Yearly license, support included`. */
      readonly terms: string;
      /** Where to get a license. */
      readonly href: string;
    };

export interface DocumentedPackage {
  /** The folder under `packages/` and in the URL, e.g. `terminal`. */
  readonly slug: string;
  /** The npm name, e.g. `@chartist-js/terminal`. */
  readonly name: string;
  /** One sentence on what it does, for the package index. */
  readonly description: string;
  /** The version in the repository; released with `chartist`. */
  readonly version: string;
  readonly license: PackageLicense;
}

export const PACKAGES: readonly DocumentedPackage[] = [
  {
    slug: 'terminal',
    name: terminal.name,
    description:
      'Draws Chartist charts in the terminal and as text art in HTML, with the ct-cli command and an API for CLI tools.',
    version: terminal.version,
    license: { kind: 'free', name: terminal.license }
  }
];

/** A package by its slug; throws for an unknown one. */
export function packageBySlug(slug: string): DocumentedPackage {
  const found = PACKAGES.find(candidate => candidate.slug === slug);
  if (!found) {
    throw new Error(`No documented package "${slug}" (src/data/packages.ts)`);
  }
  return found;
}

/** The install command, as the site writes it for `chartist`. */
export const installCommand = (pkg: DocumentedPackage) =>
  `npm install ${pkg.name}`;
