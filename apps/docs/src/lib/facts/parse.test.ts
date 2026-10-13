import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  countFromLinkHeader,
  dependsOnChartist,
  parseDependentRows,
  parseDependentsCount,
  parseNextDependentsPage,
  selectUsedBy,
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

  it('reads the dependent repositories with owner type and stars', () => {
    const rows = parseDependentRows(html);
    expect(rows).toHaveLength(30);
    expect(
      rows.filter(row => row.ownerType === 'organization').length
    ).toBeGreaterThan(0);
    expect(
      rows.find(row => row.repo === 'L-entreprise/vendure_menata')
    ).toEqual({
      owner: 'L-entreprise',
      repo: 'L-entreprise/vendure_menata',
      ownerType: 'organization',
      stars: 0
    });
  });

  it('finds the next page', () => {
    expect(parseNextDependentsPage(html)).toMatch(/dependents_after=/);
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
