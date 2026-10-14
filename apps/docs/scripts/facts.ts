/**
 * Writes src/data/facts.json: the numbers the site shows, from their
 * sources. Run with `pnpm nx run docs:facts` and commit the result; builds
 * never fetch. A GITHUB_TOKEN raises the GitHub API limits; the credits'
 * flags need one that can read the collaborators: a GitHub Actions token
 * (`secrets.GITHUB_TOKEN`, through its metadata read permission) or a
 * personal token of someone with push access.
 *
 * - npm: monthly downloads of `chartist`
 * - GitHub: stars, contributors, dependents count, and "Used by": the
 *   projects in src/data/used-by-candidates.json (with the path of the
 *   package.json that lists chartist, when it isn't the root), kept only
 *   while that package.json still lists chartist, minus used-by-exclude.json
 * - credits: the top contributors by commits and the maintainers, flagged
 *   by their collaborator role (without access to the collaborators, the
 *   previous snapshot's roles are kept), minus credits-exclude.json; their
 *   avatars go to src/assets/credits/
 * - plugins: monthly downloads and the last release of the plugins page's
 *   plugins (the packages in src/data/plugin-files.json)
 * - sizes: a line chart bundled with each library's recommended import
 *   (esbuild, minified, gzipped), at the versions pinned in package.json
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import {
  countFromLinkHeader,
  dependsOnChartist,
  parseDependentsCount,
  rolesFromCollaborators,
  selectCredits,
  selectUsedBy,
  type Collaborator,
  type Contributor,
  type UsedByCandidate
} from '../src/lib/facts/parse.ts';
import { CREATOR } from '../src/data/credits.ts';

const REPO = 'chartist-js/chartist';
const root = new URL('../', import.meta.url);
const headers: Record<string, string> = {
  'user-agent': 'chartist-docs-facts',
  ...(process.env.GITHUB_TOKEN && {
    authorization: `Bearer ${process.env.GITHUB_TOKEN}`
  })
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function get(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...init.headers }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response;
}

const json = async <T>(url: string) => (await get(url)).json() as Promise<T>;

async function npmDownloads() {
  const { downloads, start, end } = await json<{
    downloads: number;
    start: string;
    end: string;
  }>('https://api.npmjs.org/downloads/point/last-month/chartist');
  return { monthlyDownloads: downloads, period: { start, end } };
}

async function github() {
  const repo = await json<{ stargazers_count: number }>(
    `https://api.github.com/repos/${REPO}`
  );
  const contributors = await get(
    `https://api.github.com/repos/${REPO}/contributors?per_page=1&anon=1`
  );
  return {
    stars: repo.stargazers_count,
    contributors: countFromLinkHeader(contributors.headers.get('link'))
  };
}

/** The number of public repositories GitHub lists as dependents. */
async function dependents() {
  const html = await (
    await get(`https://github.com/${REPO}/network/dependents`, {
      headers: { 'user-agent': 'Mozilla/5.0' }
    })
  ).text();
  return parseDependentsCount(html);
}

/**
 * The curated "Used by" projects, kept only while the package.json at
 * their path still lists chartist.
 */
async function verifiedCandidates(): Promise<UsedByCandidate[]> {
  const projects = JSON.parse(
    await readFile(new URL('src/data/used-by-candidates.json', root), 'utf8')
  ) as { repo: string; name: string; path?: string }[];
  const verified: UsedByCandidate[] = [];
  for (const { repo, name, path } of projects) {
    try {
      const info = await json<{
        stargazers_count: number;
        default_branch: string;
        owner: { login: string; type: string };
      }>(`https://api.github.com/repos/${repo}`);
      const file = `${path ? `${path}/` : ''}package.json`;
      const packageJson = await (
        await get(
          `https://raw.githubusercontent.com/${repo}/${info.default_branch}/${file}`
        )
      ).json();
      if (dependsOnChartist(packageJson)) {
        verified.push({
          owner: info.owner.login,
          name,
          repo,
          ownerType:
            info.owner.type === 'Organization' ? 'organization' : 'user',
          stars: info.stargazers_count,
          evidence: `https://github.com/${repo}/blob/${info.default_branch}/${file}`
        });
      } else {
        console.warn(`skipped ${repo}: ${file} doesn't list chartist`);
      }
    } catch (error) {
      console.warn(`skipped ${repo}: ${(error as Error).message}`);
    }
  }
  return verified;
}

