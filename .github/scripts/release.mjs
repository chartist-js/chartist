/**
 * The release workflow's decisions, kept out of YAML so they can be
 * tested: which arguments `nx release` gets, and which npm dist-tag a
 * version is published under.
 *
 *   node .github/scripts/release.mjs args    prints the nx release arguments
 *   node .github/scripts/release.mjs tag     prints the dist-tag
 *
 * Both read SPECIFIER, DRY_RUN and RELEASE_PREID from the environment and
 * the current version from packages/chartist/package.json.
 */
import { readFileSync } from 'node:fs';

const SPECIFIER =
  /^(patch|minor|major|prepatch|preminor|premajor|prerelease|\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?)$/;
const PREID = /^[0-9A-Za-z-]+$/;

export const isPrerelease = version => version.includes('-');

/** The dist-tag of a version: prereleases never move `latest`. */
export const distTag = version => (isPrerelease(version) ? 'next' : 'latest');

/**
 * The arguments for `nx release` (versioning, changelog, commit, tag, push
 * and GitHub release; publishing is a separate step), or a reason to stop.
 * The version comes from, in order: the specifier input, the next
 * prerelease of RELEASE_PREID when the current version is one, or the
 * conventional commits.
 */
export function releaseArgs({
  specifier = '',
  dryRun = false,
  preid = '',
  version
}) {
  const args = [];
  if (specifier) {
    if (!SPECIFIER.test(specifier)) {
      return { error: `Invalid version or specifier: ${specifier}` };
    }
    args.push(specifier);
    if (specifier === 'prerelease' && preid) {
      args.push('--preid', preid);
    }
  } else if (preid) {
    if (!PREID.test(preid)) {
      return { error: `Invalid RELEASE_PREID: ${preid}` };
    }
    if (!isPrerelease(version)) {
      return {
        error: `RELEASE_PREID is "${preid}" but ${version} is a final version. Start the release by hand with an explicit version, such as 2.0.0-${preid}.1.`
      };
    }
    args.push('prerelease', '--preid', preid);
  }
  args.push('--skip-publish');
  if (dryRun) {
    args.push('--dry-run');
  }
  return { args };
}

const currentVersion = () =>
  JSON.parse(
    readFileSync(
      new URL('../../packages/chartist/package.json', import.meta.url),
      'utf8'
    )
  ).version;

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command] = process.argv.slice(2);
  const version = currentVersion();
  if (command === 'tag') {
    console.log(distTag(version));
  } else if (command === 'args') {
    const result = releaseArgs({
      specifier: process.env.SPECIFIER ?? '',
      dryRun: process.env.DRY_RUN === 'true',
      preid: process.env.RELEASE_PREID ?? '',
      version
    });
    if (result.error) {
      console.error(`::error::${result.error}`);
      process.exit(1);
    }
    // One argument per line, for a bash array (mapfile).
    console.log(result.args.join('\n'));
  } else {
    console.error('Usage: release.mjs args|tag');
    process.exit(2);
  }
}
