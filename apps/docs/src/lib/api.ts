/**
 * The API reference's model: TypeDoc's JSON
 * for chartist, chartist/compat, chartist/live and chartist/server, and one per documented `@chartist-js`
 * package (docs:api writes them), read at build time, and what the
 * reference pages need from it: entries per page, comments, types as
 * linked tokens, and the members of option types.
 *
 * This is the only module that reads TypeDoc's model.
 */
import type { JSONOutput as J } from 'typedoc';
import raw from '../generated/api.json?raw';
import { packageBySlug } from '../data/packages';
import { hasDefaults } from './api-defaults';
import { API_PAGES, pageFor, type ApiPage } from './api-pages';
import { href } from './site';

type Reflection = J.DeclarationReflection;
type Signature = J.SignatureReflection;
type SomeType = J.SomeType;
type Part = J.CommentDisplayPart;

/** TypeDoc's ReflectionKind values used here. */
export const KIND = {
  Namespace: 4,
  Variable: 32,
  Function: 64,
  Class: 128,
  Interface: 256,
  Constructor: 512,
  Property: 1024,
  Method: 2048,
  Accessor: 262144,
  TypeAlias: 2097152,
  Reference: 4194304
} as const;

const project = JSON.parse(raw) as J.ProjectReflection;

/** The packages' models, by slug, from `src/generated/api/<slug>.json`. */
const packageModels = Object.entries(
  import.meta.glob<string>('../generated/api/*.json', {
    query: '?raw',
    import: 'default',
    eager: true
  })
).map(([path, source], i) => ({
  slug: /([^/]+)\.json$/.exec(path)![1],
  // Reflection ids count from 0 in every model: each package's are moved
  // past the others', so one map holds them all.
  project: offsetIds(JSON.parse(source), (i + 1) * 1_000_000)
}));

/** A model with its reflection ids (and references to them) moved by `by`. */
function offsetIds(value: unknown, by: number): J.ProjectReflection {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (!node || typeof node !== 'object') {
      return node;
    }
    return Object.fromEntries(
      Object.entries(node).map(([key, child]) => {
        if ((key === 'id' || key === 'target') && typeof child === 'number') {
          return [key, child + by];
        }
        if (
          key === 'children' &&
          Array.isArray(child) &&
          child.every(item => typeof item === 'number')
        ) {
          return [key, child.map(item => item + by)];
        }
        // symbolIdMap is keyed by id; nothing here reads it.
        return [key, key === 'symbolIdMap' ? child : walk(child)];
      })
    );
  };
  return walk(value) as J.ProjectReflection;
}

/** `chartist`, `chartist/compat`, `chartist/live`, `chartist/server` or a package's npm name. */
export type ModuleName = string;

export interface ApiEntry {
  name: string;
  module: ModuleName;
  /** The reference page's slug, or `packages/<slug>` for a package. */
  page: string;
  /** The package's slug, for a package's exports. */
  pkg?: string;
  reflection: Reflection;
  /** Source path under packages/chartist/src. */
  file: string;
  /** A link to the source on GitHub. */
  sourceUrl?: string;
  /**
   * For an export another entry point re-exports from `chartist` (the
   * `toScene` of `chartist/server`): the id of the original.
   */
  reexport?: number;
}

/** TypeDoc's module names of chartist's other entry points → their subpath. */
const ENTRY_POINTS: Readonly<Record<string, string>> = {
  compat: 'compat',
  live: 'live',
  server: 'server'
};

/** Every export of chartist and its other entry points, in source order per module (core first). */
export const ENTRIES: ApiEntry[] = [];
/** Every export of each package, in source order, by the package's slug. */
export const PACKAGE_ENTRIES = new Map<string, ApiEntry[]>();
/** Reflection id → where it's documented: export and member path. */
const LOCATIONS = new Map<number, { entry: ApiEntry; member?: string }>();

