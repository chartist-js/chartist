import type { SegmentData } from '../core';
import type { easings } from './animation';
import type { Svg } from './Svg';

/** The end point every path command has. */
export interface BasePathParams {
  /** The x of the command's end point. */
  x: number;
  /** The y of the command's end point. */
  y: number;
}

/** The parameters of a move command (`M`): the point to move to. */
export type MoveParams = BasePathParams;

/** The parameters of a line command (`L`): the point to draw to. */
export type LineParams = BasePathParams;

/** The parameters of a cubic Bézier curve command (`C`). */
export interface CurveParams extends BasePathParams {
  /** The x of the first control point. */
  x1: number;
  /** The y of the first control point. */
  y1: number;
  /** The x of the second control point. */
  x2: number;
  /** The y of the second control point. */
  y2: number;
}

/** The parameters of an elliptical arc command (`A`), as in SVG. */
export interface ArcParams extends BasePathParams {
  /** The x radius of the ellipse. */
  rx: number;
  /** The y radius of the ellipse. */
  ry: number;
  /** The rotation of the ellipse's x axis, in degrees. */
  xAr: number;
  /** The large arc flag: `1` takes the longer way around, `0` the shorter. */
  lAf: number;
  /** The sweep flag: `1` draws the arc clockwise, `0` counterclockwise. */
  sf: number;
}

/** The parameters of any path command. */
export type PathParams = MoveParams | LineParams | CurveParams | ArcParams;

/** A command of an {@link SvgPath}: its letter, its parameters and the data of its point. */
export type PathCommand<T extends PathParams = PathParams> = {
  /** The command letter: `M`, `L`, `C` or `A`, or from a parsed path also `H`, `V`, `S`, `Q`, `T` or `Z` (lowercase when relative). */
  command: string;
  /** The value of the chart point the command draws to, if any. */
  data?: SegmentData;
} & T;

/** The options of an {@link SvgPath}. */
export interface SvgPathOptions {
  /**
   * The decimals numbers are rounded to when the path is stringified: `0`
   * rounds to integers, `false` doesn't round.
   */
  accuracy?: number | false;
}

/**
 * SVG attributes by name, for {@link Svg.attr}. `undefined` values are
 * skipped; names with a prefix such as `ct:value` use its namespace.
 */
export type Attributes = Record<string, number | string | undefined | null>;

/**
 * One SMIL animation of an attribute, for {@link Svg.animate}: the
 * attributes of its `<animate>` element, plus an `easing`.
 */
export interface AnimationDefinition {
  /** The `id` of the `<animate>` element, to start other animations relative to it. */
  id?: string;
  /**
   * The easing: a name from {@link easings} or four numbers of a cubic
   * Bézier curve. Sets `calcMode`, `keySplines` and `keyTimes` for you.
   */
  easing?: number[] | keyof typeof easings;
  /** How values are interpolated (SMIL `calcMode`); an `easing` sets `'spline'`. */
  calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
  /** Whether the animation can restart while it's running (SMIL `restart`). */
  restart?: 'always' | 'whenNotActive' | 'never';
  /** How many times the animation repeats, or `'indefinite'`. */
  repeatCount?: number | 'indefinite';
  /** How long the animation repeats in total, or `'indefinite'`. */
  repeatDur?: string | 'indefinite';
  /** The Bézier control points of a `'spline'` animation (SMIL `keySplines`); an `easing` sets them. */
  keySplines?: string;
  /** The times of the key values, from `0` to `1` (SMIL `keyTimes`); an `easing` sets them. */
  keyTimes?: string;
  /** `'freeze'` keeps the last value after the animation, `'remove'` resets it. Guided mode sets `'freeze'`. */
  fill?: string;
  /** The minimum active duration (SMIL `min`). */
  min?: number | string;
  /** The maximum active duration (SMIL `max`). */
  max?: number | string;
  /** When the animation starts: ms as a number, or a SMIL time such as `'1s'`. */
  begin?: number | string;
  /** When the animation ends (SMIL `end`). */
  end?: number | string;
  /** How long the animation runs: ms as a number, or a SMIL time such as `'2s'`. */
  dur: number | string;
  /** The value the attribute starts at. */
  from: number | string;
  /** The value the attribute ends at. */
  to: number | string;
}

/**
 * The payload of the `animationBegin` and `animationEnd` events that
 * {@link Svg.animate} emits when it gets an event emitter.
 */
export interface AnimationEvent {
  /** The animated element. */
  element: Svg;
  /** The `<animate>` element. */
  animate: Element;
  /** The animation's definition, as given. */
  params: AnimationDefinition;
}
