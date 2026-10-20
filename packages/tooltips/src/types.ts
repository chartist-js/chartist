import type { NodeRole, NodeRoles } from 'chartist';

/** The roles that get tooltips without a `roles` option. */
export type DefaultTooltipRole = 'point' | 'bar' | 'slice';

/** What every tooltip item has, whatever its role. */
export interface TooltipItemBase {
  /** The series' index in the chart's data; absent for a node without one, such as a target line. */
  readonly seriesIndex?: number;
  /** The value's index in its series; absent for a whole series. */
  readonly valueIndex?: number;
  /**
   * The value: a number, or `{ x, y }` when it has both (a scatter chart's
   * point). Absent for a whole series.
   */
  readonly value?: unknown;
  /** The value's `meta`, or the series' for a slice. */
  readonly meta: unknown;
  /** The series as given in the data: an array, or an object with `data`. */
  readonly series: unknown;
  /** The series' `name`, when it has one. */
  readonly seriesName?: string;
  /** The value's label: at its index, the slice's own, or a target line's. */
  readonly label?: string;
  /** The element drawn for the value. */
  readonly element: Element;
}

/**
 * The value a tooltip is about: what `format` and `render` get, for the
 * roles in `roles`. Checking `item.role` narrows `item.context` to that
 * role's data context, for Chartist's roles and for the roles other layers
 * declare in `NodeRoles` alike: after `item.role === 'trendLine'`,
 * `item.context.slope` is a number.
 */
export type TooltipItem<R extends NodeRole = NodeRole> = {
  [K in R]: TooltipItemBase & {
    /** The node's role, such as `point`, `bar` or `slice`. */
    readonly role: K;
    /**
     * The node's data context, with what its role knows: a trend line's
     * `slope` and `intercept`, a target line's `value` and `label`, a
     * slice's angles.
     */
    readonly context: NodeRoles[K]['ctx'];
  };
}[R];

/** The chart's data as `render` gets it: its labels and series, read-only. */
export interface TooltipData {
  /** The labels as given, or an empty array. */
  readonly labels: readonly (string | number | Date)[];
  /** The series, each with its `values`, and its `name` and `meta` when given. */
  readonly series: readonly {
    readonly name?: string;
    readonly meta?: unknown;
    readonly values: readonly unknown[];
  }[];
  /** The data was one flat series of values, as for pies. */
  readonly flat?: boolean;
}

/**
 * Options of {@link tooltips}. `R` is the roles in `roles`, so `format` and
 * `render` get items of those roles only.
 */
export interface TooltipsOptions<R extends NodeRole = DefaultTooltipRole> {
  /**
   * The roles of the nodes that get tooltips: `point`, `bar` and `slice`
   * by default. Any role works, of other layers and plugins too: `line` for
   * a tooltip per series, `trendLine` and `targetLine` of
   * `@chartist-js/essentials`. The default text shows
   * what a node has (a target line's label and value, a trend line's
   * series); for more, read `item.context` in `format` or `render`, where
   * checking `item.role` narrows it to that role's context.
   */
  readonly roles?: readonly R[];
  /**
   * Gives a tooltip's text: line breaks show as line breaks. Return
   * `undefined` to keep the default text for that value (handy when you
   * format some roles only), and `null` or an empty string for no tooltip. The text
   * is also the focused value's accessible name. Without it, a tooltip
   * shows the title (the value's `meta` or its label), the series' name
   * and the value.
   */
  readonly format?: (item: TooltipItem<R>) => string | null | undefined;
  /**
   * Fills the tooltip yourself, with DOM nodes or a framework's template:
   * `content` is the tooltip's content element, emptied before each call.
   * Return a function to undo it, such as unmounting a component: it runs
   * before the next call, when the tooltip hides, and on `destroy()`.
   * `format` still decides which values have a tooltip and gives their
   * accessible name; without it, the name is the content's text. Setting
   * HTML strings is your code's business: under Trusted Types, it needs
   * your own policy.
   */
  readonly render?: (
    content: HTMLElement,
    item: TooltipItem<R>,
    data: TooltipData
  ) => void | (() => void);
  /**
   * How the default text formats values, as `Intl.NumberFormat` options
   * in the browser's locale, e.g. `{ style: 'currency', currency: 'CHF' }`.
   */
  readonly numberFormat?: Intl.NumberFormatOptions;
  /**
   * Where the tooltip shows: at the value (`element`) or at the mouse or
   * pen while it moves (`pointer`). Touch and keyboard always use the value.
   */
  readonly position?: 'element' | 'pointer';
  /**
   * Makes the values reachable by keyboard: one tab stop per chart, arrow
   * keys between values, `Escape` to hide. `false` leaves the tab order and
   * the chart's elements as they are.
   */
  readonly keyboard?: boolean;
  /** Extra class names for the tooltip element. */
  readonly className?: string;
}