for (const module of project.children ?? []) {
  const subpath = ENTRY_POINTS[module.name];
  const moduleName: ModuleName = subpath ? `chartist/${subpath}` : 'chartist';
  for (const reflection of module.children ?? []) {
    const file = reflection.sources?.[0]?.fileName ?? '';
    const assigned = pageFor(
      reflection.name,
      subpath
        ? `${subpath}/${file.replace(new RegExp(`^${subpath}/`), '')}`
        : file
    );
    // The 1.x event and plugin types are documented where compat exports
    // them; the core's copies, deprecated on chartist, go with the classes.
    const page =
      assigned === 'compat' && moduleName === 'chartist' ? 'classes' : assigned;
    const entry: ApiEntry = {
      name: reflection.name,
      module: moduleName,
      page: page ?? '',
      reflection,
      file,
      sourceUrl: reflection.sources?.[0]?.url,
      reexport:
        reflection.kind === KIND.Reference
          ? (reflection as { target?: number }).target
          : undefined
    };
    ENTRIES.push(entry);
    index(reflection, entry);
  }
}

for (const { slug, project: model } of packageModels) {
  const pkg = packageBySlug(slug);
  const entries = (model.children ?? []).map((reflection): ApiEntry => {
    const entry: ApiEntry = {
      name: reflection.name,
      module: pkg.name,
      page: `packages/${slug}`,
      pkg: slug,
      reflection,
      file: reflection.sources?.[0]?.fileName ?? '',
      sourceUrl: reflection.sources?.[0]?.url
    };
    index(reflection, entry);
    return entry;
  });
  PACKAGE_ENTRIES.set(slug, entries);
}

/** Records where a reflection and its members are documented. */
function index(reflection: Reflection, entry: ApiEntry, member?: string) {
  LOCATIONS.set(reflection.id, { entry, member });
  for (const child of reflection.children ?? []) {
    index(child, entry, member ? `${member}.${child.name}` : child.name);
  }
  for (const signature of reflection.signatures ?? []) {
    LOCATIONS.set(signature.id, { entry, member });
  }
  if (reflection.type?.type === 'reflection') {
    for (const child of reflection.type.declaration.children ?? []) {
      index(child, entry, member ? `${member}.${child.name}` : child.name);
    }
  }
}

/** The `chartist` export a re-export stands for. */
export const reexportOf = (entry: ApiEntry): ApiEntry | undefined =>
  entry.reexport === undefined
    ? undefined
    : LOCATIONS.get(entry.reexport)?.entry;

export const pageOf = (slug: string): ApiPage | undefined =>
  API_PAGES.find(page => page.slug === slug);

export const entriesOn = (slug: string): ApiEntry[] =>
  ENTRIES.filter(entry => entry.page === slug);

/** A package's exports as its API page shows them. */
export function packageApiEntries(slug: string): ApiEntry[] {
  const entries = PACKAGE_ENTRIES.get(slug);
  if (!entries) {
    throw new Error(
      `No API model for the package "${slug}": add api/typedoc.${slug}.json and run docs:api`
    );
  }
  return sortByKind(entries, []);
}

/** Functions first, then classes, then types, in source order within each. */
export function sortedEntries(slug: string): ApiEntry[] {
  return sortByKind(entriesOn(slug), pageOf(slug)?.first ?? []);
}

/** Entries named in `first` lead; then functions, classes, types. */
function sortByKind(entries: ApiEntry[], first: readonly string[]): ApiEntry[] {
  const rank = (entry: ApiEntry) => {
    const kind = (reexportOf(entry) ?? entry).reflection.kind;
    if (
      kind === KIND.Function ||
      kind === KIND.Variable ||
      kind === KIND.Namespace
    ) {
      return 0;
    }
    return kind === KIND.Class ? 1 : 2;
  };
  const lead = (entry: ApiEntry) => {
    const at = first.indexOf(entry.name);
    return at < 0 ? first.length : at;
  };
  return entries
    .map((entry, order) => ({ entry, order }))
    .sort(
      (a, b) =>
        lead(a.entry) - lead(b.entry) ||
        rank(a.entry) - rank(b.entry) ||
        a.order - b.order
    )
    .map(({ entry }) => entry);
}

