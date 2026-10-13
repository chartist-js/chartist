import { estimateText } from './measure';

describe('render/measure', () => {
  it('estimates 0.6 em per glyph and 1.2 em per line, 12 px by default', () => {
    expect(estimateText('abcde')).toEqual({
      width: 36,
      height: 14.399999999999999,
      fontSize: 12
    });
    expect(estimateText('ab', { fontSize: 10 })).toEqual({
      width: 12,
      height: 12,
      fontSize: 10
    });
  });
});
