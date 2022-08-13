import type { SegmentData } from '../core';
import type { easings } from './animation';
import type { Svg } from './Svg';

export interface BasePathParams {
  x: number;
  y: number;
}

export type MoveParams = BasePathParams;

export type LineParams = BasePathParams;

export interface CurveParams extends BasePathParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ArcParams extends BasePathParams {
  rx: number;
  ry: number;
  xAr: number;
  lAf: number;
  sf: number;
}

export type PathParams = MoveParams | LineParams | CurveParams | ArcParams;

export type PathCommand<T extends PathParams = PathParams> = {
  command: string;
  data?: SegmentData;
} & T;

export interface SvgPathOptions {
  accuracy?: number;
}

export type Attributes = Record<string, number | string | undefined | null>;

export interface AnimationDefinition {
  id?: string;
  easing?: number[] | keyof typeof easings;
  calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
  restart?: 'always' | 'whenNotActive' | 'never';
  repeatCount?: number | 'indefinite';
  repeatDur?: string | 'indefinite';
  keySplines?: string;
  keyTimes?: string;
  fill?: string;
  min?: number | string;
  max?: number | string;
  begin?: number | string;
  end?: number | string;
  dur: number | string;
  from: number | string;
  to: number | string;
}

export interface AnimationEvent {
  element: Svg;
  animate: Element;
  params: AnimationDefinition;
}