export const apiPath = (slug: string) => `api/${slug}/`;

/** The site path of an entry's page: a reference page or a package's API page. */
export const entryPagePath = (entry: ApiEntry) =>
  entry.pkg ? `packages/${entry.pkg}/api/` : apiPath(entry.page);

/** The anchor of an export or one of its members. */
export const anchor = (name: string, member?: string) =>
  member ? `${name}.${member}` : name;

/** Whether an entry's page lists its members (see Entry.astro). */
export function listsMembers(entry: ApiEntry): boolean {
  const page = pageOf(entry.page);
  const kind = entry.reflection.kind;
  if (page?.compact || (page?.legacy && kind === KIND.Class)) {
    return false;
  }
  return (
    kind === KIND.Interface ||
    kind === KIND.Class ||
    kind === KIND.TypeAlias ||
    kind === KIND.Namespace
  );
}

/**
 * Where a reflection is documented, as a site URL, or undefined. Members
 * the page doesn't list link to the closest anchor it has: the member, or
 * the entry.
 */
export function linkTo(id: number | undefined): string | undefined {
  const location = id === undefined ? undefined : LOCATIONS.get(id);
  if (!location || !location.entry.page) {
    return undefined;
  }
  const { entry } = location;
  const path = location.member?.split('.') ?? [];
  // Nested members are listed for the presets' options only, one level.
  const depth = !listsMembers(entry) ? 0 : hasDefaults(entry.name) ? 2 : 1;
  const member = path.slice(0, depth).join('.') || undefined;
  return `${href(entryPagePath(entry))}#${anchor(entry.name, member)}`;
}

/**
 * Where a type of another package is documented: `chartist`'s types, as
 * a package's model refers to them, link into the core reference.
 */
function externalLink(
  target: unknown,
  packageName?: string
): string | undefined {
  const symbol = target as
    | { packageName?: string; qualifiedName?: string }
    | undefined;
  return (packageName ?? symbol?.packageName) === 'chartist' &&
    symbol?.qualifiedName
    ? linkToName(symbol.qualifiedName)
    : undefined;
}

/** An export's URL by name (for guides). */
export function linkToName(name: string): string | undefined {
  const entry = ENTRIES.find(candidate => candidate.name === name);
  return entry ? linkTo(entry.reflection.id) : undefined;
}

// Comments --------------------------------------------------------------

export interface Comment {
  summary: Part[];
  blockTags: J.CommentTag[];
  modifiers: string[];
}

export function commentOf(
  reflection: Reflection | Signature | undefined
): Comment | undefined {
  const declaration = reflection as Reflection | undefined;
  const candidates = [
    reflection?.comment,
    declaration?.signatures?.[0]?.comment,
    declaration?.getSignature?.comment,
    // A method-style option (`fn?(value): R`) seen through Omit<> or an
    // extended interface becomes a property of function type, with the
    // comment on its signature (and maybe a tag-only comment on itself).
    declaration?.type?.type === 'reflection'
      ? declaration.type.declaration.signatures?.[0]?.comment
      : undefined
  ].filter((comment): comment is J.Comment => Boolean(comment));
  if (!candidates.length) {
    return undefined;
  }
  const comment =
    candidates.find(candidate => plainText(candidate.summary).trim()) ??
    candidates[0];
  return {
    summary: comment.summary,
    blockTags: comment.blockTags ?? [],
    modifiers: [
      ...new Set(candidates.flatMap(candidate => candidate.modifierTags ?? []))
    ]
  };
}

export const tagsOf = (comment: Comment | undefined, tag: string) =>
  comment?.blockTags.filter(block => block.tag === tag) ?? [];

