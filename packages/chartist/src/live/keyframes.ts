/**
 * The keyframes `smilAnimations()` brings for the built-in nodes that
 * don't move well number by number: lines, areas and bands whose values
 * change their keys or count, and pie slices and their labels.
 */
import {
  polarToCartesian,
  SvgPath,
  type CurveParams,
  type Keyframes,
  type LineInterpolation,
  type PathCommand,
  type SceneNode,
  type SegmentData
} from '../index';
import type { LiveAnimationContext } from './types';

interface Point {
  readonly x: number;
  readonly y: number;
}

/** A point of a path through values, with the data of its value. */
interface Vertex extends Point {
  readonly data: SegmentData;
}

/**
 * A line, area or band read back into its values: one edge for lines and
 * areas, the upper and the lower edge for bands, each by value index.
 */
interface Outline {
  readonly edges: readonly (readonly Vertex[])[];
  /** The area's baseline, in px. */
  readonly base: number;
  readonly smoothing: LineInterpolation;
}

type PathNode = Extract<SceneNode, { role: 'line' | 'area' | 'band' }>;

const lerp = (from: number, to: number, progress: number) =>
  (1 - progress) * from + progress * to;

const between = (from: Point, to: Point, progress: number): Point => ({
  x: lerp(from.x, to.x, progress),
  y: lerp(from.y, to.y, progress)
});

/**
 * The vertices of a path: one per run of commands that share their
 * value's data. A step line draws a corner and the point with the same
 * data, so the point is the first or the last command of its run.
 */
function verticesOf(commands: readonly PathCommand[], last: boolean): Vertex[] {
  const vertices: Vertex[] = [];
  let previous: SegmentData | undefined;
  for (const { x, y, data } of commands) {
    if (data && data !== previous) {
      vertices.push({ x, y, data });
    } else if (data && last) {
      vertices[vertices.length - 1] = { x, y, data };
    }
    previous = data;
  }
  return vertices;
}

/**
 * Draws a path through points with the interpolation the layer used, a
 * hole between values whose indexes aren't next to each other.
 */
function draw(
  smoothing: LineInterpolation,
  vertices: readonly Vertex[],
  points: readonly Point[]
): SvgPath {
  const coordinates: number[] = [];
  const data: SegmentData[] = [];
  vertices.forEach((vertex, index) => {
    const valueIndex = vertex.data.valueIndex;
    if (index && valueIndex - vertices[index - 1].data.valueIndex > 1) {
      coordinates.push(0, 0);
      data.push({ value: undefined, valueIndex: valueIndex - 1 });
    }
    coordinates.push(points[index].x, points[index].y);
    data.push(vertex.data);
  });
  return smoothing(coordinates, data);
}

/** Draws an outline as the line, area and band layers do. */
function drawOutline(
  role: PathNode['role'],
  { edges, smoothing }: Outline,
  points: readonly (readonly Point[])[],
  base: number
): string {
  const [first, second] = edges.map((edge, index) =>
    draw(smoothing, edge, points[index])
  );
  const commands = first.pathElements;
  const start = commands[0];
  const end = commands[commands.length - 1];
  if (role === 'area') {
    return first
      .clone(true)
      .position(0)
      .remove(1)
      .move(start.x, base)
      .line(start.x, start.y, false, start.data)
      .position(commands.length + 1)
      .line(end.x, base)
      .stringify();
  }
  if (role === 'band') {
    // The lower edge traced backward, from its end to its start.
    const lower = second.pathElements;
    const last = lower[lower.length - 1];
    const back = new SvgPath().line(last.x, last.y, false, last.data);
    for (let index = lower.length - 1; index > 0; index--) {
      const command = lower[index] as PathCommand<CurveParams>;
      const target = lower[index - 1];
      if (command.command === 'C') {
        back.curve(
          command.x2,
          command.y2,
          command.x1,
          command.y1,
          target.x,
          target.y,
          false,
          target.data
        );
      } else {
        back.line(target.x, target.y, false, target.data);
      }
    }
    return SvgPath.join([first, back], true).stringify();
  }
  return first.stringify();
}

/**
 * Reads a line, area or band back into its values, when drawing them
 * again gives the node's `d`: nothing for paths a listener changed or an
 * interpolation that can't be read back.
 */