/** Downloads each organization's GitHub avatar, so the site serves it. */
async function avatars(entries: UsedByCandidate[]) {
  const dir = new URL('src/assets/used-by/', root);
  await mkdir(dir, { recursive: true });
  for (const { owner } of entries) {
    const image = await get(`https://github.com/${owner}.png?size=96`);
    await writeFile(
      new URL(`${owner.toLowerCase()}.png`, dir),
      Buffer.from(await image.arrayBuffer())
    );
  }
}

/**
 * The collaborators' flags. Without a token that can read them, the
 * previous snapshot's roles are kept, so a run never drops the flags.
 */
async function creditRoles(): Promise<
  ReturnType<typeof rolesFromCollaborators>
> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/collaborators?affiliation=all&per_page=100`,
    { headers }
  );
  if (response.ok) {
    return rolesFromCollaborators((await response.json()) as Collaborator[]);
  }
  // A token without access gets 401, 403 or (fine-grained) 404.
  if (![401, 403, 404].includes(response.status)) {
    throw new Error(`${response.status} ${response.statusText}: collaborators`);
  }
  console.warn(
    `can't read the collaborators (${response.status}): keeping the roles of the previous snapshot. Set GITHUB_TOKEN to an Actions token or a personal token with push access to ${REPO}.`
  );
  try {
    const previous = JSON.parse(
      await readFile(new URL('src/data/facts.json', root), 'utf8')
    ) as { credits?: { roles?: ReturnType<typeof rolesFromCollaborators> } };
    return previous.credits?.roles ?? {};
  } catch {
    return {};
  }
}

/** The credited people with their names, and their avatars downloaded. */
async function credits() {
  const roles = await creditRoles();
  const contributors = await json<Contributor[]>(
    `https://api.github.com/repos/${REPO}/contributors?per_page=100`
  );
  const exclude = JSON.parse(
    await readFile(new URL('src/data/credits-exclude.json', root), 'utf8')
  ) as string[];
  const selected = selectCredits(contributors, {
    roles,
    creator: CREATOR,
    exclude
  });
  const dir = new URL('src/assets/credits/', root);
  await mkdir(dir, { recursive: true });
  const people = [];
  for (const { login, commits, role } of selected) {
    const user = await json<{ name: string | null; html_url: string }>(
      `https://api.github.com/users/${login}`
    );
    const avatar = `${login.toLowerCase()}.png`;
    const image = await get(`https://github.com/${login}.png?size=160`);
    await writeFile(
      new URL(avatar, dir),
      Buffer.from(await image.arrayBuffer())
    );
    people.push({
      login,
      name: user.name?.trim() || login,
      url: user.html_url,
      commits,
      ...(role && { role }),
      avatar
    });
  }
  return { roles, people };
}

/** Monthly downloads and the last release date of each listed plugin. */
async function plugins() {
  const names = Object.keys(
    JSON.parse(
      await readFile(new URL('src/data/plugin-files.json', root), 'utf8')
    ) as Record<string, unknown>
  );
  const result: Record<
    string,
    { monthlyDownloads: number; lastRelease: string }
  > = {};
  for (const name of names) {
    const { downloads } = await json<{ downloads: number }>(
      `https://api.npmjs.org/downloads/point/last-month/${name}`
    );
    const meta = await json<{
      'dist-tags': { latest: string };
      time: Record<string, string>;
    }>(`https://registry.npmjs.org/${name.replace('/', '%2F')}`);
    result[name] = {
      monthlyDownloads: downloads,
      lastRelease: meta.time[meta['dist-tags'].latest].slice(0, 10)
    };
  }
  return result;
}

