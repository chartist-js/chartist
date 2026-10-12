import type { Diagnostic, TransformerName } from './types.ts';

/** Strips TypeScript syntax. Throws a `CompileError` on syntax errors. */
export type Transformer = (code: string, file: string) => string;

export class CompileError extends Error {
  readonly diagnostic: Diagnostic;

  constructor(diagnostic: Diagnostic) {
    super(diagnostic.message);
    this.diagnostic = diagnostic;
  }
}

const cache = new Map<TransformerName, Promise<Transformer>>();

/** Loads a transformer lazily, so only the selected one is downloaded. */
export function loadTransformer(name: TransformerName): Promise<Transformer> {
  let transformer = cache.get(name);
  if (!transformer) {
    transformer = name === 'sucrase' ? loadSucrase() : loadTsBlankSpace();
    cache.set(name, transformer);
  }
  return transformer;
}

async function loadSucrase(): Promise<Transformer> {
  const { transform } = await import('sucrase');
  return (code, file) => {
    try {
      return transform(code, {
        transforms: ['typescript'],
        disableESTransforms: true,
        filePath: file
      }).code;
    } catch (error) {
      const err = error as Error & { loc?: { line: number; column: number } };
      throw new CompileError({
        file,
        // "Error transforming src/main.ts: Unexpected token (3:5)"
        message: err.message
          .replace(/^Error transforming [^:]+: /, '')
          .replace(/ \(\d+:\d+\)$/, ''),
        line: err.loc?.line,
        // sucrase columns are already 1-based.
        column: err.loc?.column
      });
    }
  };
}

async function loadTsBlankSpace(): Promise<Transformer> {
  const [{ blankSourceFile }, { default: ts }] = await Promise.all([
    import('ts-blank-space'),
    import('typescript')
  ]);
  return (code, file) => {
    const source = ts.createSourceFile(
      file,
      code,
      { languageVersion: ts.ScriptTarget.ESNext },
      true,
      ts.ScriptKind.TS
    );
    // ts-blank-space doesn't report parse errors itself, and TypeScript's
    // parser recovers from them. They are on an internal field.
    const parseErrors = (
      source as unknown as {
        parseDiagnostics?: import('typescript').Diagnostic[];
      }
    ).parseDiagnostics;
    if (parseErrors?.length) {
      throw new CompileError(toDiagnostic(ts, file, source, parseErrors[0]));
    }
    let unsupported: import('typescript').Node | undefined;
    const output = blankSourceFile(source, node => {
      unsupported ??= node;
    });
    if (unsupported) {
      const pos = source.getLineAndCharacterOfPosition(unsupported.getStart());
      throw new CompileError({
        file,
        message: `Unsupported TypeScript syntax (only erasable syntax works): ${ts.SyntaxKind[unsupported.kind]}`,
        line: pos.line + 1,
        column: pos.character + 1
      });
    }
    return output;
  };
}

function toDiagnostic(
  ts: typeof import('typescript'),
  file: string,
  source: import('typescript').SourceFile,
  diagnostic: import('typescript').Diagnostic
): Diagnostic {
  const pos = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  return {
    file,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    line: pos.line + 1,
    column: pos.character + 1
  };
}
