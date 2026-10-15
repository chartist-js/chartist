/**
 * A TypeScript language service over an example's files.
 * Plain module: the worker runs it, and the unit tests run it in Node.
 */
import type * as TS from 'typescript';
import type {
  TypeCompletion,
  TypeCompletionDetails,
  TypeCompletions,
  TypeDiagnostic,
  TypeQuickInfo
} from './protocol.ts';

/** Chartist's declarations, from the build the preview runs. */
export interface Declarations {
  /** `index.d.ts`; without it, `chartist` imports are untyped. */
  readonly index?: string;
  /** `compat.d.ts` (it imports `./index.js`). */
  readonly compat?: string;
  /** Other packages' `index.d.ts` by bare name, e.g. `@chartist-js/terminal`. */
  readonly packages?: Readonly<Record<string, string>>;
}

export interface ProjectOptions {
  readonly ts: typeof TS;
  /** Lib file name (`lib.es5.d.ts`) → content. */
  readonly libs: Readonly<Record<string, string>>;
  readonly declarations: Declarations;
  /** Bare imports without types (the host's extra `imports`). */
  readonly untyped?: readonly string[];
  /** Shared between projects, so the lib files are parsed once. */
  readonly registry?: TS.DocumentRegistry;
}

export interface Project {
  /** Replaces the example's files; only `.ts` files are checked. */
  update(files: Readonly<Record<string, string>>): void;
  diagnostics(file: string): TypeDiagnostic[];
  completions(
    file: string,
    position: number,
    trigger?: string
  ): TypeCompletions | null;
  completionDetails(
    file: string,
    position: number,
    entry: TypeCompletion
  ): TypeCompletionDetails | null;
  quickInfo(file: string, position: number): TypeQuickInfo | null;
  dispose(): void;
}

/** Lib files live at the top, shared by all projects. */
const LIB_ROOT = '/';
let projects = 0;

/**
 * The examples' `tsconfig.json` (packages/examples), without
 * `types: ["vite/client"]`, and without the unused-code checks: they flag
 * every half-typed line while someone edits.
 */
function compilerOptions(ts: typeof TS): TS.CompilerOptions {
  return {
    strict: true,
    noFallthroughCasesInSwitch: true,
    noImplicitReturns: true,
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    erasableSyntaxOnly: true,
    isolatedModules: true,
    moduleDetection: ts.ModuleDetectionKind.Force,
    noEmit: true,
    types: []
  };
}

/** `declare module` for CSS, extra imports, and a missing `chartist`. */
function ambient(declarations: Declarations, untyped: readonly string[]) {
  const modules = ['*.css', ...untyped];
  if (!declarations.index) {
    modules.push('chartist', 'chartist/*');
  }
  return modules.map(name => `declare module '${name}';`).join('\n');
}

