import type { SegmentData } from '../core';
import { step } from './step';

const coordinates = [0, 10, 10, 0, 20, 5, 30, 5];
// Object values with y: null normalize to { x, y: undefined }.
const values = [1, undefined, 2, 2].map((y, valueIndex) => ({
  value: { x: valueIndex, y },
  valueIndex
})) as SegmentData[];

describe('Interpolation', () => {
  describe('step', () => {
    it('leaves a gap at an object hole (#1040)', () => {
      expect(step()(coordinates, values).stringify()).toBe(
        'M0,10M20,5L30,5L30,5'
      );
    });

    it('steps across an object hole with fillHoles', () => {
      expect(step({ fillHoles: true })(coordinates, values).stringify()).toBe(
        'M0,10L20,10L20,5L30,5L30,5'
      );
    });
  });
});
