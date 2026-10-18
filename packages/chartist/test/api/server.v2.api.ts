// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { lineChartConfig, toScene as coreToScene } from 'chartist';
import {
  applyStyles,
  renderForHydration,
  renderToString,
  toScene
} from 'chartist/server';
import {
  BUILDS,
  SERVER_LIST_FILE,
  cjsNames,
  diffNames,
  esmNames,
  readList,
  typeNames,
  umdNames
} from './exports/read.ts';

const SIZE = { width: 600, height: 300 };
const week = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [[12, 9, 7, 8, 5]]
};
const css = readFileSync(path.join(BUILDS.local, 'index.css'), 'utf8');

describe('chartist/server entry', () => {
  test('exports match the recorded list', async () => {
    const list = readList(SERVER_LIST_FILE);
    const none = { listedButNotExported: [], exportedButNotListed: [] };
    expect(diffNames(list.runtime, await esmNames('local', 'server'))).toEqual(
      none
    );
    expect(diffNames(list.runtime, cjsNames('local', 'server'))).toEqual(none);
    expect(diffNames(list.types, typeNames('local', 'server'))).toEqual(none);
  });

  test('toScene is the function of chartist, in ESM and CJS', () => {
    expect(toScene).toBe(coreToScene);
    const require = createRequire(import.meta.url);
    expect(require(path.join(BUILDS.local, 'server.cjs')).toScene).toBe(
      require(path.join(BUILDS.local, 'index.cjs')).toScene
    );
  });

  test('the UMD build adds its exports to the global Chartist', () => {
    const core = umdNames('local');
    const names = umdNames('local', ['index', 'server']);
    expect(names).toEqual(
      expect.arrayContaining(readList(SERVER_LIST_FILE).runtime)
    );
    expect(names.filter(name => !core.includes(name))).toEqual([
      'applyStyles',
      'renderForHydration',
      'renderToString'
    ]);

    // As classic scripts: the server functions work with the core's.
    const context: { Chartist?: any } = {};
    vm.createContext(context);
    for (const file of ['index.umd.js', 'server.umd.js']) {
      vm.runInContext(
        readFileSync(path.join(BUILDS.local, file), 'utf8'),
        context
      );
    }
    const { Chartist } = context;
    const markup = Chartist.renderToString(
      Chartist.applyStyles(
        Chartist.toScene(Chartist.lineChartConfig(week), SIZE),
        css
      )
    );
    expect(markup).toMatch(/^<svg /);
    expect(markup).toContain('stroke="#d70206"');
  });
});

describe('chartist/server (v2)', () => {
  test('renders a line chart without a DOM', () => {
    expect(typeof document).toBe('undefined');
    const svg = renderToString(toScene(lineChartConfig(week), SIZE));
    expect(svg).toContain('width="600" height="300"');
    expect(svg).toContain('class="ct-line"');
  });

  test("applyStyles bakes Chartist's stylesheet into attributes", () => {
    const scene = toScene(lineChartConfig(week), SIZE);
    const before = renderToString(scene);
    const styled = renderToString(applyStyles(scene, css));
    expect(styled).toMatch(/<path class="ct-line" [^>]*stroke="#d70206"/);
    expect(styled).not.toContain('var(');
    expect(styled).not.toContain('light-dark(');
    expect(renderToString(scene)).toBe(before);
    expect(
      renderToString(applyStyles(scene, css, { colorScheme: 'dark' }))
    ).toContain('stroke="rgba(255, 255, 255, 0.2)"');
  });

  test('renderForHydration writes marked markup', () => {
    expect(renderForHydration(lineChartConfig(week), SIZE)).toContain(
      'data-ct-hydrate'
    );
  });
});