/**
 * One line chart per library, with the smallest setup its docs describe:
 * Chart.js with tree-shaken registration, ApexCharts' lean core plus the
 * line type, Highcharts' recommended import (it documents nothing smaller).
 */
const ENTRIES = {
  'chartist (lineChart)': `
    import { lineChart } from 'chartist';
    lineChart('#chart', { labels: ['a', 'b'], series: [[1, 2]] });`,
  'chartist (core: chart)': `
    import { chart } from 'chartist';
    chart('#chart', { data: { series: [] }, layers: [] });`,
  'chart.js': `
    import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
    Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale);
    new Chart(document.querySelector('canvas'), { type: 'line', data: { labels: ['a', 'b'], datasets: [{ data: [1, 2] }] } });`,
  apexcharts: `
    import ApexCharts from 'apexcharts/core';
    import 'apexcharts/line';
    new ApexCharts(document.querySelector('#chart'), { chart: { type: 'line' }, series: [{ data: [1, 2] }] }).render();`,
  highcharts: `
    import Highcharts from 'highcharts';
    Highcharts.chart('chart', { series: [{ type: 'line', data: [1, 2] }] });`
} as const;

async function sizes() {
  const result: Record<string, { minified: number; gzip: number }> = {};
  for (const [name, contents] of Object.entries(ENTRIES)) {
    const output = await build({
      stdin: {
        contents,
        resolveDir: new URL('.', root).pathname,
        loader: 'js'
      },
      bundle: true,
      minify: true,
      format: 'esm',
      platform: 'browser',
      write: false,
      logLevel: 'silent'
    });
    const code = output.outputFiles[0].contents;
    result[name] = {
      minified: code.byteLength,
      gzip: gzipSync(code, { level: 9 }).byteLength
    };
  }
  const pkg = JSON.parse(
    await readFile(new URL('package.json', root), 'utf8')
  ) as {
    devDependencies: Record<string, string>;
  };
  const chartistVersion = (
    JSON.parse(
      await readFile(
        new URL('../../packages/chartist/package.json', root),
        'utf8'
      )
    ) as {
      version: string;
    }
  ).version;
  return {
    method:
      'One line chart with the smallest setup each library documents (Chart.js tree-shaken registration, ApexCharts core plus the line type, Highcharts’ recommended import), bundled with esbuild (minified, ESM, browser) and gzipped (level 9).',
    versions: {
      chartist: `workspace (${chartistVersion} package version)`,
      'chart.js': pkg.devDependencies['chart.js'],
      apexcharts: pkg.devDependencies.apexcharts,
      highcharts: pkg.devDependencies.highcharts,
      esbuild: pkg.devDependencies.esbuild
    },
    bytes: result
  };
}

async function main() {
  const [downloads, gh, deps, candidates, credited, plugged, measured] =
    await Promise.all([
      npmDownloads(),
      github(),
      dependents(),
      verifiedCandidates(),
      credits(),
      plugins(),
      sizes()
    ]);
  const exclude = JSON.parse(
    await readFile(new URL('src/data/used-by-exclude.json', root), 'utf8')
  ) as string[];
  const usedBy = selectUsedBy(candidates, { exclude });
  await avatars(usedBy);
  const facts = {
    generatedAt: new Date().toISOString().slice(0, 10),
    npm: downloads,
    github: { ...gh, dependents: deps },
    usedBy: usedBy.map(({ owner, name, repo, stars, evidence }) => ({
      owner,
      name,
      repo,
      stars,
      evidence,
      avatar: `${owner.toLowerCase()}.png`
    })),
    credits: credited,
    plugins: plugged,
    sizes: measured
  };
  await writeFile(
    new URL('src/data/facts.json', root),
    `${JSON.stringify(facts, null, 2)}\n`
  );
  console.log(
    JSON.stringify(
      {
        ...facts,
        usedBy: facts.usedBy.map(e => e.repo),
        credits: facts.credits.people.map(
          p => `${p.login} ${p.commits}${p.role ? ` (${p.role})` : ''}`
        )
      },
      null,
      2
    )
  );
}

await main();
