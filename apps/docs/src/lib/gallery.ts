/**
 * The examples gallery: the docs examples of @chartist/examples, with
 * their files. The files are read at build time from the package folders.
 */
import { examples, type ChartType, type Example } from '@chartist/examples';

const raw = import.meta.glob<string>(
  [
    '../../../../packages/examples/*/*/index.html',
    '../../../../packages/examples/*/*/src/**'
  ],
  { query: '?raw', import: 'default', eager: true }
);

export interface GalleryExample extends Example {
  /** The functional entry's project (index.html, src/main.ts, …). */
  files: Record<string, string>;
  /** The 1.x code drawing the same chart, when the example has it. */
  classicCode?: string;
}

/** Chart types in gallery order, with their headings. */
export const TYPES: { type: ChartType; title: string }[] = [
  { type: 'line', title: 'Line charts' },
  { type: 'bar', title: 'Bar charts' },
  { type: 'pie', title: 'Pie and donut charts' },
  { type: 'composed', title: 'Composed charts' },
  { type: 'styling', title: 'Styling' },
  { type: 'live', title: 'Live data' }
];

/** The files of an example folder, keyed by path. */
function filesOf(folder: string) {
  const prefix = `../../../../packages/examples/${folder}/`;
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, source]) => [path.slice(prefix.length), source])
  );
}

/** Every docs example, in manifest order. */
export const gallery: GalleryExample[] = examples
  .filter(example => example.docs)
  .map(example => {
    const { 'src/main.classic.ts': classicCode, ...files } = filesOf(
      example.folder
    );
    return { ...example, files, classicCode };
  });

/** The functional entry's files of a gallery example, by id. */
export function galleryFiles(id: string): Record<string, string> {
  const example = gallery.find(candidate => candidate.id === id);
  if (!example) {
    throw new Error(`No gallery example "${id}"`);
  }
  return example.files;
}

/** The docs examples of one type, in manifest order. */
export const ofType = (type: ChartType) =>
  gallery.filter(example => example.type === type);
