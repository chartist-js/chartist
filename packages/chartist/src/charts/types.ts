import type {
  DataEvent,
  OptionsChangedEvent,
  DrawEvent,
  CreatedEvent
} from '../core';
import type { AnimationEvent } from '../svg';

/** The 1.x events every chart class emits and their payloads, by event name. */
export interface BaseChartEventsTypes<
  TCreateEvent = CreatedEvent,
  TDrawEvents = DrawEvent
> {
  data: DataEvent;
  options: OptionsChangedEvent;
  animationBegin: AnimationEvent;
  animationEnd: AnimationEvent;
  created: TCreateEvent;
  draw: TDrawEvents;
}
