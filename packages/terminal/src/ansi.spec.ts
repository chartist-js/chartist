import { stripVTControlCharacters } from 'node:util';
import {
  barChartConfig,
  lineChartConfig,
  node,
  pieChartConfig,
  toScene
} from 'chartist';
import { renderToTerminal } from './ansi.ts';
import { terminalSize } from './draw.ts';

const ESC = '\x1b[';
const bars = toScene(
  barChartConfig({
    labels: ['A', 'B'],
    series: [
      [3, 1],
      [2, 4]
    ]
  }),
  terminalSize(30, 10)
);

describe('renderToTerminal', () => {
  it('colors series with the default series colors in 24-bit', () => {
    const output = renderToTerminal(bars);
    expect(output).toContain(`${ESC}38;2;215;2;6m█`);
    expect(output).toContain(`${ESC}38;2;240;91;79m`);
  });

  it('writes 256-color and 16-color escape codes', () => {
    expect(renderToTerminal(bars, { color: '256' })).toMatch(/\[38;5;\d+m█/);
    // #d70206 is nearest to red (31).
    expect(renderToTerminal(bars, { color: '16' })).toContain(`${ESC}31m█`);
  });

  it('writes plain text without escape codes, with the chart, grid and labels', () => {
    const output = renderToTerminal(
      toScene(
        lineChartConfig({ labels: ['Mon', 'Tue'], series: [[1, 3]] }),
        terminalSize(40, 10)
      ),
      { color: 'none' }
    );
    expect(output).not.toContain('\x1b');
    expect(output).toMatch(/[⠁-⣿]/);
    expect(output).toContain('┈');
    expect(output).toContain('Mon');
    expect(stripVTControlCharacters(renderToTerminal(bars))).toBe(
      renderToTerminal(bars, { color: 'none' })
    );
  });

  it('takes a palette, starting over past its end', () => {
    const output = renderToTerminal(bars, { palette: ['#000000', '#ffffff'] });
    expect(output).toContain(`${ESC}38;2;255;255;255m█`);
    const three = toScene(
      barChartConfig({ labels: ['A'], series: [[1], [2], [3]] }),
      terminalSize(20, 8)
    );
    expect(
      renderToTerminal(three, { palette: ['#000000', '#ffffff'] })
    ).not.toContain('38;2;215;2;6');
    expect(() => renderToTerminal(bars, { palette: ['red'] })).toThrow(
      'not a hex color'
    );
  });

  it('dims the grid and labels', () => {
    const output = renderToTerminal(
      toScene(
        lineChartConfig({ labels: ['Mon'], series: [[1]] }),
        terminalSize(30, 8)
      )
    );
    expect(output).toContain(`${ESC}2m┈`);
    expect(output).toContain(`${ESC}2mMon`);
  });

  it('puts a slice label on its slice color, with readable text', () => {
    const output = renderToTerminal(
      toScene(
        pieChartConfig({ labels: ['A', 'C'], series: [1, 1] }),
        terminalSize(30, 12)
      ),
      { palette: ['#d70206', '#f4c63d'] }
    );
    expect(output).toContain(`${ESC}38;2;255;255;255;48;2;215;2;6mA`);
    expect(output).toContain(`${ESC}38;2;0;0;0;48;2;244;198;61mC`);
  });

  it('leaves out trailing empty cells and lines', () => {
    const scene = node('svg', { width: 80, height: 48 }).append(
      node('text', { x: 0, y: 13.6 }).text('x')
    );
    expect(renderToTerminal(scene)).toBe(`${ESC}2mx${ESC}0m`);
  });
});
