import { keySplinesOf, sampleEasing } from './animation';
import { Svg } from './Svg';

describe('keySplinesOf', () => {
  it('gives the keySplines of easings SMIL can express', () => {
    expect(keySplinesOf('ease-out')).toBe('0 0 0.58 1');
    expect(keySplinesOf('linear')).toBe('0 0 1 1');
    expect(keySplinesOf('cubic-bezier(0.3, 0, 0.2, 1)')).toBe('0.3 0 0.2 1');
    expect(keySplinesOf('easeOutQuart')).toBe('0.165 0.84 0.44 1');
    expect(keySplinesOf([0.1, 0.2, 0.3, 0.4])).toBe('0.1 0.2 0.3 0.4');
  });

  it('gives nothing for easings outside 0 to 1 or without a curve', () => {
    expect(keySplinesOf('easeOutBack')).toBeUndefined();
    expect(keySplinesOf('cubic-bezier(0.34, 1.56, 0.64, 1)')).toBeUndefined();
    expect(keySplinesOf('steps(4)')).toBeUndefined();
    expect(keySplinesOf('linear(0, 0.5 20%, 1)')).toBeUndefined();
  });
});

describe('sampleEasing', () => {
  it('samples 12 points from 0 to 1 by default', () => {
    const points = sampleEasing('ease', 400);
    expect(points).toHaveLength(12);
    expect(points[0]).toBe(0);
    expect(points[11]).toBe(1);
    expect(points.every((point, i) => i === 0 || point >= points[i - 1])).toBe(
      true
    );
  });

  it('samples one point per 50 ms above 600 ms, at most 40', () => {
    expect(sampleEasing('ease', 1000)).toHaveLength(20);
    expect(sampleEasing('ease', 5000)).toHaveLength(40);
  });

  it('goes above 1 for easings that overshoot', () => {
    const points = sampleEasing('cubic-bezier(0.34, 1.56, 0.64, 1)', 400);
    expect(Math.max(...points)).toBeGreaterThan(1);
    expect(points[11]).toBe(1);
    expect(Math.max(...sampleEasing('easeOutBack', 400))).toBeGreaterThan(1);
  });

  it('samples steps', () => {
    const points = sampleEasing('steps(4)', 400);
    expect(points.every(point => [0, 0.25, 0.5, 0.75, 1].includes(point))).toBe(
      true
    );
  });

  it('samples linear() stops', () => {
    const points = sampleEasing('linear(0, 0.8 25%, 1)', 400);
    // A quarter of the time is between point 2 (0.18) and 3 (0.27).
    expect(points[3]).toBeGreaterThan(0.8);
    expect(points[3]).toBeLessThan(0.85);
  });

  it("samples a curve it doesn't know as ease", () => {
    expect(sampleEasing('bouncy', 400)).toEqual(sampleEasing('ease', 400));
  });
});

describe('Svg#animate easings', () => {
  const point = () => new Svg('line', { y1: 0 });

  it('keeps the keySplines of easings within 0 to 1, as 1.x', () => {
    const element = point();
    element.animate(
      { y1: { dur: 600, from: 0, to: 100, easing: 'easeOutQuart' } },
      false
    );
    const animate = element.getNode().querySelector('animate')!;
    expect(animate.getAttribute('calcMode')).toBe('spline');
    expect(animate.getAttribute('keySplines')).toBe('0.165 0.84 0.44 1');
    expect(animate.getAttribute('values')).toBeNull();
  });

  it('writes sampled values for easings that overshoot', () => {
    const element = point();
    element.animate(
      { y1: { dur: 600, from: 0, to: 100, easing: 'easeOutBack' } },
      false
    );
    const animate = element.getNode().querySelector('animate')!;
    const values = animate.getAttribute('values')!.split(';').map(Number);
    expect(animate.getAttribute('calcMode')).toBe('linear');
    expect(animate.getAttribute('keySplines')).toBeNull();
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(100);
    expect(Math.max(...values)).toBeGreaterThan(100);
    expect(animate.getAttribute('keyTimes')!.split(';')).toHaveLength(
      values.length
    );
  });

  it('takes CSS easing strings', () => {
    const element = point();
    element.animate(
      {
        y1: { dur: 400, from: '0px', to: '40px', easing: 'ease-out' },
        y2: {
          dur: 400,
          from: '0px',
          to: '40px',
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }
      },
      false
    );
    const [first, second] = Array.from(
      element.getNode().querySelectorAll('animate')
    );
    expect(first.getAttribute('keySplines')).toBe('0 0 0.58 1');
    expect(second.getAttribute('values')).toMatch(/^0px;.*;40px$/);
  });

  it('writes steps as discrete values', () => {
    const element = point();
    element.animate(
      { y1: { dur: 400, from: 0, to: 100, easing: 'steps(4)' } },
      false
    );
    const animate = element.getNode().querySelector('animate')!;
    expect(animate.getAttribute('calcMode')).toBe('discrete');
  });
});