function outlineOf(node: PathNode): Outline | undefined {
  const { path, smoothing } = node.ctx;
  const commands = path.pathElements;
  for (const last of [false, true]) {
    const vertices = verticesOf(
      node.role === 'area' ? commands.slice(1, -1) : commands,
      last
    );
    const half = vertices.length / 2;
    const outline: Outline = {
      edges:
        node.role !== 'band'
          ? [vertices]
          : Number.isInteger(half)
            ? [vertices.slice(0, half), vertices.slice(half).reverse()]
            : [],
      base: commands[0]?.y ?? 0,
      smoothing
    };
    if (
      outline.edges.length &&
      outline.edges.every(edge => edge.length) &&
      drawOutline(node.role, outline, outline.edges, outline.base) ===
        String(node.attrs.d)
    ) {
      return outline;
    }
  }
  return undefined;
}

/** The series a node's values belong to; for a band, the one it follows. */
function seriesIndexOf(node: PathNode): number {
  if (node.role !== 'band') {
    return node.ctx.seriesIndex;
  }
  const edge = node.ctx.high ?? node.ctx.low;
  return edge && 'seriesIndex' in edge
    ? edge.seriesIndex
    : (node.ctx.series?.[0] ?? 0);
}

/** The value keys of each edge, a repeated key numbered in its order. */
function keysOf(
  node: PathNode,
  { edges }: Outline,
  context: LiveAnimationContext,
  scene: 'previous' | 'next'
): string[][] {
  const seriesIndex = seriesIndexOf(node);
  return edges.map(edge => {
    const seen = new Map<string, number>();
    return edge.map(({ data }) => {
      const key = context.valueKey(
        {
          seriesIndex,
          valueIndex: data.valueIndex,
          value: data.value,
          meta: data.meta
        },
        scene
      );
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      return count > 1 ? `${key}#${count}` : key;
    });
  });
}

/**
 * Keeps the direction of X between neighbors as in the new path, so
 * interpolations that break the line where X turns back (monotone cubic)
 * draw every frame with the new path's commands.
 */
function keepDirection(points: Point[], edge: readonly Vertex[]): Point[] {
  for (let index = 1; index < points.length; index++) {
    const direction = Math.sign(edge[index].x - edge[index - 1].x);
    const previous = points[index - 1].x;
    if (Math.sign(points[index].x - previous) !== direction) {
      points[index] = { x: previous + direction / 1000, y: points[index].y };
    }
  }
  return points;
}

/**
 * Lines, areas and bands whose values changed keys or count: each value
 * starts where its key was, a new one where its nearest kept neighbor was
 * (the one before it, if any), and every frame is drawn through the
 * layer's interpolation.
 */
function pathKeyframes(
  previous: PathNode,
  next: PathNode,
  progress: readonly number[],
  context: LiveAnimationContext
): Keyframes | undefined {
  const from = outlineOf(previous);
  const to = outlineOf(next);
  if (!from || !to || from.edges.length !== to.edges.length) {
    return undefined;
  }
  let fromKeys: string[][];
  let toKeys: string[][];
  try {
    fromKeys = keysOf(previous, from, context, 'previous');
    toKeys = keysOf(next, to, context, 'next');
  } catch {
    // A key function that can't key these values.
    return undefined;
  }
  if (fromKeys.join('\n') === toKeys.join('\n')) {
    return undefined;
  }

  const starts: Point[][] = [];
  for (const [edgeIndex, keys] of toKeys.entries()) {
    const positions = new Map(
      fromKeys[edgeIndex].map((key, index) => [
        key,
        from.edges[edgeIndex][index]
      ])
    );
    const kept = keys.map(key => positions.get(key));
    const edgeStarts: Point[] = [];
    for (let index = 0; index < keys.length; index++) {
      let start: Point | undefined;
      for (let before = index; before >= 0 && !start; before--) {
        start = kept[before];
      }
      for (let after = index + 1; after < keys.length && !start; after++) {
        start = kept[after];
      }
      if (!start) {
        return undefined;
      }
      edgeStarts.push(start);
    }
    starts.push(edgeStarts);
  }

  return progress.map(at => ({
    d: drawOutline(
      next.role,
      to,
      to.edges.map((edge, edgeIndex) =>
        keepDirection(
          edge.map((vertex, index) =>
            between(starts[edgeIndex][index], vertex, at)
          ),
          edge
        )
      ),
      lerp(from.base, to.base, at)
    )
  }));
}

