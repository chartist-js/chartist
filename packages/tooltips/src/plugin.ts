import type {
  ChartHandle,
  ChartPlugin,
  NodeRole,
  SceneNode,
  UpdateAnimation
} from 'chartist';
import {
  accessibleName,
  contentText,
  fillText,
  textOf,
  type Text
} from './content.ts';
import { KEYS, groupBySeries, step } from './keyboard.ts';
import { place } from './place.ts';
import type {
  DefaultTooltipRole,
  TooltipData,
  TooltipItem,
  TooltipsOptions
} from './types.ts';

/** A value with a tooltip in the current render. */
interface Entry {
  /** Role, series and value index: the same value across renders. */
  readonly key: string;
  readonly item: TooltipItem;
  readonly ctx: Readonly<Record<string, unknown>>;
  readonly element: Element;
  readonly seriesIndex: number;
  readonly valueIndex?: number;
}

/** Why the tooltip shows; each kind hides its own way. */
type Reason = 'hover' | 'tap' | 'focus';

const DEFAULT_ROLES = ['point', 'bar', 'slice'];

/** The distance from the anchor without `--ct-tooltip-offset`, in px. */
const DEFAULT_OFFSET = 10;

let tooltipCount = 0;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** A value that wasn't drawn: undefined, or `{ x, y }` without either. */
function isHole(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'object') {
    const { x, y } = value as { x?: unknown; y?: unknown };
    return x === undefined && y === undefined;
  }
  return false;
}

/**
 * The value for `format` and `render`: a number when the chart has one
 * number for it (bars and lines normalize to `{ y }`), `{ x, y }` when it
 * has both, as in scatter charts.
 */
function plainValue(value: unknown): unknown {
  if (value && typeof value === 'object') {
    const { x, y } = value as { x?: unknown; y?: unknown };
    if (x === undefined && isNumber(y)) {
      return y;
    }
    if (y === undefined && isNumber(x)) {
      return x;
    }
  }
  return value;
}

/** Nodes without a series sort after every series in keyboard order. */
const NO_SERIES = 1_000_000;

/**
 * The same value across renders: its role, series and value index; for a
 * node without a series (a target line), its scene key, else its place
 * among the nodes of its role.
 */
function keyOf(node: SceneNode, rank?: number): string | undefined {
  const ctx = node.ctx as Record<string, unknown> | undefined;
  const role = String(node.role);
  if (ctx && isNumber(ctx.seriesIndex)) {
    const valueIndex = isNumber(ctx.valueIndex) ? ctx.valueIndex : '';
    return `${role}/${ctx.seriesIndex}/${valueIndex}`;
  }
  return node.key
    ? `${role}@${node.key}`
    : rank === undefined
      ? undefined
      : `${role}#${rank}`;
}

function entryOf(
  node: SceneNode,
  element: Element,
  data: TooltipData,
  rank: number
): Entry | undefined {
  const ctx = (node.ctx ?? {}) as Record<string, unknown>;
  const key = keyOf(node, rank);
  if (!key) {
    return undefined;
  }
  const seriesIndex = isNumber(ctx.seriesIndex) ? ctx.seriesIndex : undefined;
  const valueIndex = isNumber(ctx.valueIndex) ? ctx.valueIndex : undefined;
  if (valueIndex !== undefined && isHole(ctx.value)) {
    return undefined;
  }
  // The series as given, from the node or, as for a trend line, the data.
  const series =
    'series' in ctx
      ? ctx.series
      : seriesIndex === undefined
        ? undefined
        : data.series[seriesIndex];
  const name =
    series && typeof series === 'object'
      ? (series as { name?: unknown }).name
      : undefined;
  // A slice is a series of its own: its label is at the series' index. A
  // node with a label of its own (a target line) brings it.
  const labelIndex = node.role === 'slice' ? seriesIndex : valueIndex;
  const label =
    labelIndex === undefined
      ? typeof ctx.label === 'string'
        ? ctx.label
        : undefined
      : data.labels[labelIndex];
  const item = {
    role: node.role as NodeRole,
    ...(seriesIndex !== undefined && { seriesIndex }),
    ...(valueIndex !== undefined && { valueIndex }),
    ...('value' in ctx && { value: plainValue(ctx.value) }),
    meta: ctx.meta,
    series,
    ...(typeof name === 'string' && name !== '' && { seriesName: name }),
    ...(label !== undefined &&
      label !== null &&
      label !== '' && {
        label:
          label instanceof Date ? label.toLocaleDateString() : String(label)
      }),
    context: ctx,
    element
  } as TooltipItem;
  return {
    key,
    item,
    ctx,
    element,
    seriesIndex: seriesIndex ?? NO_SERIES + rank,
    valueIndex
  };
}