/** Flags shown as badges. */
export function badgesOf(entry: ApiEntry): string[] {
  const comment = commentOf(entry.reflection);
  const badges: string[] = [];
  if (comment?.modifiers.includes('@experimental')) {
    badges.push('experimental');
  }
  if (comment?.blockTags.some(tag => tag.tag === '@deprecated')) {
    badges.push('deprecated');
  }
  if (pageOf(entry.page)?.legacy) {
    badges.push('1.x');
  }
  return badges;
}

/** The plain text of comment parts (for summaries and checks). */
export const plainText = (parts: Part[] | undefined) =>
  (parts ?? []).map(part => part.text).join('');

/** The first sentence of a comment's summary. */
export function firstSentence(parts: Part[] | undefined): string {
  const text = plainText(parts).replace(/\s+/g, ' ').trim();
  const end = text.search(/[.!?](\s|$)/);
  return end >= 0 ? text.slice(0, end + 1) : text;
}

export interface Block {
  kind: 'paragraph' | 'list';
  /** A paragraph's parts, or each list item's parts. */
  items: Part[][];
}

/**
 * Comment parts as paragraphs and lists: blank lines separate blocks, and
 * lines starting with "- " are list items. Inline parts (code, links) stay
 * as they are.
 */
export function blocksOf(parts: Part[]): Block[] {
  // Split the parts into lines, keeping inline parts on their line.
  const lines: Part[][] = [[]];
  for (const part of parts) {
    if (part.kind !== 'text') {
      lines[lines.length - 1].push(part);
      continue;
    }
    part.text.split('\n').forEach((line, i) => {
      if (i > 0) {
        lines.push([]);
      }
      if (line) {
        lines[lines.length - 1].push({ kind: 'text', text: line });
      }
    });
  }
  const blocks: Block[] = [];
  let current: Block | undefined;
  for (const line of lines) {
    const text = plainText(line);
    if (!text.trim()) {
      current = undefined;
      continue;
    }
    const item = /^\s*[-*] /.test(text);
    if (item) {
      const first = line[0];
      const rest =
        first.kind === 'text'
          ? [
              { ...first, text: first.text.replace(/^\s*[-*] /, '') },
              ...line.slice(1)
            ]
          : line;
      if (current?.kind !== 'list') {
        current = { kind: 'list', items: [] };
        blocks.push(current);
      }
      current.items.push(rest);
    } else if (current?.kind === 'list' && /^\s/.test(text)) {
      // A wrapped list item.
      current.items[current.items.length - 1].push(
        { kind: 'text', text: ' ' },
        ...line
      );
    } else if (current?.kind === 'paragraph') {
      current.items[0].push({ kind: 'text', text: ' ' }, ...line);
    } else {
      current = { kind: 'paragraph', items: [line] };
      blocks.push(current);
    }
  }
  return blocks;
}

/** A code block from an @example tag: the fenced code, or the whole text. */
export function exampleCode(tag: J.CommentTag): { lang: string; code: string } {
  const text = plainText(tag.content);
  const fence = /```(\w*)\n([\s\S]*?)```/.exec(text);
  return fence
    ? { lang: fence[1] || 'ts', code: fence[2].trimEnd() }
    : { lang: 'ts', code: text.trim() };
}

/** An inline link part's URL: a reflection in the model, or an external URL. */
export function partHref(part: Part): string | undefined {
  if (part.kind !== 'inline-tag') {
    return undefined;
  }
  if (typeof part.target === 'number') {
    return linkTo(part.target);
  }
  return typeof part.target === 'string'
    ? part.target
    : externalLink(part.target);
}

// Types as tokens ---------------------------------------------------------

export interface Token {
  text: string;
  kind: 'type' | 'keyword' | 'string' | 'number' | 'name' | 'punct' | 'plain';
  href?: string;
}

const t = (
  text: string,
  kind: Token['kind'] = 'punct',
  link?: string
): Token => ({ text, kind, href: link });

