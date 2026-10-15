import type { SegmentData } from '../core';
import { simple } from './simple';

const coordinates = [0, 10, 10, 0, 20, 5, 30, 5];
// Object values with y: null normalize to { x, y: undefined }.
const values = [1, undefined, 2, 2].map((y, valueIndex) => ({
  value: { x: valueIndex, y },
  valueIndex
})) as SegmentData[];

describe('Interpolation', () => {
  describe('simple', () => {
    it('leaves a gap at an object hole (#1040)', () => {
      expect(simple()(coordinates, values).stringify()).toBe(
        'M0,10M20,5C25,5,25,5,30,5'
      );
    });

    it('curves across an object hole with fillHoles', () => {
      expect(simple({ fillHoles: true })(coordinates, values).stringify()).toBe(
        'M0,10C10,10,10,5,20,5C25,5,25,5,30,5'
      );
    });
  });
});
