import { SvgPath } from 'chartist';

// chartist@1.5.0 has each of these bugs, so they run against v2 only.
describe('SvgPath corrections (#1491)', () => {
  test('accuracy 0 rounds to integers, false keeps the decimals', () => {
    expect(new SvgPath(false, { accuracy: 0 }).move(0.4, 0.6).stringify()).toBe(
      'M0,1'
    );
    expect(
      new SvgPath(false, { accuracy: false }).move(0.4, 0.6).stringify()
    ).toBe('M0.4,0.6');
  });

  test('join copies the commands and appends at the end', () => {
    const source = new SvgPath().move(0, 0).line(1, 1);
    const joined = SvgPath.join([source]);
    joined.pathElements[1].x = 42;
    expect(source.stringify()).toBe('M0,0L1,1');
    expect(joined.line(5, 5).stringify()).toBe('M0,0L42,1L5,5');
  });

  test('splitByCommand pieces keep the options and append at the end', () => {
    const source = new SvgPath(true, { accuracy: 1 }).parse(
      'M0.12,0L1,1M2,2L3,3'
    );
    const [first, last] = source.splitByCommand('M');
    expect(first.line(4, 4).stringify()).toBe('M0.1,0L1,1L4,4');
    expect(last.stringify()).toBe('M2,2L3,3Z');
    expect(source.stringify()).toBe('M0.1,0L1,1M2,2L3,3Z');
  });

  test('parse reads every command, exponents and implicit repeats', () => {
    expect(
      new SvgPath()
        .parse('M0,0 10,10H5V1e1Q1,2,3,4S5,6,7,8T9,10L1-2')
        .stringify()
    ).toBe('M0,0L10,10H5V10Q1,2,3,4S5,6,7,8T9,10L1,-2');
  });

  test('scale and translate leave an arc rotation and flags alone', () => {
    const arc = () => new SvgPath().move(0, 0).arc(10, 20, 30, 0, 1, 40, 0);
    expect(arc().scale(2, 3).stringify()).toBe('M0,0A20,60,30,0,1,80,0');
    expect(arc().translate(5, 5).stringify()).toBe('M5,5A10,20,30,0,1,45,5');
  });
});
