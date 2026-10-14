import assert from 'node:assert/strict';
import { test } from 'node:test';
import { distTag, releaseArgs } from './release.mjs';

const BASE = ['--yes', '--skip-publish'];

test('an explicit version wins', () => {
  assert.deepEqual(
    releaseArgs({ specifier: '2.0.0-rc.1', preid: 'rc', version: '1.5.0' }),
    { args: ['2.0.0-rc.1', ...BASE] }
  );
});

test('the next release candidate while RELEASE_PREID is set', () => {
  assert.deepEqual(releaseArgs({ preid: 'rc', version: '2.0.0-rc.1' }), {
    args: ['prerelease', '--preid', 'rc', ...BASE]
  });
});

test('an automatic run on a final version stops while RELEASE_PREID is set', () => {
  const { error } = releaseArgs({ preid: 'rc', version: '1.5.0' });
  assert.match(error, /final version.*2\.0\.0-rc\.1/);
});

test('conventional commits decide without a specifier or preid', () => {
  assert.deepEqual(releaseArgs({ version: '2.0.0' }), { args: BASE });
});

test('prerelease takes the preid along', () => {
  assert.deepEqual(
    releaseArgs({
      specifier: 'prerelease',
      preid: 'rc',
      version: '2.0.0-rc.2'
    }),
    { args: ['prerelease', '--preid', 'rc', ...BASE] }
  );
});

test('a dry run', () => {
  assert.deepEqual(
    releaseArgs({ specifier: 'patch', dryRun: true, version: '2.0.0' }),
    {
      args: ['patch', ...BASE, '--dry-run']
    }
  );
});

test('invalid inputs are rejected', () => {
  for (const specifier of ['2.0', 'latest', '2.0.0; rm -rf /', '$(id)']) {
    assert.match(
      releaseArgs({ specifier, version: '2.0.0' }).error,
      /Invalid version/
    );
  }
  assert.match(
    releaseArgs({ preid: 'rc; x', version: '2.0.0-rc.1' }).error,
    /Invalid RELEASE_PREID/
  );
});

test('prereleases go to next, final versions to latest', () => {
  assert.equal(distTag('2.0.0-rc.1'), 'next');
  assert.equal(distTag('2.0.0'), 'latest');
});
