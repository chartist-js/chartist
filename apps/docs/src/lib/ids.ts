let next = 0;

/** A page-unique id for SVG defs (clip paths) of components used several times on a page. */
export const uniqueId = (prefix: string) => `${prefix}-${++next}`;
