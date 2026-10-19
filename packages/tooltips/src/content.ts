import type { NodeRole } from 'chartist';
import type { TooltipItem, TooltipsOptions } from './types.ts';

/** One part of the default text, with the class it shows with. */
export interface Part {
  readonly className: string;
  readonly text: string;
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** The value as text: a number, or both numbers of `{ x, y }`. */
function valueText(value: unknown, numbers: Intl.NumberFormat): string {
  if (isNumber(value)) {
    return numbers.format(value);
  }
  if (value && typeof value === 'object') {
    const { x, y } = value as { x?: unknown; y?: unknown };
    return [x, y]
      .filter(isNumber)
      .map(number => numbers.format(number))
      .join(', ');
  }
  return '';
}

/**
 * The default parts: the title (the value's `meta` when it's a string or a
 * number, else its label), the series' name and the value. Empty parts and
 * parts that repeat an earlier one are left out.
 */
export function defaultParts(
  item: TooltipItem,
  numbers: Intl.NumberFormat
): Part[] {
  const meta =
    typeof item.meta === 'string' || isNumber(item.meta)
      ? String(item.meta)
      : undefined;
  const candidates: Part[] = [
    { className: 'ct-tooltip-title', text: meta ?? item.label ?? '' },
    { className: 'ct-tooltip-series', text: item.seriesName ?? '' },
    { className: 'ct-tooltip-value', text: valueText(item.value, numbers) }
  ];
  const seen = new Set<string>();
  return candidates.filter(({ text }) => {
    if (text === '' || seen.has(text)) {
      return false;
    }
    seen.add(text);
    return true;
  });
}

/** A tooltip's text, and whether `format` gave it. */
export interface Text {
  readonly text: string;
  /** From `format`: one text, shown with its line breaks. */
  readonly custom: boolean;
}

/**
 * The tooltip's text for an item: `format`'s, or the default parts joined.
 * `format` returning `undefined` keeps the default text; `null` and `''`
 * mean no tooltip, as does `undefined` here.
 */
export function textOf(
  item: TooltipItem,
  options: TooltipsOptions<NodeRole>,
  numbers: Intl.NumberFormat
): Text | undefined {
  const own = options.format?.(item);
  if (own === null || own === '') {
    return undefined;
  }
  if (own !== undefined) {
    return { text: String(own), custom: true };
  }
  if (options.render) {
    return { text: '', custom: false };
  }
  const parts = defaultParts(item, numbers);
  return parts.length
    ? { text: parts.map(part => part.text).join(', '), custom: false }
    : undefined;
}

/**
 * Fills the content element with text only: `format`'s text in one span
 * (line breaks kept by CSS), or one span per default part.
 */
export function fillText(
  content: HTMLElement,
  item: TooltipItem,
  { text, custom }: Text,
  numbers: Intl.NumberFormat
): void {
  const span = (className: string, value: string) => {
    const element = content.ownerDocument.createElement('span');
    element.className = className;
    element.textContent = value;
    return element;
  };
  content.replaceChildren(
    ...(custom
      ? [span('ct-tooltip-text', text)]
      : defaultParts(item, numbers).map(part =>
          span(part.className, part.text)
        ))
  );
}

/** An accessible name from text: line breaks read as pauses. */
export const accessibleName = (text: string) =>
  text.replace(/\s*\n+\s*/g, ', ').trim();

/**
 * The text of rendered content for an accessible name: its text nodes
 * joined with spaces, so separate elements don't run together.
 */
export function contentText(content: HTMLElement): string {
  const walker = content.ownerDocument.createTreeWalker(content, 4);
  const texts: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text) {
      texts.push(text);
    }
  }
  return texts.join(' ');
}