/** Type parameter lists, `<T extends X = Y>`. */
export function typeParametersTokens(
  parameters: J.TypeParameterReflection[] | undefined
): Token[] {
  if (!parameters?.length) {
    return [];
  }
  const tokens: Token[] = [t('<')];
  parameters.forEach((parameter, i) => {
    if (i > 0) {
      tokens.push(t(', '));
    }
    tokens.push(t(parameter.name, 'type'));
    if (parameter.type) {
      tokens.push(t(' extends ', 'keyword'), ...typeTokens(parameter.type));
    }
    if (parameter.default) {
      tokens.push(t(' = '), ...typeTokens(parameter.default));
    }
  });
  tokens.push(t('>'));
  return tokens;
}

/** A type as tokens, with references linked to their entries. */
export function typeTokens(type: SomeType | undefined, depth = 0): Token[] {
  if (!type) {
    return [t('unknown', 'keyword')];
  }
  switch (type.type) {
    case 'intrinsic':
      return [t(type.name, 'keyword')];
    case 'literal':
      if (type.value === null) {
        return [t('null', 'keyword')];
      }
      if (typeof type.value === 'string') {
        return [t(`'${type.value}'`, 'string')];
      }
      if (typeof type.value === 'object') {
        return [
          t(`${type.value.negative ? '-' : ''}${type.value.value}n`, 'number')
        ];
      }
      return [
        t(
          String(type.value),
          typeof type.value === 'number' ? 'number' : 'keyword'
        )
      ];
    case 'reference': {
      const link =
        typeof type.target === 'number'
          ? linkTo(type.target)
          : externalLink(type.target, type.package);
      const tokens = [t(type.name, 'type', link)];
      if (type.typeArguments?.length) {
        tokens.push(t('<'));
        type.typeArguments.forEach((argument, i) => {
          if (i > 0) {
            tokens.push(t(', '));
          }
          tokens.push(...typeTokens(argument, depth));
        });
        tokens.push(t('>'));
      }
      return tokens;
    }
    case 'array': {
      const element = typeTokens(type.elementType, depth);
      const wrap =
        ['union', 'intersection', 'conditional'].includes(
          type.elementType.type
        ) ||
        (type.elementType.type === 'reflection' &&
          type.elementType.declaration.signatures);
      return wrap ? [t('('), ...element, t(')[]')] : [...element, t('[]')];
    }
    case 'union':
    case 'intersection': {
      const tokens: Token[] = [];
      type.types.forEach((member, i) => {
        if (i > 0) {
          tokens.push(t(type.type === 'union' ? ' | ' : ' & '));
        }
        const inner = typeTokens(member, depth);
        const wrap =
          (member.type === 'reflection' &&
            member.declaration.signatures?.length) ||
          (type.type === 'intersection' && member.type === 'union');
        tokens.push(...(wrap ? [t('('), ...inner, t(')')] : inner));
      });
      return tokens;
    }
    case 'tuple': {
      const tokens: Token[] = [t('[')];
      (type.elements ?? []).forEach((element, i) => {
        if (i > 0) {
          tokens.push(t(', '));
        }
        tokens.push(...typeTokens(element, depth));
      });
      tokens.push(t(']'));
      return tokens;
    }
    case 'namedTupleMember':
      return [
        t(type.name, 'name'),
        t(type.isOptional ? '?: ' : ': '),
        ...typeTokens(type.element, depth)
      ];
    case 'optional':
      return [...typeTokens(type.elementType, depth), t('?')];
    case 'rest':
      return [t('...'), ...typeTokens(type.elementType, depth)];
    case 'typeOperator':
      return [
        t(`${type.operator} `, 'keyword'),
        ...typeTokens(type.target, depth)
      ];
    case 'query':
      return [t('typeof ', 'keyword'), ...typeTokens(type.queryType, depth)];
    case 'indexedAccess':
      return [
        ...typeTokens(type.objectType, depth),
        t('['),
        ...typeTokens(type.indexType, depth),
        t(']')
      ];
    case 'conditional':
      return [
        ...typeTokens(type.checkType, depth),
        t(' extends ', 'keyword'),
        ...typeTokens(type.extendsType, depth),
        t(' ? '),
        ...typeTokens(type.trueType, depth),
        t(' : '),
        ...typeTokens(type.falseType, depth)
      ];
    case 'inferred':
      return [t('infer ', 'keyword'), t(type.name, 'type')];
    case 'predicate':
      return [
        ...(type.asserts ? [t('asserts ', 'keyword')] : []),
        t(type.name, 'name'),
        ...(type.targetType
          ? [t(' is ', 'keyword'), ...typeTokens(type.targetType, depth)]
          : [])
      ];
    case 'templateLiteral': {
      const tokens: Token[] = [t('`', 'string'), t(type.head, 'string')];
      for (const [inner, text] of type.tail) {
        tokens.push(
          t('${', 'string'),
          ...typeTokens(inner, depth),
          t('}', 'string'),
          t(text, 'string')
        );
      }
      tokens.push(t('`', 'string'));
      return tokens;
    }
    case 'mapped':
      return [
        t('{ ['),
        t(type.parameter, 'type'),
        t(' in ', 'keyword'),
        ...typeTokens(type.parameterType, depth),
        t(']'),
        t(
          type.optionalModifier === '+'
            ? '?: '
            : type.optionalModifier === '-'
              ? '-?: '
              : ': '
        ),
        ...typeTokens(type.templateType, depth),
        t(' }')
      ];
    case 'reflection':
      return declarationTokens(type.declaration, depth);
    case 'unknown':
      return [t(type.name, 'plain')];
    default:
      return [t('unknown', 'keyword')];
  }
}

