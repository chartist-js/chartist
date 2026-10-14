/**
 * Shared helpers of the event parity tests: a comparable summary of each
 * 1.x event, taken when the event is emitted.
 */
import { markup } from '../markup';

const LEGACY = new Set(['data', 'optionsChanged', 'draw', 'created']);

export interface Recorded {
  event: string;
  type?: unknown;
  index?: unknown;
  seriesIndex?: unknown;
  fields: string[];
  element?: string;
  details?: string;
}

/** A comparable summary of one event, taken when the event is emitted. */
export function summarize(
  event: string,
  payload: Record<string, unknown>
): Recorded {
  const element = payload.element as { getNode(): Element } | undefined;
  const details =
    payload.type === 'point'
      ? JSON.stringify([payload.value, payload.meta, payload.x, payload.y])
      : payload.type === 'label'
        ? JSON.stringify([
            payload.text,
            payload.x,
            payload.y,
            payload.width,
            payload.height
          ])
        : payload.type === 'slice'
          ? JSON.stringify([
              payload.value,
              payload.totalDataSum,
              payload.meta,
              payload.startAngle,
              payload.endAngle,
              payload.radius,
              payload.center
            ])
          : payload.type === 'bar'
            ? JSON.stringify([
                payload.value,
                payload.meta,
                payload.x1,
                payload.y1,
                payload.x2,
                payload.y2
              ])
            : event === 'data'
              ? JSON.stringify(payload)
              : undefined;
  return {
    event,
    type: payload.type,
    index: payload.index,
    seriesIndex: payload.seriesIndex,
    // Compat adds the 0.x `bounds` to `created` for 0.x plugins; 1.5.0
    // doesn't have it, so it's left out of the comparison.
    fields: Object.keys(payload)
      .filter(key => !(event === 'created' && key === 'bounds'))
      .sort(),
    element: element && markup(element.getNode()),
    details
  };
}

export function record(chart: {
  on(event: '*', listener: (event: string, data: never) => void): unknown;
}) {
  const events: Recorded[] = [];
  chart.on('*', (event: string, payload: Record<string, unknown>) => {
    if (LEGACY.has(event)) {
      events.push(summarize(event, payload));
    }
  });
  return events;
}
