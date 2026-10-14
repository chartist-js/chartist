import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  countFromLinkHeader,
  dependsOnChartist,
  parseDependentsCount,
  rolesFromCollaborators,
  selectCredits,
  selectUsedBy,
  type Contributor,
  type UsedByCandidate
} from './parse';

// A saved copy of github.com/chartist-js/chartist/network/dependents.
const html = readFileSync(
  new URL('./dependents.fixture.html', import.meta.url),
  'utf8'
);

describe('facts parsers', () => {
  it('reads the dependents count', () => {
    expect(parseDependentsCount(html)).toBe(72834);
  });

  it('counts from a Link header', () => {
    expect(
      countFromLinkHeader(
        '<https://api.github.com/x?per_page=1&page=2>; rel="next", <https://api.github.com/x?per_page=1&anon=1&page=92>; rel="last"'
      )
    ).toBe(92);
    expect(countFromLinkHeader(null)).toBe(1);
  });

  it('detects chartist in any dependency field', () => {
    expect(dependsOnChartist({ dependencies: { chartist: '^1.0.0' } })).toBe(
      true
    );
    expect(dependsOnChartist({ devDependencies: { chartist: '0.11.4' } })).toBe(
      true
    );
    expect(dependsOnChartist({ dependencies: { 'react-chartist': '1' } })).toBe(
      false
    );
    expect(dependsOnChartist(null)).toBe(false);
  });
});

describe('Used by selection', () => {
  const candidate = (
    owner: string,
    stars: number,
    ownerType: UsedByCandidate['ownerType'] = 'organization'
  ): UsedByCandidate => ({
    owner,
    name: owner,
    repo: `${owner}/app`,
    ownerType,
    stars,
    evidence: `https://github.com/${owner}/app`
  });

  it('keeps organizations with notable repositories, best repo first', () => {
    const selected = selectUsedBy([
      candidate('acme', 400),
      { ...candidate('acme', 900), repo: 'acme/big' },
      candidate('tiny', 10),
      candidate('someone', 5000, 'user'),
      candidate('chartist-js', 13000),
      candidate('other', 120)
    ]);
    expect(selected.map(entry => entry.repo)).toEqual([
      'acme/big',
      'other/app'
    ]);
  });

  it('honors the exclude list and the maximum', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      candidate(`org${i}`, 100 + i)
    );
    expect(
      selectUsedBy(many, { exclude: ['ORG19'], max: 3 }).map(e => e.owner)
    ).toEqual(['org18', 'org17', 'org16']);
  });
});

describe('Credits selection', () => {
  const person = (
    login: string,
    contributions: number,
    type = 'User'
  ): Contributor => ({ login, contributions, type });
  const contributors = [
    person('gionkunz', 444),
    person('dangreen', 77),
    person('renovate[bot]', 23),
    person('dependabot', 20, 'Bot'),
    ...Array.from({ length: 12 }, (_, i) => person(`dev${i}`, 15 - i)),
    person('helper', 1)
  ];

  it('maps collaborator roles to flags', () => {
    expect(
      rolesFromCollaborators([
        { login: 'gionkunz', role_name: 'admin' },
        { login: 'dangreen', role_name: 'maintain' },
        { login: 'writer', role_name: 'write' },
        { login: 'triager', role_name: 'triage' },
        { login: 'ci[bot]', role_name: 'admin', type: 'Bot' }
      ])
    ).toEqual({ gionkunz: 'core maintainer', dangreen: 'maintainer' });
  });

  it('keeps the top ten humans by commits', () => {
    const selected = selectCredits(contributors, { creator: 'gionkunz' });
    expect(selected.map(entry => entry.login)).toEqual([
      'gionkunz',
      'dangreen',
      ...Array.from({ length: 8 }, (_, i) => `dev${i}`)
    ]);
    expect(selected[2]).toEqual({ login: 'dev0', commits: 15 });
  });

  it('flags the creator over a collaborator role, and the maintainers', () => {
    const selected = selectCredits(contributors, {
      creator: 'GionKunz',
      roles: { gionkunz: 'core maintainer', DanGreen: 'core maintainer' }
    });
    expect(selected[0]).toEqual({
      login: 'gionkunz',
      commits: 444,
      role: 'creator'
    });
    expect(selected[1].role).toBe('core maintainer');
    expect(selected.filter(entry => entry.role)).toHaveLength(2);
  });

  it('appends flagged people outside the top ten, by commits', () => {
    const selected = selectCredits(contributors, {
      creator: 'gionkunz',
      roles: { helper: 'maintainer', dev11: 'core maintainer' }
    });
    expect(selected.slice(10)).toEqual([
      { login: 'dev11', commits: 4, role: 'core maintainer' },
      { login: 'helper', commits: 1, role: 'maintainer' }
    ]);
  });

  it('honors the exclude list and the limit', () => {
    const selected = selectCredits(contributors, {
      creator: 'gionkunz',
      exclude: ['DANGREEN'],
      limit: 3
    });
    expect(selected.map(entry => entry.login)).toEqual([
      'gionkunz',
      'dev0',
      'dev1'
    ]);
  });
});