/** An inline object type or function type. */
function declarationTokens(declaration: Reflection, depth: number): Token[] {
  const signature = declaration.signatures?.[0];
  if (signature && !declaration.children?.length) {
    return [
      ...parametersTokens(signature),
      t(' => '),
      ...typeTokens(signature.type, depth)
    ];
  }
  const members = declaration.children ?? [];
  if (!members.length && !declaration.indexSignatures?.length) {
    return [t('{}')];
  }
  if (depth > 1) {
    return [t('{ … }')];
  }
  const tokens: Token[] = [t('{ ')];
  members.forEach((member, i) => {
    if (i > 0) {
      tokens.push(t('; '));
    }
    if (member.flags.isReadonly) {
      tokens.push(t('readonly ', 'keyword'));
    }
    tokens.push(
      t(member.name, 'name'),
      t(member.flags.isOptional ? '?: ' : ': ')
    );
    tokens.push(
      ...(member.signatures
        ? declarationTokens(member, depth + 1)
        : typeTokens(member.type, depth + 1))
    );
  });
  for (const indexSignature of declaration.indexSignatures ?? []) {
    if (tokens.length > 1) {
      tokens.push(t('; '));
    }
    const [parameter] = indexSignature.parameters ?? [];
    tokens.push(
      t('['),
      t(parameter?.name ?? 'key', 'name'),
      t(': '),
      ...typeTokens(parameter?.type, depth + 1),
      t(']: '),
      ...typeTokens(indexSignature.type, depth + 1)
    );
  }
  tokens.push(t(' }'));
  return tokens;
}

/** `(a: A, b?: B)` */
export function parametersTokens(signature: Signature): Token[] {
  const tokens: Token[] = [t('(')];
  (signature.parameters ?? []).forEach((parameter, i) => {
    if (i > 0) {
      tokens.push(t(', '));
    }
    if (parameter.flags.isRest) {
      tokens.push(t('...'));
    }
    tokens.push(
      t(parameter.name, 'name'),
      t(parameter.flags.isOptional || parameter.defaultValue ? '?: ' : ': '),
      ...typeTokens(parameter.type)
    );
  });
  tokens.push(t(')'));
  return tokens;
}

