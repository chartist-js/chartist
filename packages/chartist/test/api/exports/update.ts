/**
 * Rewrites chartist.json, compat.json, live.json and experimental.json from
 * the local build. Review the diff: every added or removed name is an API
 * change, and every name marked or unmarked experimental a promise about it.
 *
 * Run: pnpm nx run chartist:test:api:update-exports (builds first).
 */
import { writeFileSync } from 'node:fs';
import {
  COMPAT_LIST_FILE,
  esmNames,
  EXPERIMENTAL_FILE,
  experimentalNames,
  LIST_FILE,
  LIVE_LIST_FILE,
  typeNames,
  type ExportList
} from './read.ts';

const list: ExportList = {
  runtime: await esmNames('local'),
  types: typeNames('local')
};
writeFileSync(LIST_FILE, JSON.stringify(list, null, 2) + '\n');
console.log(
  `Wrote ${list.runtime.length} runtime and ${list.types.length} type names to ${LIST_FILE}`
);

const compatList: ExportList = {
  runtime: await esmNames('local', 'compat'),
  types: typeNames('local', 'compat')
};
writeFileSync(COMPAT_LIST_FILE, JSON.stringify(compatList, null, 2) + '\n');
console.log(`Wrote the chartist/compat names to ${COMPAT_LIST_FILE}`);

const liveList: ExportList = {
  runtime: await esmNames('local', 'live'),
  types: typeNames('local', 'live')
};
writeFileSync(LIVE_LIST_FILE, JSON.stringify(liveList, null, 2) + '\n');
console.log(`Wrote the chartist/live names to ${LIVE_LIST_FILE}`);

const experimental = {
  $comment:
    'The exports each entry marks @experimental: they may still change in a 2.x minor. Every other export is stable. The rule: openspec/specs/public-api/spec.md.',
  chartist: experimentalNames('local', 'index.d.ts'),
  compat: experimentalNames('local', 'compat.d.ts'),
  live: experimentalNames('local', 'live.d.ts')
};
writeFileSync(EXPERIMENTAL_FILE, JSON.stringify(experimental, null, 2) + '\n');
console.log(`Wrote the experimental names to ${EXPERIMENTAL_FILE}`);
