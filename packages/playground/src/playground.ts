import { compile } from './compile.ts';
import { Preview } from './preview.ts';
import { openInStackblitz } from './stackblitz.ts';
import type {
  CompileOptions,
  Diagnostic,
  PlaygroundFiles,
  PreviewMessage
} from './types.ts';
import './playground.css';

export interface PlaygroundOptions extends Omit<
  CompileOptions,
  'runId' | 'baseUrl'
> {
  files: PlaygroundFiles;
  /** Title for the preview frame and the StackBlitz project. */
  title?: string;
  /** Order of the editor tabs; other files follow alphabetically. */
  tabs?: string[];
  /** Load the CodeMirror editor. Defaults to `true`. */
  editor?: boolean;
  /** Re-render delay after the last edit, in ms. Defaults to 300. */
  debounce?: number;
  /** npm range of `chartist` for the StackBlitz export. */
  chartistVersion?: string;
  /** Every message from the preview (errors, console, ready). */
  onMessage?: (message: PreviewMessage) => void;
  /** After each compile, with its duration in ms. */
  onCompile?: (result: { diagnostics: Diagnostic[]; time: number }) => void;
}

export interface Playground {
  readonly files: PlaygroundFiles;
  /** Replaces all files (e.g. another example) and renders. */
  setFiles(files: PlaygroundFiles, title?: string): Promise<void>;
  /** Changes one file and schedules a render, as an edit would. */
  updateFile(file: string, content: string): void;
  render(): Promise<void>;
  /** Replaces the preview's extra CSS (e.g. on a theme change) and renders. */
  setPreviewStyles(css: string): Promise<void>;
  destroy(): void;
}

const DEFAULT_TABS = ['index.html', 'src/main.ts', 'src/style.css'];

/**
 * Mounts editor tabs, a sandboxed preview and an error/console panel into
 * `element`. Framework-free, so the docs site can call it from any page.
 */
export async function createPlayground(
  element: HTMLElement,
  options: PlaygroundOptions
): Promise<Playground> {
  let files = { ...options.files };
  let title = options.title ?? 'Chartist example';
  let run = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  element.classList.add('playground');
  element.innerHTML = `
    <div class="playground-toolbar">
      <div class="playground-tabs" role="tablist"></div>
      <button type="button" class="playground-stackblitz">Open in StackBlitz</button>
    </div>
    <div class="playground-main">
      <div class="playground-editor"></div>
      <div class="playground-output"></div>
    </div>
    <div class="playground-panel">
      <ul class="playground-errors" aria-live="polite"></ul>
      <ul class="playground-console"></ul>
    </div>`;
  const $ = <T extends HTMLElement>(selector: string) =>
    element.querySelector(selector) as T;
  const tabs = $<HTMLDivElement>('.playground-tabs');
  const errors = $<HTMLUListElement>('.playground-errors');
  const consoleList = $<HTMLUListElement>('.playground-console');

  const addEntry = (list: HTMLElement, className: string, text: string) => {
    const item = document.createElement('li');
    item.className = className;
    item.textContent = text;
    list.append(item);
  };
  const where = (d: { file?: string; line?: number; column?: number }) =>
    d.file
      ? `${d.file}${d.line ? `:${d.line}${d.column ? `:${d.column}` : ''}` : ''}: `
      : '';

  const preview = new Preview(
    $('.playground-output'),
    message => {
      if (message.type === 'error') {
        addEntry(
          errors,
          'playground-error',
          `${where(message)}${message.message}`
        );
      } else if (message.type === 'console') {
        addEntry(
          consoleList,
          `playground-log playground-log-${message.level}`,
          message.args.join(' ')
        );
      }
      options.onMessage?.(message);
    },
    title
  );

  let editor: import('./editor.ts').Editor | undefined;
  let active = '';

  const fileOrder = () => {
    const order = options.tabs ?? DEFAULT_TABS;
    return Object.keys(files).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
  };

  const renderTabs = () => {
    tabs.replaceChildren(
      ...fileOrder().map(file => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.role = 'tab';
        tab.className = 'playground-tab';
        tab.textContent = file;
        tab.dataset.file = file;
        tab.setAttribute('aria-selected', String(file === active));
        tab.addEventListener('click', () => openTab(file));
        return tab;
      })
    );
  };

  const openTab = (file: string) => {
    active = file;
    editor?.open(file);
    renderTabs();
  };

  let previewStyles = options.previewStyles;

  const render = async () => {
    clearTimeout(timer);
    const runId = `run-${++run}`;
    const result = await compile(files, { ...options, previewStyles, runId });
    // A newer render started while this one compiled.
    if (runId !== `run-${run}`) {
      return;
    }
    options.onCompile?.(result);
    errors.replaceChildren();
    if (!result.html) {
      // Keep the last good preview visible and show what's wrong.
      for (const diagnostic of result.diagnostics) {
        addEntry(
          errors,
          'playground-error',
          `${where(diagnostic)}${diagnostic.message}`
        );
      }
      element.dataset.state = 'error';
      return;
    }
    consoleList.replaceChildren();
    element.dataset.state = 'ok';
    preview.render(result.html, runId);
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(render, options.debounce ?? 300);
  };

  const mountEditor = async () => {
    editor?.destroy();
    if (options.editor === false) {
      return;
    }
    const { createEditor } = await import('./editor.ts');
    editor = createEditor($('.playground-editor'), files, (file, content) => {
      files[file] = content;
      schedule();
    });
  };

  $('.playground-stackblitz').addEventListener('click', () => {
    void openInStackblitz(files, {
      title,
      chartistVersion: options.chartistVersion ?? 'latest'
    });
  });

  const load = async (next: PlaygroundFiles) => {
    files = { ...next };
    await mountEditor();
    openTab(
      fileOrder().includes('src/main.ts') ? 'src/main.ts' : fileOrder()[0]
    );
  };

  await Promise.all([load(files), render()]);

  return {
    get files() {
      return files;
    },
    async setFiles(next, nextTitle) {
      title = nextTitle ?? title;
      preview.iframe.title = title;
      files = { ...next };
      await Promise.all([load(files), render()]);
    },
    updateFile(file, content) {
      files[file] = content;
      schedule();
    },
    render,
    setPreviewStyles(css) {
      previewStyles = css;
      return render();
    },
    destroy() {
      clearTimeout(timer);
      editor?.destroy();
      preview.destroy();
      element.replaceChildren();
    }
  };
}