/** A function signature: `name<T>(params): Return`. */
export function signatureTokens(
  name: string,
  signature: Signature,
  kind: 'function' | 'method' | 'constructor' = 'function'
): Token[] {
  const head: Token[] =
    kind === 'constructor'
      ? [t('new ', 'keyword'), t(name, 'type')]
      : [
          ...(kind === 'function' ? [t('function ', 'keyword')] : []),
          t(name, 'name')
        ];
  return [
    ...head,
    ...typeParametersTokens(signature.typeParameters),
    ...parametersTokens(signature),
    ...(kind === 'constructor' ? [] : [t(': '), ...typeTokens(signature.type)])
  ];
}

/** The declaration line of a type alias, interface, class or variable. */
export function declarationHead(entry: ApiEntry): Token[] {
  const reflection = entry.reflection;
  const generics = typeParametersTokens(reflection.typeParameters);
  switch (reflection.kind) {
    case KIND.TypeAlias: {
      // Listed members below: inline objects collapse to { … } here.
      const depth = entryMembers(entry).length ? 2 : 0;
      return [
        t('type ', 'keyword'),
        t(reflection.name, 'type'),
        ...generics,
        t(' = '),
        ...typeTokens(reflection.type, depth)
      ];
    }
    case KIND.Interface: {
      const extended = reflection.extendedTypes?.length
        ? [t(' extends ', 'keyword'), ...joinTypes(reflection.extendedTypes)]
        : [];
      return [
        t('interface ', 'keyword'),
        t(reflection.name, 'type'),
        ...generics,
        ...extended
      ];
    }
    case KIND.Class: {
      const extended = reflection.extendedTypes?.length
        ? [t(' extends ', 'keyword'), ...joinTypes(reflection.extendedTypes)]
        : [];
      return [
        t('class ', 'keyword'),
        t(reflection.name, 'type'),
        ...generics,
        ...extended
      ];
    }
    case KIND.Variable:
      return [
        t(reflection.flags.isConst ? 'const ' : 'let ', 'keyword'),
        t(reflection.name, 'name'),
        t(': '),
        ...typeTokens(reflection.type)
      ];
    case KIND.Namespace:
      return [t('namespace ', 'keyword'), t(reflection.name, 'type')];
    default:
      return [t(reflection.name, 'name')];
  }
}

function joinTypes(types: SomeType[]): Token[] {
  return types.flatMap((type, i) => [
    ...(i > 0 ? [t(', ')] : []),
    ...typeTokens(type)
  ]);
}

// Members -----------------------------------------------------------------

export interface Member {
  name: string;
  reflection: Reflection;
  optional: boolean;
  readonly: boolean;
  /** The member's type, or its first call signature. */
  type?: SomeType;
  signature?: Signature;
  /** Where the member is documented (its own anchor or an inherited one). */
  link?: string;
}

const byId = new Map<number, Reflection>();
(function walk(reflections: Reflection[] | undefined) {
  for (const reflection of reflections ?? []) {
    byId.set(reflection.id, reflection);
    walk(reflection.children);
  }
})([
  ...(project.children ?? []),
  ...packageModels.flatMap(model => model.project.children ?? [])
]);

const memberOf = (reflection: Reflection): Member => ({
  name: reflection.name,
  reflection,
  optional: Boolean(reflection.flags.isOptional),
  readonly: Boolean(reflection.flags.isReadonly),
  type: reflection.type,
  signature: reflection.signatures?.[0],
  link: linkTo(reflection.id)
});

/** Keys named by a literal or a union of literals (`Omit<T, 'a' | 'b'>`). */
function literalKeys(type: SomeType | undefined): string[] {
  if (!type) {
    return [];
  }
  if (type.type === 'literal' && typeof type.value === 'string') {
    return [type.value];
  }
  return type.type === 'union' ? type.types.flatMap(literalKeys) : [];
}

