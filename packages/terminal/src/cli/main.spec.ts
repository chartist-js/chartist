import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

// The built command, as published; `test` depends on `build`.
const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));
const pkg = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
);

function run(
  args: string[],
  options: { input?: string; env?: NodeJS.ProcessEnv } = {}
) {
  const env: NodeJS.ProcessEnv = { ...process.env, ...options.env };
  delete env.FORCE_COLOR;
  delete env.NO_COLOR;
  return spawnSync(process.execPath, [cli, ...args], {
    input: options.input ?? '',
    encoding: 'utf8',
    env: { ...env, ...options.env }
  });
}

const plain = (args: string[], input?: string) => {
  const result = run([...args, '--color', 'none'], { input });
  return { ...result, lines: result.stdout.split('\n') };
};

describe('ct-cli', () => {
  it('draws a line chart from series arguments', () => {
    const { status, stdout } = plain(['line', '1,3,2', '-w', '40', '-h', '10']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/[⠁-⣿]/);
  });

  it('draws two series, the second with a hole', () => {
    const { status, stdout } = plain([
      'line',
      '1,3,2',
      '2,,4',
      '-l',
      'A,B,C',
      '-w',
      '40',
      '-h',
      '10'
    ]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/A +B +C/);
  });

  it('draws a demo of each chart type with titles', () => {
    const { status, stdout } = plain(['demo', '-w', '60', '-h', '12']);
    expect(status).toBe(0);
    expect(stdout).toContain('Line chart');
    expect(stdout).toContain('Bar chart');
    expect(stdout).toContain('Donut chart');
    expect(stdout).toContain('Kiwis');
  });

  it('reads JSON from stdin', () => {
    const { status, stdout } = plain(
      ['pie', '-w', '30', '-h', '12'],
      '{"labels":["A","B"],"series":[3,2]}'
    );
    expect(status).toBe(0);
    expect(stdout).toContain('A');
    expect(stdout).toContain('B');
    expect(stdout).toContain('⣿');
  });

  it('reads CSV with labels and names from a file, with a legend', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'ct-cli-')), 'data.csv');
    writeFileSync(file, ',Mon,Tue\nVisitors,3,5\nSign-ups,1,2\n');
    const { status, stdout } = plain([
      'bar',
      '--data',
      file,
      '-w',
      '40',
      '-h',
      '10'
    ]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/Mon +Tue/);
    expect(stdout).toContain('■ Visitors  ■ Sign-ups');
  });

  it('prints a legend for --names, unless --no-legend', () => {
    const named = plain(['line', '1,2', '2,1', '--names', 'Visitors,Sign-ups']);
    expect(named.stdout).toContain('■ Visitors  ■ Sign-ups');
    const without = plain([
      'line',
      '1,2',
      '2,1',
      '--names',
      'Visitors,Sign-ups',
      '--no-legend'
    ]);
    expect(without.stdout).not.toContain('■');
  });

  it('fits --width and --height', () => {
    const { lines } = plain([
      'bar',
      '3,1,2',
      '--width',
      '40',
      '--height',
      '10'
    ]);
    const chart = lines.filter(Boolean);
    expect(chart.length).toBeLessThanOrEqual(10);
    expect(
      Math.max(...chart.map(line => [...line].length))
    ).toBeLessThanOrEqual(40);
  });

  it('stacks horizontal bars', () => {
    const { stdout } = plain([
      'bar',
      '3,1',
      '2,2',
      '--stack',
      '--horizontal',
      '-l',
      'A,B',
      '-w',
      '40',
      '-h',
      '10'
    ]);
    expect(stdout).toMatch(/A [█▌▐▕▏▎▍▋▊▉]{10,}/);
  });

  it('draws a donut and hides slice labels on request', () => {
    const { stdout } = plain([
      'pie',
      '3,2',
      '-l',
      'Apples,Kiwis',
      '--donut',
      '--no-labels',
      '-w',
      '30',
      '-h',
      '12'
    ]);
    expect(stdout).toContain('⣿');
    expect(stdout).not.toContain('Apples');
  });

  it('writes no escape codes when piped, and colors when asked', () => {
    expect(run(['line', '1,2,3']).stdout).not.toContain('\x1b');
    expect(
      run(['line', '1,2,3'], { env: { FORCE_COLOR: '3' } }).stdout
    ).toContain('\x1b[38;2;');
    expect(run(['line', '1,2,3', '--color', '256']).stdout).toContain(
      '\x1b[38;5;'
    );
    expect(run(['line', '1,2,3', '--color', '16']).stdout).toMatch(
      /\[(3|9)\dm/
    );
  });

  it('takes a palette', () => {
    expect(
      run(['bar', '1,2', '--color', 'truecolor', '--palette', '#00ff00']).stdout
    ).toContain('\x1b[38;2;0;255;0m');
    const bad = run(['bar', '1,2', '--palette', 'green']);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('"green" is not a hex color');
  });

  it('prints HTML, and a standalone page with the stylesheet', () => {
    const html = run(['pie', '3,2,1', '--html']).stdout;
    expect(html).toMatch(/^<pre class="ct-terminal">/);
    expect(html).not.toContain('style=');
    const page = run(['pie', '3,2,1', '--html', '--standalone']).stdout;
    expect(page).toMatch(/^<!doctype html>/);
    expect(page).toContain(
      '.ct-terminal .ct-series-a { color: var(--ct-series-a, #d70206); }'
    );
    expect(page).toContain('<pre class="ct-terminal">');
  });

  it('prints the help and the version', () => {
    const help = run(['--help']);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('Usage: ct-cli');
    const version = run(['--version']);
    expect(version.status).toBe(0);
    expect(version.stdout).toBe(`${pkg.version}\n`);
  });

  it.each([
    [['line', '1,two,3'], '"two" is not a number.'],
    [['scatter', '1,2'], 'Unknown chart type "scatter"'],
    [['line', '1,2', '--wat'], "Unknown option '--wat'"],
    [['line', '1,2', '--width', 'wide'], '--width: "wide" is not a number.'],
    [['line', '1,2', '--color', 'pink'], `--color: "pink" isn't a color mode`],
    [[], 'Give a chart type']
  ])('explains %j with exit code 1', (args, message) => {
    const result = run(args);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(result.stderr).toContain('Usage: ct-cli');
    expect(result.stdout).toBe('');
  });

  it('says data is missing in a terminal without data', () => {
    // A terminal on stdin can't be faked with spawnSync; empty piped input
    // is the same mistake.
    const result = run(['bar']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No data');
  });

  it('stops quietly when the reader goes away', () => {
    const output = execFileSync(
      'sh',
      ['-c', `"${process.execPath}" "${cli}" demo --color none | head -n 3`],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );
    expect(output.split('\n').filter(Boolean)).toHaveLength(1);
    expect(stripVTControlCharacters(output)).toContain('Line chart');
  });
});
