import { contrast, detectColorMode, parseHex, to16, to256 } from './color.ts';

const tty = { isTTY: true };
const pipe = { isTTY: false };

describe('detectColorMode', () => {
  it('uses no colors for pipes, NO_COLOR and dumb terminals', () => {
    expect(detectColorMode(pipe, {})).toBe('none');
    expect(detectColorMode({}, {})).toBe('none');
    expect(detectColorMode(tty, { NO_COLOR: '1' })).toBe('none');
    expect(detectColorMode(tty, { TERM: 'dumb' })).toBe('none');
  });

  it('follows FORCE_COLOR over everything else', () => {
    expect(detectColorMode(pipe, { FORCE_COLOR: '0' })).toBe('none');
    expect(detectColorMode(pipe, { FORCE_COLOR: '1' })).toBe('16');
    expect(detectColorMode(pipe, { FORCE_COLOR: '2' })).toBe('256');
    expect(detectColorMode(pipe, { FORCE_COLOR: '3' })).toBe('truecolor');
    expect(detectColorMode(pipe, { FORCE_COLOR: '' })).toBe('16');
    expect(detectColorMode(tty, { FORCE_COLOR: 'false' })).toBe('none');
    expect(detectColorMode(tty, { FORCE_COLOR: '2', NO_COLOR: '1' })).toBe(
      '256'
    );
  });

  it('ignores a FORCE_COLOR it does not understand', () => {
    expect(detectColorMode(tty, { FORCE_COLOR: 'yes please' })).toBe('256');
  });

  it('uses 24-bit colors when COLORTERM says so, else 256', () => {
    expect(detectColorMode(tty, { COLORTERM: 'truecolor' })).toBe('truecolor');
    expect(detectColorMode(tty, { COLORTERM: '24bit' })).toBe('truecolor');
    expect(detectColorMode(tty, { TERM: 'xterm-256color' })).toBe('256');
  });
});

describe('colors', () => {
  it('parses hex colors', () => {
    expect(parseHex('#f4c63d')).toEqual([244, 198, 61]);
    expect(parseHex('#FFF')).toEqual([255, 255, 255]);
    expect(() => parseHex('red')).toThrow('not a hex color');
  });

  it('maps to the 256-color cube and the 16 standard colors', () => {
    expect(to256([0, 0, 0])).toBe(16);
    expect(to256([255, 255, 255])).toBe(231);
    expect(to256([255, 0, 0])).toBe(196);
    expect(to16([215, 2, 6])).toBe(1);
    expect(to16([5, 68, 211])).toBe(4);
    expect(to16([69, 61, 63])).toBe(8);
  });

  it('picks readable text on a background', () => {
    expect(contrast([244, 198, 61])).toEqual([0, 0, 0]);
    expect(contrast([215, 2, 6])).toEqual([255, 255, 255]);
  });
});