export function createProject(options: ProjectOptions): Project {
  const { ts, libs, declarations } = options;
  const registry = options.registry ?? ts.createDocumentRegistry();
  const settings = compilerOptions(ts);
  // The registry caches files by path and version, so every project needs
  // paths of its own.
  const ROOT = `/project-${++projects}/`;
  const CHARTIST = `${ROOT}node_modules/chartist/`;
  const AMBIENT = `${ROOT}ambient.d.ts`;

  // Path → content and version. Fixed files never change version.
  const fixed = new Map<string, string>();
  for (const [name, content] of Object.entries(libs)) {
    fixed.set(LIB_ROOT + name, content);
  }
  fixed.set(AMBIENT, ambient(declarations, options.untyped ?? []));
  if (declarations.index) {
    fixed.set(
      `${CHARTIST}package.json`,
      JSON.stringify({
        name: 'chartist',
        type: 'module',
        exports: {
          '.': { types: './index.d.ts' },
          './compat': { types: './compat.d.ts' }
        }
      })
    );
    fixed.set(`${CHARTIST}index.d.ts`, declarations.index);
    if (declarations.compat) {
      fixed.set(`${CHARTIST}compat.d.ts`, declarations.compat);
    }
  }
  // Other packages, e.g. @chartist-js/terminal; they import `chartist`.
  for (const [name, index] of Object.entries(declarations.packages ?? {})) {
    const directory = `${ROOT}node_modules/${name}/`;
    fixed.set(
      `${directory}package.json`,
      JSON.stringify({
        name,
        type: 'module',
        exports: { '.': { types: './index.d.ts' } }
      })
    );
    fixed.set(`${directory}index.d.ts`, index);
  }
  const files = new Map<string, { content: string; version: number }>();

  const read = (path: string) => fixed.get(path) ?? files.get(path)?.content;
  const directories = new Set<string>();
  const addDirectories = (path: string) => {
    for (
      let i = path.lastIndexOf('/');
      i > 0;
      i = path.lastIndexOf('/', i - 1)
    ) {
      directories.add(path.slice(0, i));
    }
  };
  for (const path of fixed.keys()) {
    addDirectories(path);
  }

  const host: TS.LanguageServiceHost = {
    getCompilationSettings: () => settings,
    getScriptFileNames: () => [
      AMBIENT,
      ...[...files.keys()].filter(path => path.endsWith('.ts'))
    ],
    getScriptVersion: path => String(files.get(path)?.version ?? 0),
    getScriptSnapshot: path => {
      const content = read(path);
      return content === undefined
        ? undefined
        : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => ROOT,
    getDefaultLibFileName: () => `${LIB_ROOT}lib.d.ts`,
    fileExists: path => read(path) !== undefined,
    readFile: path => read(path),
    directoryExists: path => path === LIB_ROOT || directories.has(path),
    getDirectories: () => []
  };
  const service = ts.createLanguageService(host, registry);

  const path = (file: string) => ROOT + file;
  const text = (parts?: readonly TS.SymbolDisplayPart[]) =>
    ts.displayPartsToString(parts as TS.SymbolDisplayPart[] | undefined);
  const documentation = (
    parts?: readonly TS.SymbolDisplayPart[],
    tags?: readonly TS.JSDocTagInfo[]
  ) =>
    [
      text(parts),
      ...(tags ?? [])
        // @param is in the signature already.
        .filter(tag => tag.name !== 'param')
        .map(tag => `@${tag.name} ${text(tag.text)}`.trim())
    ]
      .filter(Boolean)
      .join('\n\n');

  return {
    update(next) {
      // Deleting while iterating a Map is safe.
      for (const name of files.keys()) {
        if (!(name.slice(ROOT.length) in next)) {
          files.delete(name);
        }
      }
      for (const [file, content] of Object.entries(next)) {
        const name = path(file);
        const current = files.get(name);
        if (current?.content !== content) {
          files.set(name, {
            content,
            version: (current?.version ?? 0) + 1
          });
          addDirectories(name);
        }
      }
    },

    diagnostics(file) {
      const name = path(file);
      if (!files.has(name) || !name.endsWith('.ts')) {
        return [];
      }
      return [
        ...service.getSyntacticDiagnostics(name),
        ...service.getSemanticDiagnostics(name)
      ].map(diagnostic => ({
        from: diagnostic.start ?? 0,
        to: (diagnostic.start ?? 0) + (diagnostic.length ?? 0),
        severity:
          diagnostic.category === ts.DiagnosticCategory.Error
            ? 'error'
            : diagnostic.category === ts.DiagnosticCategory.Warning
              ? 'warning'
              : 'info',
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        code: diagnostic.code
      }));
    },

    completions(file, position, trigger) {
      const result = service.getCompletionsAtPosition(path(file), position, {
        triggerCharacter: trigger as TS.CompletionsTriggerCharacter,
        includeCompletionsWithInsertText: true
      });
      if (!result) {
        return null;
      }
      return {
        entries: result.entries
          // JavaScript-only guesses from identifiers in the file.
          .filter(entry => entry.kind !== ts.ScriptElementKind.warning)
          .map(entry => ({
            name: entry.name,
            kind: entry.kind,
            sortText: entry.sortText,
            insertText: entry.insertText,
            source: entry.source,
            data: entry.data
          }))
      };
    },

    completionDetails(file, position, entry) {
      const details = service.getCompletionEntryDetails(
        path(file),
        position,
        entry.name,
        undefined,
        entry.source,
        undefined,
        entry.data as TS.CompletionEntryData | undefined
      );
      return details
        ? {
            signature: text(details.displayParts),
            documentation: documentation(details.documentation, details.tags)
          }
        : null;
    },

    quickInfo(file, position) {
      const info = service.getQuickInfoAtPosition(path(file), position);
      if (!info) {
        return null;
      }
      return {
        from: info.textSpan.start,
        to: info.textSpan.start + info.textSpan.length,
        signature: text(info.displayParts),
        documentation: documentation(info.documentation, info.tags)
      };
    },

    dispose() {
      service.dispose();
    }
  };
}