/**
 * The members of an object-like type, resolving what TypeDoc leaves as
 * written: references to interfaces and type aliases, intersections (later
 * members win), `Omit`, `Pick`, `Partial`, `Readonly`, `Required`,
 * `NonNullable`, indexed access (`Options['axisX']`) and unions with
 * `undefined`. Undefined for types that aren't objects.
 */
export function membersOf(
  type: SomeType | undefined,
  seen = new Set<number>()
): Member[] | undefined {
  if (!type) {
    return undefined;
  }
  switch (type.type) {
    case 'reflection':
      return type.declaration.signatures?.length &&
        !type.declaration.children?.length
        ? undefined
        : (type.declaration.children ?? []).map(memberOf);
    case 'intersection': {
      const merged = new Map<string, Member>();
      for (const part of type.types) {
        for (const member of membersOf(part, seen) ?? []) {
          merged.set(member.name, member);
        }
      }
      return merged.size ? [...merged.values()] : undefined;
    }
    case 'union': {
      // `X | undefined`: the members of X.
      const defined = type.types.filter(
        member =>
          !(
            member.type === 'intrinsic' &&
            (member.name === 'undefined' || member.name === 'null')
          )
      );
      return defined.length === 1 ? membersOf(defined[0], seen) : undefined;
    }
    case 'indexedAccess': {
      const [key] = literalKeys(type.indexType);
      const member = key
        ? membersOf(type.objectType, seen)?.find(
            candidate => candidate.name === key
          )
        : undefined;
      return member ? membersOf(member.type, seen) : undefined;
    }
    case 'typeOperator':
      return type.operator === 'readonly'
        ? membersOf(type.target, seen)
        : undefined;
    case 'reference': {
      const args = type.typeArguments ?? [];
      switch (type.name) {
        case 'Omit': {
          const keys = new Set(literalKeys(args[1]));
          return membersOf(args[0], seen)?.filter(
            member => !keys.has(member.name)
          );
        }
        case 'Pick': {
          const keys = new Set(literalKeys(args[1]));
          return membersOf(args[0], seen)?.filter(member =>
            keys.has(member.name)
          );
        }
        case 'Partial':
          return membersOf(args[0], seen)?.map(member => ({
            ...member,
            optional: true
          }));
        case 'Required':
          return membersOf(args[0], seen)?.map(member => ({
            ...member,
            optional: false
          }));
        case 'Readonly':
        case 'NonNullable':
          return membersOf(args[0], seen);
      }
      if (typeof type.target !== 'number' || seen.has(type.target)) {
        return undefined;
      }
      const target = byId.get(type.target);
      if (!target) {
        return undefined;
      }
      const next = new Set(seen).add(type.target);
      if (target.kind === KIND.Interface || target.kind === KIND.Class) {
        return (target.children ?? [])
          .filter(
            child => !child.flags.isPrivate && child.kind !== KIND.Constructor
          )
          .map(memberOf);
      }
      return target.kind === KIND.TypeAlias
        ? membersOf(target.type, next)
        : undefined;
    }
    default:
      return undefined;
  }
}

/** The members an entry documents: its own, or those of its object type. */
export function entryMembers(entry: ApiEntry): Member[] {
  const reflection = entry.reflection;
  if (reflection.kind === KIND.Interface) {
    return (reflection.children ?? []).map(memberOf);
  }
  if (reflection.kind === KIND.Class) {
    return (reflection.children ?? [])
      .filter(child => child.kind !== KIND.Constructor)
      .map(memberOf);
  }
  if (reflection.kind === KIND.TypeAlias) {
    return membersOf(reflection.type) ?? [];
  }
  return [];
}

/** A member's type: its type, or a method's call signature as a function type. */
export function memberTypeTokens(member: Member, collapse = false): Token[] {
  return member.signature
    ? [
        ...typeParametersTokens(member.signature.typeParameters),
        ...parametersTokens(member.signature),
        t(' => '),
        ...typeTokens(member.signature.type)
      ]
    : typeTokens(member.type, collapse ? 2 : 0);
}
