import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const ChartistChangelogRenderer = require('./changelog-renderer.cjs');

const change = (type, scope, description) => ({
  type,
  scope,
  description,
  body: '',
  isBreaking: false,
  affectedProjects: '*'
});

/** The changes the renderer keeps for the workspace changelog. */
const kept = changes =>
  new ChartistChangelogRenderer({
    changes,
    changelogEntryVersion: '2.0.1',
    project: null,
    entryWhenNoChanges: false,
    isVersionPlans: false,
    changelogRenderOptions: {},
    conventionalCommitsConfig: { types: {} }
  }).changes.map(({ type, scope }) => `${type}(${scope})`);

test('keeps the changes of the released packages', () => {
  assert.deepEqual(
    kept([
      change('feat', 'chartist', 'preset configs'),
      change('fix', 'terminal', 'labels on slices'),
      change('feat', 'terminal', 'ct-cli')
    ]),
    ['feat(chartist)', 'fix(terminal)', 'feat(terminal)']
  );
});

test('leaves out what ships with the site', () => {
  assert.deepEqual(
    kept([
      change('fix', 'docs', 'a typo'),
      change('feat', 'playground', 'types'),
      change('feat', 'examples', 'a terminal example'),
      change('docs', 'openspec', 'a proposal'),
      change('fix', 'terminal', 'colors')
    ]),
    ['fix(terminal)']
  );
});