/** Where a value is, in the viewport: from its context, scaled like its svg. */
function anchorOf({ ctx, element, item }: Entry): { x: number; y: number } {
  let point: { x: number; y: number } | undefined;
  const center = ctx.center as { x?: unknown; y?: unknown } | undefined;
  if (
    item.role === 'slice' &&
    center &&
    isNumber(center.x) &&
    isNumber(center.y) &&
    isNumber(ctx.radius) &&
    isNumber(ctx.startAngle) &&
    isNumber(ctx.endAngle)
  ) {
    // The middle of the slice's arc; angles run clockwise from the top.
    const angle = (((ctx.startAngle + ctx.endAngle) / 2) * Math.PI) / 180;
    point = {
      x: center.x + ctx.radius * Math.sin(angle),
      y: center.y - ctx.radius * Math.cos(angle)
    };
  } else if (
    isNumber(ctx.x1) &&
    isNumber(ctx.y1) &&
    isNumber(ctx.x2) &&
    isNumber(ctx.y2)
  ) {
    // A bar's end, at its value; the middle of other lines (trend lines,
    // target lines).
    point =
      item.role === 'bar'
        ? { x: ctx.x2, y: ctx.y2 }
        : { x: (ctx.x1 + ctx.x2) / 2, y: (ctx.y1 + ctx.y2) / 2 };
  } else if (isNumber(ctx.x) && isNumber(ctx.y)) {
    point = { x: ctx.x, y: ctx.y };
  }
  const svg = (element as SVGGraphicsElement).ownerSVGElement;
  const matrix = svg?.getScreenCTM?.();
  if (point && matrix) {
    return {
      x: matrix.a * point.x + matrix.c * point.y + matrix.e,
      y: matrix.b * point.x + matrix.d * point.y + matrix.f
    };
  }
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top };
}

/** The longest delay plus duration of an element's transitions, in ms. */
function transitionTime(style: CSSStyleDeclaration): number {
  const times = (list: string) =>
    list
      .split(',')
      .map(time =>
        time.trim().endsWith('ms') ? parseFloat(time) : parseFloat(time) * 1000
      )
      .map(time => (Number.isFinite(time) ? time : 0));
  const delays = times(style.transitionDelay || '0s');
  const durations = times(style.transitionDuration || '0s');
  return Math.max(
    0,
    ...durations.map((duration, index) => duration + (delays[index] ?? 0))
  );
}

/**
 * Shows a tooltip for the values of a chart: under the pointer, under a
 * finger, or in keyboard focus. Points, bars and slices get one by default,
 * with the value's title (its `meta` or label), the series' name and the
 * value; `format` and `render` change the content. The tooltip is a
 * `.ct-tooltip` element in the chart's container, shown in the top layer, so
 * `overflow: hidden` can't clip it, and styled with the `--ct-tooltip-*`
 * properties of `@chartist-js/tooltips/styles.css`. Content is text unless
 * you `render` it, so the plugin works under a strict Content Security Policy
 * and Trusted Types.
 *
 * The values form one tab stop per chart: arrow keys move between them and
 * `Escape` hides the tooltip. Where a chart has no container (`toScene()`,
 * server rendering), the plugin does nothing.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { tooltips } from '@chartist-js/tooltips';
 * import 'chartist/styles.css';
 * import '@chartist-js/tooltips/styles.css';
 *
 * lineChart(
 *   '#chart',
 *   {
 *     labels: ['Mon', 'Tue', 'Wed'],
 *     series: [{ name: 'Visitors', data: [1200, 1500, 1350] }]
 *   },
 *   { plugins: [tooltips()] }
 * );
 * ```
 */
export function tooltips<R extends NodeRole = DefaultTooltipRole>(
  options: TooltipsOptions<R> = {}
): ChartPlugin {
  return {
    name: 'tooltips',
    // The roles only narrow the types; the plugin handles every role alike.
    install: chart =>
      install(chart, options as unknown as TooltipsOptions<NodeRole>)
  };
}

