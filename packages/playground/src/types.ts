/** Example project files: path (e.g. `src/main.ts`) → content. */
export type PlaygroundFiles = Record<string, string>;

export type TransformerName = 'sucrase' | 'ts-blank-space';

/** A problem found while compiling, before anything runs. */
export interface Diagnostic {
  file: string;
  message: string;
  /** 1-based line, when known. */
  line?: number;
  /** 1-based column, when known. */
  column?: number;
}

export interface CompileOptions {
  /**
   * URL the bare specifier `chartist` resolves to. Relative to `baseUrl`.
   * `chartist/compat` resolves to `compat.js` next to it.
   */
  chartistUrl: string;
  /** URL of the Chartist stylesheet (`chartist/styles.css`). Relative to `baseUrl`. */
  stylesUrl: string;
  /** Base for relative library URLs. Defaults to `document.baseURI` in browsers. */
  baseUrl?: string;
  /** Type stripper. Defaults to `sucrase`. */
  transformer?: TransformerName;
  /**
   * Extra bare specifier → URL entries for the import map. A static import
   * of a `.css` name among them (`import 'pkg/styles.css'`) links that URL
   * as a stylesheet.
   */
  imports?: Record<string, string>;
  /** Identifies this render in messages from the preview. */
  runId?: string;
  /**
   * CSS for the preview document, before the example's own styles (which
   * can override it). The docs site passes its theme here.
   */
  previewStyles?: string;
}

export interface CompileResult {
  /** Document for the preview iframe's `srcdoc`, or `null` on errors. */
  html: string | null;
  diagnostics: Diagnostic[];
  /** Transform time in milliseconds (type stripping and import rewriting). */
  time: number;
}

/** Messages the preview posts to its parent. */
export type PreviewMessage =
  | { type: 'ready' }
  | {
      type: 'error';
      message: string;
      file?: string;
      line?: number;
      column?: number;
    }
  | {
      type: 'console';
      level: 'log' | 'info' | 'warn' | 'error' | 'debug';
      args: string[];
    };

export const MESSAGE_SOURCE = 'chartist-playground';
