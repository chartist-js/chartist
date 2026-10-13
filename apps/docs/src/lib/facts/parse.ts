/**
 * Parsers for the facts snapshot (scripts/facts.ts). Kept free of network
 * access so they can be tested against saved responses.
 */

/** The number in the "N Repositories" tab of GitHub's dependents page. */
export function parseDependentsCount(html: string): number {
  const match = html.match(/([\d,]+)\s*Repositories\s*<\/a>/);
  if (!match) {
    throw new Error('dependents count not found');
  }
  return Number(match[1].replace(/,/g, ''));
}

export interface DependentRow {
  owner: string;
  repo: string;
  ownerType: 'organization' | 'user';
  stars: number;
}

/** The repositories listed on one dependents page. */
export function parseDependentRows(html: string): DependentRow[] {
  const rows: DependentRow[] = [];
  const blocks = html.split('data-test-id="dg-repo-pkg-dependent"').slice(1);
  for (const block of blocks) {
    const owner = block.match(
      /data-hovercard-type="(organization|user)"[^>]*href="\/([^"/]+)"/
    );
    const repo = block.match(
      /data-hovercard-type="repository"[^>]*href="\/([^"]+)"/
    );
    const stars = block.match(/octicon-star[\s\S]*?<\/svg>\s*([\d,]+)/);
    if (owner && repo && stars) {
      rows.push({
        ownerType: owner[1] as DependentRow['ownerType'],
        owner: owner[2],
        repo: repo[1],
        stars: Number(stars[1].replace(/,/g, ''))
      });
    }
  }
  return rows;
}

/** The link to the next dependents page, if any. */
export function parseNextDependentsPage(html: string): string | undefined {
  return html.match(
    /href="(https:\/\/github\.com\/[^"]*dependents_after=[^"]+)"/
  )?.[1];
}

/**
 * The total from a GitHub list request made with per_page=1: the page
 * number of the `last` link (or 1 without pagination).
 */
export function countFromLinkHeader(link: string | null): number {
  const last = link?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return last ? Number(last[1]) : 1;
}

/** Whether a package.json lists chartist as a dependency of any kind. */
export function dependsOnChartist(packageJson: unknown): boolean {
  if (typeof packageJson !== 'object' || packageJson === null) {
    return false;
  }
  const json = packageJson as Record<
    string,
    Record<string, string> | undefined
  >;
  return [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ].some(key => json[key]?.chartist !== undefined);
}

export interface UsedByCandidate {
  owner: string;
  repo: string;
  ownerType: 'organization' | 'user';
  stars: number;
  /** Where the dependency is visible (the repo or its package.json). */
  evidence: string;
}

/**
 * "Used by": organizations only, with notable repositories, one entry per
 * organization (its most-starred repository), minus excluded owners.
 */
export function selectUsedBy(
  candidates: readonly UsedByCandidate[],
  { minStars = 50, max = 12, exclude = [] as readonly string[] } = {}
): UsedByCandidate[] {
  const excluded = new Set(exclude.map(owner => owner.toLowerCase()));
  const best = new Map<string, UsedByCandidate>();
  for (const candidate of candidates) {
    const key = candidate.owner.toLowerCase();
    if (
      candidate.ownerType !== 'organization' ||
      candidate.stars < minStars ||
      excluded.has(key) ||
      key === 'chartist-js'
    ) {
      continue;
    }
    const current = best.get(key);
    if (!current || candidate.stars > current.stars) {
      best.set(key, candidate);
    }
  }
  return [...best.values()].sort((a, b) => b.stars - a.stars).slice(0, max);
}
