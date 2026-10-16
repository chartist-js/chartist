import { stripVTControlCharacters } from 'node:util';
import { barChart, lineChart, pieChart } from './charts.ts';

const lines = (text: string) => stripVTControlCharacters(text).split('\n');
const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu'],
  series: [
    [12, 9, 7, 8],
    [2, 1, 3.5, 7]
  ]
};

describe('lineChart', () => {
  it('renders in one call, with colors and X labels in the row below the axis', () => {
    const output = lineChart(data, { columns: 60, rows: 15, showArea: true });
    expect(output).toContain('\x1b[38;2;215;2;6m');
    const rows = lines(output);
    expect(rows.length).toBeLessThanOrEqual(15);
    const labelRow = rows.findIndex(row => row.includes('Mon'));
    expect(rows[labelRow]).toMatch(/Mon +Tue +Wed +Thu/);
    expect(rows[labelRow - 1]).toMatch(/^ *0 [┼┈]/);
  });

  it('puts each Y label in the row of its grid line', () => {
    const rows = lines(
      lineChart(data, { columns: 60, rows: 15, color: 'none' })
    );
    const labelled = rows.filter(row => /^ *\d+(\.\d+)? /.test(row));
    expect(labelled.length).toBeGreaterThan(2);
    for (const row of labelled) {
      expect(row).toMatch(/^ *\d+(\.\d+)? [┼┈]/);
    }
  });

  it('fits 80 × 20 cells by default', () => {
    const rows = lines(lineChart(data, { color: 'none' }));
    expect(rows.length).toBeLessThanOrEqual(20);
    expect(Math.max(...rows.map(row => [...row].length))).toBeLessThanOrEqual(
      80
    );
  });

  it('makes room for long values', () => {
    const rows = lines(
      lineChart({ series: [[120000, 90000]] }, { color: 'none', rows: 10 })
    );
    expect(rows.some(row => /^ *1[0-9]{5} [┼┈]/.test(row))).toBe(true);
  });

  it('lets options override the defaults, deeply', () => {
    const rows = lines(
      lineChart(data, {
        color: 'none',
        axisY: {
          offset: 80,
          labelTransform: (value: unknown) => `${value}%`
        }
      })
    );
    const labelled = rows.filter(row => row.includes('%'));
    expect(labelled.length).toBeGreaterThan(2);
    // The labels end before the grid, which starts after 80 px: column 10.
    for (const row of labelled) {
      expect([...row].indexOf('%')).toBe(8);
    }
  });

  it('renders HTML when asked', () => {
    const html = lineChart(data, { format: 'html', columns: 40, rows: 10 });
    expect(html).toMatch(/^<pre class="ct-terminal">/);
    expect(html).not.toContain('\x1b');
  });
});

describe('barChart', () => {
  it('takes the bar options: horizontal and stacked', () => {
    const rows = lines(
      barChart(data, {
        horizontalBars: true,
        stackBars: true,
        color: 'none',
        columns: 60,
        rows: 12
      })
    );
    const monday = rows.find(row => row.trimStart().startsWith('Mon'));
    expect(monday).toMatch(/^ *Mon [█▌▐▕▏▎▍▋▊▉]{10,}/);
  });

  it('centers X labels under their bars', () => {
    const rows = lines(
      barChart(data, { color: 'none', columns: 60, rows: 12 })
    );
    expect(rows.some(row => /^ +Mon +Tue +Wed +Thu$/.test(row))).toBe(true);
    expect(rows.join('\n')).toContain('█');
  });
});

describe('pieChart', () => {
  it('renders a donut with a ring', () => {
    const rows = lines(
      pieChart(
        { labels: ['A', 'B'], series: [3, 2] },
        { donut: true, color: 'none', columns: 30, rows: 12 }
      )
    );
    const middle = rows[Math.floor(rows.length / 2)];
    expect(middle).toMatch(/[⠁-⣿] {4,}[⠁-⣿]/);
  });

  it('puts labels on the slices', () => {
    const output = pieChart(
      { labels: ['A', 'B'], series: [3, 2] },
      { columns: 30, rows: 12 }
    );
    expect(output).toContain('48;2;215;2;6mA');
  });
});
