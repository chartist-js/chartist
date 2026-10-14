/**
 * A preview without the editor: compiles example files and runs them in
 * the sandboxed frame. For pages that show examples before anyone edits
 * them (and for the playground itself, which renders through it).
 */
import { compile } from './compile.ts';
import { Preview } from './preview.ts';
import type {
  CompileOptions,
  CompileResult,
  PlaygroundFiles,
  PreviewMessage
} from './types.ts';

export { Preview };

export interface PreviewOptions extends Omit<
  CompileOptions,
  'runId' | 'baseUrl'
> {
  files: PlaygroundFiles;
  /** Title of the preview frame. */
  title?: string;
  /** Every message from the preview (errors, console, ready). */
  onMessage?: (message: PreviewMessage) => void;
  /** After each compile; `html` is null when it failed. */
  onCompile?: (result: CompileResult) => void;
}

export interface PreviewHandle {
  /** The sandboxed frame; style or hide it like any element. */
  readonly iframe: HTMLIFrameElement;
  readonly files: PlaygroundFiles;
  /** Replaces the files and renders. */
  setFiles(files: PlaygroundFiles): Promise<CompileResult>;
  /** Replaces the preview's extra CSS (e.g. on a theme change) and renders. */
  setPreviewStyles(css: string): Promise<CompileResult>;
  /** Compiles and shows the current files. A failed compile keeps the last preview. */
  render(): Promise<CompileResult>;
  destroy(): void;
}

export function createPreview(
  element: HTMLElement,
  options: PreviewOptions
): PreviewHandle {
  let files = { ...options.files };
  let previewStyles = options.previewStyles;
  let run = 0;
  const preview = new Preview(
    element,
    message => options.onMessage?.(message),
    options.title ?? 'Example preview'
  );

  const render = async (): Promise<CompileResult> => {
    const runId = `run-${++run}-${Math.random().toString(36).slice(2, 8)}`;
    const current = run;
    const result = await compile(files, { ...options, previewStyles, runId });
    // A newer render started while this one compiled: drop this one.
    if (current !== run) {
      return result;
    }
    options.onCompile?.(result);
    if (result.html) {
      preview.render(result.html, runId);
    }
    return result;
  };

  return {
    iframe: preview.iframe,
    get files() {
      return files;
    },
    setFiles(next) {
      files = { ...next };
      return render();
    },
    setPreviewStyles(css) {
      previewStyles = css;
      return render();
    },
    render,
    destroy() {
      run++;
      preview.destroy();
    }
  };
}
