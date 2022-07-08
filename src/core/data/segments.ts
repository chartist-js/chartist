import type { Segment, SegmentData } from '../types';
import { getMultiValue } from './data';

/**
 * Splits a list of coordinates and associated values into segments. Each returned segment contains a pathCoordinates
 * valueData property describing the segment.
 *
 * With the default options, segments consist of contiguous sets of points that do not have an undefined value. Any
 * points with undefined values are discarded.
 *
 * **Options**
 * The following options are used to determine how segments are formed
 * ```javascript
 * var options = {
 *   // If fillHoles is true, undefined values are simply discarded without creating a new segment. Assuming other options are default, this returns single segment.
 *   fillHoles: false,
 *   // If increasingX is true, the coordinates in all segments have strictly increasing x-values.
 *   increasingX: false
 * };
 * ```
 *
 * @param pathCoordinates List of point coordinates to be split in the form [x1, y1, x2, y2 ... xn, yn]
 * @param valueData List of associated point values in the form [v1, v2 .. vn]
 * @param options Options set by user
 * @return List of segments, each containing a pathCoordinates and valueData property.
 */
export function splitIntoSegments(
  pathCoordinates: number[],
  valueData: SegmentData[],
  options?: {
    increasingX?: boolean;
    fillHoles?: boolean;
  }
) {
  const finalOptions = {
    increasingX: false,
    fillHoles: false,
    ...options
  };

  const segments: Segment[] = [];
  let hole = true;

  for (let i = 0; i < pathCoordinates.length; i += 2) {
    // If this value is a "hole" we set the hole flag
    if (getMultiValue(valueData[i / 2].value) === undefined) {
      // if(valueData[i / 2].value === undefined) {
      if (!finalOptions.fillHoles) {
        hole = true;
      }
    } else {
      if (
        finalOptions.increasingX &&
        i >= 2 &&
        pathCoordinates[i] <= pathCoordinates[i - 2]
      ) {
        // X is not increasing, so we need to make sure we start a new segment
        hole = true;
      }

      // If it's a valid value we need to check if we're coming out of a hole and create a new empty segment
      if (hole) {
        segments.push({
          pathCoordinates: [],
          valueData: []
        });
        // As we have a valid value now, we are not in a "hole" anymore
        hole = false;
      }

      // Add to the segment pathCoordinates and valueData
      segments[segments.length - 1].pathCoordinates.push(
        pathCoordinates[i],
        pathCoordinates[i + 1]
      );
      segments[segments.length - 1].valueData.push(valueData[i / 2]);
    }
  }

  return segments;
}
