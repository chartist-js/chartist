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
  /** The project's name, as the list shows it. */
  name: string;
  repo: string;
  ownerType: 'organization' | 'user';
  stars: number;
  /** Where the dependency is visible (the repo or its package.json). */
  evidence: string;
}

/**
 * "Used by": organizations only, with notable repositories, one entry per
 * organization (its most-starred repository), minus excluded owners, most
 * starred first.
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

/** A person's flag on the credits page. */
export type CreditRole = 'creator' | 'core maintainer' | 'maintainer';

/** An entry of GitHub's contributors list. */
export interface Contributor {
  login: string;
  type: string;
  contributions: number;
}

/** An entry of GitHub's collaborators list. */
export interface Collaborator {
  login: string;
  type?: string;
  role_name: string;
}

const isBot = (person: { login: string; type?: string }) =>
  person.type === 'Bot' || person.login.endsWith('[bot]');

/**
 * The collaborators' flags: `admin` is a core maintainer, `maintain` a
 * maintainer. Lower roles and bots get none.
 */
export function rolesFromCollaborators(
  collaborators: readonly Collaborator[]
): Record<string, Exclude<CreditRole, 'creator'>> {
  const roles: Record<string, Exclude<CreditRole, 'creator'>> = {};
  for (const collaborator of collaborators) {
    if (isBot(collaborator)) {
      continue;
    }
    if (collaborator.role_name === 'admin') {
      roles[collaborator.login] = 'core maintainer';
    } else if (collaborator.role_name === 'maintain') {
      roles[collaborator.login] = 'maintainer';
    }
  }
  return roles;
}

export interface Credit {
  login: string;
  commits: number;
  role?: CreditRole;
}

/**
 * The credits list: the `limit` humans with the most commits, then the
 * flagged people outside them, by commits. The creator's flag wins over a
 * collaborator role. Logins compare without case.
 */
export function selectCredits(
  contributors: readonly Contributor[],
  {
    roles = {} as Readonly<Record<string, Exclude<CreditRole, 'creator'>>>,
    creator,
    exclude = [] as readonly string[],
    limit = 10
  }: {
    roles?: Readonly<Record<string, Exclude<CreditRole, 'creator'>>>;
    creator: string;
    exclude?: readonly string[];
    limit?: number;
  }
): Credit[] {
  const excluded = new Set(exclude.map(login => login.toLowerCase()));
  const roleOf = new Map(
    Object.entries(roles).map(([login, role]) => [login.toLowerCase(), role])
  );
  const people = contributors
    .filter(
      person => !isBot(person) && !excluded.has(person.login.toLowerCase())
    )
    .map((person): Credit => {
      const key = person.login.toLowerCase();
      const role = key === creator.toLowerCase() ? 'creator' : roleOf.get(key);
      return {
        login: person.login,
        commits: person.contributions,
        ...(role && { role })
      };
    })
    .sort(
      (a, b) =>
        b.commits - a.commits ||
        a.login.toLowerCase().localeCompare(b.login.toLowerCase())
    );
  return [
    ...people.slice(0, limit),
    ...people.slice(limit).filter(person => person.role)
  ];
}