/** The angle of a point around a center, in degrees clockwise from the top. */
const angleOf = (center: Point, point: Point) =>
  (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI + 90;

type SliceNode = Extract<SceneNode, { role: 'slice' }>;

/**
 * A slice at interpolated angles, center and radius, drawn in the pie
 * layer's command layout: from its end around to its start, to the center
 * for a pie. The slice's overlap with the one before it is read from its
 * path.
 */
function sliceKeyframes(
  previous: SliceNode,
  next: SliceNode,
  progress: readonly number[]
): Keyframes {
  const { center, radius, startAngle, endAngle, path } = next.ctx;
  const pie = String(next.attrs.d).endsWith('Z');
  const commands = path.pathElements;
  const delta =
    startAngle - angleOf(center, commands[commands.length - 1 - +pie]);
  const overlap = (((delta % 360) + 540) % 360) - 180;
  return progress.map(at => {
    const middle = between(previous.ctx.center, center, at);
    const r = lerp(previous.ctx.radius, radius, at);
    const start = lerp(previous.ctx.startAngle, startAngle, at);
    const end = lerp(previous.ctx.endAngle, endAngle, at);
    const overlappingStart = Math.max(0, start - overlap);
    const fullCircle = end - start >= 359.99;
    const arcEnd = Math.min(end, overlappingStart + 359.99);
    const from = polarToCartesian(middle.x, middle.y, r, overlappingStart);
    const frame = new SvgPath(pie);
    if (fullCircle) {
      const opposite = polarToCartesian(
        middle.x,
        middle.y,
        r,
        overlappingStart + 180
      );
      frame.move(from.x, from.y).arc(r, r, 0, 0, 0, opposite.x, opposite.y);
    } else {
      const to = polarToCartesian(middle.x, middle.y, r, arcEnd);
      frame.move(to.x, to.y);
    }
    frame.arc(
      r,
      r,
      0,
      Number(!fullCircle && end - start > 180),
      0,
      from.x,
      from.y
    );
    if (pie) {
      frame.line(middle.x, middle.y);
    }
    return { d: frame.stringify() };
  });
}

/** The slice with the label's key, in a scene. */
function sliceOf(
  scene: SceneNode,
  key: string | undefined
): SliceNode | undefined {
  if (scene.role === 'slice' && scene.key === key) {
    return scene;
  }
  for (const child of scene.children) {
    const slice = sliceOf(child, key);
    if (slice) {
      return slice;
    }
  }
  return undefined;
}

type LabelNode = Extract<SceneNode, { role: 'label' }>;

/**
 * A pie label moving around the pie with its slice: at the interpolated
 * middle angle of the slice, its distance from the center interpolated,
 * and a label moved away from that spot (to keep labels apart) moved by
 * as much.
 */
function labelKeyframes(
  previous: LabelNode,
  next: LabelNode,
  progress: readonly number[],
  context: LiveAnimationContext
): Keyframes | undefined {
  const fromSlice = sliceOf(context.update.previousScene, previous.key);
  const toSlice = sliceOf(context.scene, next.key);
  if (
    !fromSlice ||
    !toSlice ||
    previous.ctx.kind !== 'pie' ||
    next.ctx.kind !== 'pie'
  ) {
    return undefined;
  }
  const place = ({ ctx }: SliceNode, label: Point) => {
    const angle = (ctx.startAngle + ctx.endAngle) / 2;
    const radius = Math.hypot(label.x - ctx.center.x, label.y - ctx.center.y);
    const spot = polarToCartesian(ctx.center.x, ctx.center.y, radius, angle);
    return {
      angle,
      radius,
      center: ctx.center,
      shift: { x: label.x - spot.x, y: label.y - spot.y }
    };
  };
  const from = place(fromSlice, previous.ctx);
  const to = place(toSlice, next.ctx);
  return progress.map(at => {
    const center = between(from.center, to.center, at);
    const shift = between(from.shift, to.shift, at);
    const spot = polarToCartesian(
      center.x,
      center.y,
      lerp(from.radius, to.radius, at),
      lerp(from.angle, to.angle, at)
    );
    const frame: Record<string, number> = {};
    for (const name of ['x', 'y', 'dx', 'dy'] as const) {
      const value = next.attrs[name as keyof typeof next.attrs];
      if (typeof value === 'number') {
        const axis = name.endsWith('x') ? 'x' : 'y';
        frame[name] = value + spot[axis] + shift[axis] - next.ctx[axis];
      }
    }
    return frame;
  });
}

/**
 * The built-in keyframes of an updated node, or nothing when it moves
 * well number by number.
 */
export function builtInKeyframes(
  previous: SceneNode,
  next: SceneNode,
  progress: readonly number[],
  context: LiveAnimationContext
): Keyframes | undefined {
  if (previous.role !== next.role) {
    return undefined;
  }
  switch (next.role) {
    case 'line':
    case 'area':
    case 'band':
      return pathKeyframes(previous as PathNode, next, progress, context);
    case 'slice':
      return sliceKeyframes(previous as SliceNode, next, progress);
    case 'label':
      return labelKeyframes(previous as LabelNode, next, progress, context);
    default:
      return undefined;
  }
}
