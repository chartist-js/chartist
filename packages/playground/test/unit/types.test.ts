import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { LIBS } from '../../src/types/libs.ts';
import { createProject } from '../../src/types/service.ts';

const dist = new URL('../../../chartist/dist/', import.meta.url);
const declarations = {
  index: await readFile(new URL('index.d.ts', dist), 'utf8'),
  compat: await readFile(new URL('compat.d.ts', dist), 'utf8')
};
const registry = ts.createDocumentRegistry();

const project = (
  main: string,
  more: Record<string, string> = {},
  options: { typed?: boolean } = {}
) => {
  const result = createProject({
    ts,
    libs: LIBS,
    declarations: options.typed === false ? {} : declarations,
    untyped: ['match-container'],
    registry
  });
  result.update({
    'index.html': '<div id="chart"></div>',
    'src/main.ts': main,
    ...more
  });
  return result;
};

/** The offset of `marker` in `source`, plus `shift`. */
const at = (source: string, marker: string, shift = marker.length) =>
  source.indexOf(marker) + shift;

describe('type service', () => {
  test('the bundled libs reference only bundled libs', () => {
    for (const [name, content] of Object.entries(LIBS)) {
      for (const [, lib] of content.matchAll(/reference lib="([^"]+)"/g)) {
        expect(LIBS, `${name} references ${lib}`).toHaveProperty([
          `lib.${lib}.d.ts`
        ]);
      }
    }
  });

  test('a working example has no diagnostics', () => {
    const main = `import 'chartist/styles.css';
import './style.css';
import 'match-container';
import { lineChart, type ChartPlugin } from 'chartist';
import { compat } from 'chartist/compat';

const marker: ChartPlugin = {
  name: 'marker',
  install(chart) {
    chart.on('compose', node => {
      if (node.role !== 'point') {
        return;
      }
      return node.attr({ x2: node.ctx.x + 1 });
    });
  }
};

const chart = lineChart('#chart', { series: [[1, 2, 3]] }, { plugins: [marker, compat] });
chart.on('draw', data => console.log(data.type, document.title));
`;
    expect(project(main).diagnostics('src/main.ts')).toEqual([]);
  });

  test('a misspelled event is an error at the name', () => {
    const main = `import { lineChart } from 'chartist';
lineChart('#chart', { series: [[1]] }).on('compsoe', () => undefined);
`;
    const [diagnostic] = project(main).diagnostics('src/main.ts');
    expect(diagnostic.severity).toBe('error');
    expect(main.slice(diagnostic.from, diagnostic.to)).toBe("'compsoe'");
  });

  test('errors in an imported file show in the importing file', () => {
    const main = `import { double } from './double.ts';
double('two');
`;
    const diagnostics = project(main, {
      'src/double.ts': 'export const double = (n: number) => n * 2;\n'
    }).diagnostics('src/main.ts');
    expect(diagnostics.map(d => main.slice(d.from, d.to))).toEqual(["'two'"]);
  });

  test('completions after a role check list the context fields', () => {
    const main = `import { lineChart } from 'chartist';
lineChart('#chart', { series: [[1]] }).on('compose', node => {
  if (node.role === 'point') {
    node.ctx.
  }
});
`;
    const result = project(main).completions(
      'src/main.ts',
      at(main, 'node.ctx.'),
      '.'
    );
    expect(result?.entries.map(entry => entry.name)).toEqual(
      expect.arrayContaining(['x', 'y', 'valueIndex', 'seriesIndex'])
    );
    expect(result?.entries.map(entry => entry.name)).not.toContain('path');
  });

  test('event names complete inside the string', () => {
    const main = `import { lineChart } from 'chartist';
lineChart('#chart', { series: [[1]] }).on('');
`;
    const result = project(main).completions(
      'src/main.ts',
      at(main, ".on('"),
      "'"
    );
    expect(result?.entries.map(entry => entry.name)).toEqual(
      expect.arrayContaining(['compose', 'mount', 'render'])
    );
  });

  test('details and quick info carry signatures and doc comments', () => {
    const main = `import { lineChart } from 'chartist';
lineChart('#chart', { series: [[1]] });
`;
    const service = project(main);
    const info = service.quickInfo('src/main.ts', at(main, 'lineChart(', 2));
    expect(info?.signature).toMatch(/lineChart\(target: string \| Element/);
    expect(info?.documentation).not.toBe('');
    expect(main.slice(info!.from, info!.to)).toBe('lineChart');

    const completions = service.completions(
      'src/main.ts',
      at(main, 'lineChart', 4)
    );
    const entry = completions?.entries.find(e => e.name === 'lineChart');
    expect(entry).toBeDefined();
    const details = service.completionDetails(
      'src/main.ts',
      at(main, 'lineChart', 4),
      entry!
    );
    expect(details?.signature).toContain('lineChart(');
  });

  test('without declarations, chartist is untyped and nothing else breaks', () => {
    const main = `import { lineChart } from 'chartist';
lineChart('#chart', { series: [[1]] }).on('anything', () => undefined);
const n: number = 'x';
`;
    const diagnostics = project(main, {}, { typed: false }).diagnostics(
      'src/main.ts'
    );
    expect(diagnostics.map(d => main.slice(d.from, d.to))).toEqual(['n']);
  });

  test('updates replace and remove files', () => {
    const service = project(`import { a } from './a.ts';\nconsole.log(a);\n`, {
      'src/a.ts': 'export const a = 1;\n'
    });
    expect(service.diagnostics('src/main.ts')).toEqual([]);
    service.update({
      'src/main.ts': `import { a } from './a.ts';\nconsole.log(a);\n`
    });
    expect(service.diagnostics('src/main.ts')).toHaveLength(1);
  });
});
