import { createCanvas, toPlainText, trimLines } from './canvas.ts';

describe('canvas', () => {
  it('sets braille dots, 2 × 4 per cell', () => {
    const canvas = createCanvas(2, 1);
    canvas.dot(0, 0, { kind: 'line' });
    canvas.dot(1, 3, { kind: 'line' });
    canvas.dot(2, 0, { kind: 'line' });
    expect(toPlainText(canvas)).toBe('⢁⠁');
  });

  it('clears lower priority dots in a cell and ignores lower ones after', () => {
    const canvas = createCanvas(1, 1);
    canvas.dot(0, 0, { kind: 'area' });
    canvas.dot(1, 0, { kind: 'line' });
    canvas.dot(0, 1, { kind: 'area' });
    expect(toPlainText(canvas)).toBe('⠈');
  });

  it('shows dots or a character, whichever has priority', () => {
    const canvas = createCanvas(2, 1);
    canvas.char(0, 0, '┈', { kind: 'grid' });
    canvas.char(1, 0, '┈', { kind: 'grid' });
    canvas.dot(0, 0, { kind: 'line' });
    canvas.dot(2, 0, { kind: 'area' });
    expect(toPlainText(canvas)).toBe('⠁┈');
  });

  it('gives a braille cell the ink of most of its dots', () => {
    const canvas = createCanvas(1, 1);
    canvas.dot(0, 0, { kind: 'slice', series: 0 });
    canvas.dot(0, 1, { kind: 'slice', series: 1 });
    canvas.dot(0, 2, { kind: 'slice', series: 1 });
    expect(canvas.cellAt(0, 0)?.ink).toEqual({ kind: 'slice', series: 1 });
  });

  it('lets a label replace what is below it', () => {
    const canvas = createCanvas(1, 1);
    canvas.dot(0, 0, { kind: 'point', series: 0 });
    canvas.char(0, 0, 'A', { kind: 'label' });
    expect(canvas.cellAt(0, 0)).toEqual({ char: 'A', ink: { kind: 'label' } });
  });

  it('ignores what falls outside', () => {
    const canvas = createCanvas(1, 1);
    canvas.dot(-1, 0, { kind: 'line' });
    canvas.dot(2, 0, { kind: 'line' });
    canvas.dot(0, 4, { kind: 'line' });
    canvas.char(0, 1, 'x', { kind: 'label' });
    expect(canvas.cellAt(1, 0)).toBeUndefined();
    expect(toPlainText(canvas)).toBe('');
  });
});

describe('trimLines', () => {
  it('drops trailing spaces and empty lines at the end', () => {
    expect(trimLines(['a  ', ' b', '  ', ''])).toBe('a\n b');
  });
});
