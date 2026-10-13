/**
 * Rewrites chartist.json from the local build. Review the diff: every added
 * or removed name is an API change.
 *
 * Run: pnpm nx run chartist:test:api:update-exports (builds first).
 */
import { writeFileSync } from 'node:fs';
import { esmNames, LIST_FILE, typeNames, type ExportList } from './read.ts';

const list: ExportList = {
  runtime: await esmNames('local'),
  types: typeNames('local')
};
writeFileSync(LIST_FILE, JSON.stringify(list, null, 2) + '\n');
console.log(
  `Wrote ${list.runtime.length} runtime and ${list.types.length} type names to ${LIST_FILE}`
);