function install(
  chart: ChartHandle,
  options: TooltipsOptions<NodeRole>
): (() => void) | undefined {
  const container = chart.container;
  if (!container) {
    return undefined;
  }
  const doc = container.ownerDocument;
  const view = doc.defaultView;
  if (!view) {
    return undefined;
  }
  const win = view;
  const roles = new Set<string>(options.roles ?? DEFAULT_ROLES);
  const keyboard = options.keyboard !== false;
  const numbers = new Intl.NumberFormat(undefined, options.numberFormat);

  const tooltip = doc.createElement('div');
  tooltip.className = ['ct-tooltip', options.className]
    .filter(Boolean)
    .join(' ');
  tooltip.id = `ct-tooltip-${++tooltipCount}`;
  // The focused value carries the text as its name.
  tooltip.setAttribute('aria-hidden', 'true');
  const content = doc.createElement('div');
  content.className = 'ct-tooltip-content';
  tooltip.append(content);
  const popover = typeof tooltip.showPopover === 'function';
  if (popover) {
    tooltip.setAttribute('popover', 'manual');
  } else {
    tooltip.hidden = true;
  }
  container.append(tooltip);

  let data: TooltipData = { labels: [], series: [] };
  let entries: Entry[] = [];
  let byKey = new Map<string, Entry>();
  let groups: Entry[][] = [];
  const byElement = new WeakMap<Element, Entry>();
  /** The value the tooltip shows, and why. */
  let active: { key: string; reason: Reason } | undefined;
  /** The value shown last, kept through the hide delay. */
  let shown: string | undefined;
  /** The value holding the chart's tab stop. */
  let stopKey: string | undefined;
  let open = false;
  let pointer: { x: number; y: number } | undefined;
  let placed: { x: number; y: number } | undefined;
  let cleanupRender: (() => void) | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  /** A pointer is pressed on a value: focus from it isn't keyboard focus. */
  let pressing = false;
  let listening = false;
  const observer =
    typeof win.ResizeObserver === 'function'
      ? new win.ResizeObserver(() => position())
      : undefined;
  const nextFrame = (callback: () => void) =>
    win.requestAnimationFrame
      ? win.requestAnimationFrame(callback)
      : (setTimeout(callback, 16) as unknown as number);

  const valueAt = (target: EventTarget | null): Entry | undefined => {
    let element = target instanceof win.Element ? target : null;
    while (element && element !== container) {
      const entry = byElement.get(element);
      if (entry) {
        return entry;
      }
      element = element.parentElement;
    }
    return undefined;
  };
  const inTooltip = (target: EventTarget | null) =>
    target instanceof win.Node && tooltip.contains(target);

  function position(animation?: UpdateAnimation) {
    const entry = active && byKey.get(active.key);
    if (!entry || !open) {
      return;
    }
    const anchor =
      active?.reason === 'hover' && options.position === 'pointer' && pointer
        ? pointer
        : anchorOf(entry);
    const box = tooltip.getBoundingClientRect();
    const offset = parseFloat(
      win.getComputedStyle(tooltip).getPropertyValue('--ct-tooltip-offset')
    );
    const root = doc.documentElement;
    const next = place(
      anchor,
      { width: box.width, height: box.height },
      {
        width: root.clientWidth || win.innerWidth,
        height: root.clientHeight || win.innerHeight
      },
      Number.isFinite(offset) ? offset : DEFAULT_OFFSET
    );
    const from = placed;
    tooltip.style.setProperty('--ct-tooltip-x', `${next.x}px`);
    tooltip.style.setProperty('--ct-tooltip-y', `${next.y}px`);
    // Where the value is, from the tooltip's left edge: for a CSS arrow.
    tooltip.style.setProperty(
      '--ct-tooltip-anchor-x',
      `${anchor.x - next.x}px`
    );
    tooltip.dataset.placement = next.side;
    placed = next;
    if (
      animation &&
      from &&
      (from.x !== next.x || from.y !== next.y) &&
      typeof tooltip.animate === 'function'
    ) {
      tooltip.animate(
        { translate: [`${from.x}px ${from.y}px`, `${next.x}px ${next.y}px`] },
        animation
      );
    }
  }

  /** Gives a value its role and its tooltip's text as accessible name. */
  function name(
    entry: Entry,
    text: Text | undefined = textOf(entry.item, options, numbers)
  ) {
    const { element } = entry;
    if (element.getAttribute('role') !== 'img') {
      element.setAttribute('role', 'img');
    }
    const label = accessibleName(
      options.render && !text?.custom
        ? contentText(content)
        : (text?.text ?? '')
    );
    if (label && element.getAttribute('aria-label') !== label) {
      element.setAttribute('aria-label', label);
    }
  }

  function moveStop(entry: Entry) {
    if (!keyboard) {
      return;
    }
    const previous = stopKey === undefined ? undefined : byKey.get(stopKey);
    if (previous && previous !== entry) {
      previous.element.setAttribute('tabindex', '-1');
    }
    if (entry.element.getAttribute('tabindex') !== '0') {
      entry.element.setAttribute('tabindex', '0');
    }
    stopKey = entry.key;
  }

  function reveal() {
    clearTimeout(hideTimer);
    tooltip.classList.remove('ct-tooltip-hidden');
    if (!open) {
      if (popover) {
        tooltip.showPopover();
      } else {
        tooltip.hidden = false;
      }
      open = true;
    }
    observer?.observe(content);
    listen(true);
  }

  function conceal() {
    clearTimeout(hideTimer);
    if (open) {
      if (popover) {
        try {
          tooltip.hidePopover();
        } catch {
          // Already closed, e.g. by the browser.
        }
      } else {
        tooltip.hidden = true;
      }
      open = false;
    }
    shown = undefined;
    placed = undefined;
    cleanupRender?.();
    cleanupRender = undefined;
    content.replaceChildren();
    observer?.disconnect();
    listen(false);
  }

  /** Shows an entry's tooltip; `changed` fills it again for the same value. */
  function show(
    entry: Entry,
    reason: Reason,
    changed = false,
    animation?: UpdateAnimation
  ) {
    if (open && shown === entry.key && !changed) {
      active = { key: entry.key, reason };
      reveal();
      position();
      return;
    }
    const text = textOf(entry.item, options, numbers);
    if (text === undefined) {
      hide(true);
      return;
    }
    cleanupRender?.();
    cleanupRender = undefined;
    content.replaceChildren();
    if (options.render) {
      const undo = options.render(content, entry.item, data);
      cleanupRender = typeof undo === 'function' ? undo : undefined;
    } else {
      fillText(content, entry.item, text, numbers);
    }
    const color = win
      .getComputedStyle(entry.element)
      .getPropertyValue('--ct-color')
      .trim();
    if (color) {
      tooltip.style.setProperty('--ct-tooltip-series-color', color);
    } else {
      tooltip.style.removeProperty('--ct-tooltip-series-color');
    }
    active = { key: entry.key, reason };
    shown = entry.key;
    if (keyboard && (reason === 'focus' || stopKey === entry.key)) {
      name(entry, text);
    }
    reveal();
    position(animation);
  }

  function hide(immediate = false) {
    if (!open) {
      active = undefined;
      return;
    }
    active = undefined;
    tooltip.classList.add('ct-tooltip-hidden');
    clearTimeout(hideTimer);
    const wait = immediate ? 0 : transitionTime(win.getComputedStyle(tooltip));
    if (wait <= 0) {
      conceal();
    } else {
      hideTimer = setTimeout(() => {
        if (!active) {
          conceal();
        }
      }, wait);
    }
  }

  // --- Events -------------------------------------------------------------

  const onOver = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      return;
    }
    if (inTooltip(event.target)) {
      // Hovering the tooltip keeps it.
      if (open && shown && !active) {
        active = { key: shown, reason: 'hover' };
        reveal();
      }
      return;
    }
    const entry = valueAt(event.target);
    if (entry) {
      pointer = { x: event.clientX, y: event.clientY };
      show(entry, active?.reason === 'focus' ? 'focus' : 'hover');
    }
  };
  const onOut = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || active?.reason !== 'hover') {
      return;
    }
    const to = event.relatedTarget;
    if (inTooltip(to) || (to && valueAt(to)?.key === active.key)) {
      return;
    }
    hide();
  };
  const onMove = (event: PointerEvent) => {
    if (
      event.pointerType === 'touch' ||
      options.position !== 'pointer' ||
      active?.reason !== 'hover'
    ) {
      return;
    }
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) {
      frame = nextFrame(() => {
        frame = 0;
        position();
      });
    }
  };
  const onDown = (event: PointerEvent) => {
    const entry = valueAt(event.target);
    if (!entry) {
      return;
    }
    pressing = true;
    setTimeout(() => {
      pressing = false;
    });
    if (event.pointerType === 'touch') {
      show(entry, 'tap');
    }
  };
  const onFocusIn = (event: FocusEvent) => {
    const entry = valueAt(event.target);
    if (!entry) {
      return;
    }
    moveStop(entry);
    // Focus from a click or tap keeps the tooltip's hover or tap behavior.
    if (pressing) {
      return;
    }
    show(entry, 'focus');
  };
  const onFocusOut = (event: FocusEvent) => {
    const target = event.target as Element;
    // A render replaced the focused element; mount moves the focus on.
    if (!target.isConnected) {
      return;
    }
    const to = event.relatedTarget;
    if (active?.reason === 'focus' && !(to && valueAt(to))) {
      hide();
    }
  };
  const onKey = (event: KeyboardEvent) => {
    const entry = valueAt(event.target);
    if (!entry || !keyboard || !KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    const next = step(groups, entry, event.key);
    if (next && next !== entry) {
      moveStop(next);
      name(next);
      (next.element as HTMLElement).focus();
    }
  };
  // While a tooltip shows: keep it placed, and hide it on Escape or a tap
  // elsewhere.
  const onViewport = () => position();
  const onOutside = (event: PointerEvent) => {
    if (
      active?.reason === 'tap' &&
      !inTooltip(event.target) &&
      !valueAt(event.target)
    ) {
      hide();
    }
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      hide(true);
    }
  };

  function listen(on: boolean) {
    if (on === listening) {
      return;
    }
    listening = on;
    const method = on ? 'addEventListener' : 'removeEventListener';
    win[method]('scroll', onViewport, { capture: true, passive: true });
    win[method]('resize', onViewport);
    doc[method]('pointerdown', onOutside as EventListener, true);
    doc[method]('keydown', onEscape as EventListener, true);
  }

  const containerListeners: [string, EventListener][] = [
    ['pointerover', onOver as EventListener],
    ['pointerout', onOut as EventListener],
    ['pointermove', onMove as EventListener],
    ['pointerdown', onDown as EventListener],
    ['focusin', onFocusIn as EventListener],
    ['focusout', onFocusOut as EventListener],
    ['keydown', onKey as EventListener]
  ];
  for (const [type, listener] of containerListeners) {
    container.addEventListener(type, listener);
  }

  // --- Renders ------------------------------------------------------------

  chart.on('prepare', ({ data: prepared }) => {
    data = prepared;
  });

  chart.on('mount', ({ scene, changes, elementOf, animation }) => {
    const changed = new Set<string>();
    for (const change of changes) {
      if (change.op !== 'remove' && roles.has(String(change.node.role))) {
        const key = keyOf(change.node);
        if (key) {
          changed.add(key);
        }
      }
    }
    const next: Entry[] = [];
    // Each role's nodes counted in scene order, for nodes without a series.
    const places = new Map<string, number>();
    const visit = (node: SceneNode) => {
      if (node.role !== undefined && roles.has(node.role)) {
        const rank = places.get(node.role) ?? 0;
        places.set(node.role, rank + 1);
        const element = elementOf(node);
        const entry = element && entryOf(node, element, data, rank);
        if (entry) {
          next.push(entry);
          byElement.set(entry.element, entry);
        }
      }
      node.children.forEach(visit);
    };
    visit(scene);
    entries = next;
    byKey = new Map(entries.map(entry => [entry.key, entry]));
    groups = groupBySeries(entries);

    if (keyboard) {
      const stop =
        (stopKey === undefined ? undefined : byKey.get(stopKey)) ??
        groups[0]?.[0];
      stopKey = stop?.key;
      for (const entry of entries) {
        entry.element.classList.add('ct-tooltip-target');
        const index = entry === stop ? '0' : '-1';
        if (entry.element.getAttribute('tabindex') !== index) {
          entry.element.setAttribute('tabindex', index);
        }
      }
      // Its name is ready before anyone tabs in.
      if (
        stop &&
        (changed.has(stop.key) || !stop.element.hasAttribute('aria-label'))
      ) {
        name(stop);
      }
    }

    if (!active && !shown) {
      return;
    }
    const key = active?.key ?? shown;
    const entry = key === undefined ? undefined : byKey.get(key);
    if (!entry) {
      hide(true);
      return;
    }
    if (
      active?.reason === 'focus' &&
      doc.activeElement !== entry.element &&
      !container.contains(doc.activeElement)
    ) {
      (entry.element as HTMLElement).focus({ preventScroll: true });
    }
    if (
      active &&
      (changed.has(entry.key) || entry.item.seriesIndex === undefined)
    ) {
      show(entry, active.reason, true, animation);
    } else {
      position(animation);
    }
  });

  return () => {
    clearTimeout(hideTimer);
    active = undefined;
    conceal();
    for (const [type, listener] of containerListeners) {
      container.removeEventListener(type, listener);
    }
    tooltip.remove();
  };
}
