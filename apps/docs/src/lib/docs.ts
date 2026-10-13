import { getCollection, type CollectionEntry } from 'astro:content';
import { GROUPS } from '../content.config';

export type DocEntry = CollectionEntry<'docs'>;

/** All docs pages in sidebar order: by group, then by `order`. */
export async function sortedDocs(): Promise<DocEntry[]> {
  const docs = await getCollection('docs');
  return docs.sort(
    (a, b) =>
      GROUPS.indexOf(a.data.group) - GROUPS.indexOf(b.data.group) ||
      a.data.order - b.data.order
  );
}

/** The sidebar: groups with their pages, empty groups left out. */
export function sidebar(docs: DocEntry[]) {
  return GROUPS.map(group => ({
    group,
    pages: docs.filter(doc => doc.data.group === group)
  })).filter(entry => entry.pages.length > 0);
}

export const docPath = (doc: DocEntry) => `docs/${doc.id}/`;
