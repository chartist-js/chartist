/**
 * Messages between the editor and the type worker. Positions are offsets
 * into the file (UTF-16, as in CodeMirror and TypeScript).
 */

export interface TypeDiagnostic {
  from: number;
  to: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code: number;
}

export interface TypeCompletion {
  name: string;
  /** TypeScript's element kind (`method`, `property`, …). */
  kind: string;
  sortText: string;
  insertText?: string;
  /** For auto-imports; passed back for the details. */
  source?: string;
  data?: unknown;
}

export interface TypeCompletions {
  entries: TypeCompletion[];
}

export interface TypeCompletionDetails {
  signature: string;
  documentation: string;
}

export interface TypeQuickInfo {
  from: number;
  to: number;
  signature: string;
  documentation: string;
}

/** Requests to the worker, by `project` (one per playground). */
export type TypeRequest =
  | {
      type: 'open';
      project: number;
      /** Absolute URL of the directory with `index.d.ts` and `compat.d.ts`. */
      typesUrl: string;
      untyped: string[];
      /** Other typed packages: bare name → absolute URL of its `index.d.ts`. */
      packages?: Record<string, string>;
    }
  | { type: 'update'; project: number; files: Record<string, string> }
  | { type: 'diagnostics'; project: number; file: string }
  | {
      type: 'completions';
      project: number;
      file: string;
      position: number;
      trigger?: string;
    }
  | {
      type: 'completionDetails';
      project: number;
      file: string;
      position: number;
      entry: TypeCompletion;
    }
  | { type: 'quickInfo'; project: number; file: string; position: number }
  | { type: 'close'; project: number };

export type TypeResponse =
  | { id: number; result: unknown }
  | { id: number; error: string };
