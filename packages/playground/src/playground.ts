import {
  stackblitzAction,
  type PlaygroundAction,
  type PlaygroundContext
} from './actions.ts';
import { createPreview } from './run.ts';
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
  /**
   * Order of the editor tabs; other files follow alphabetically. The first
   * tab is open when the playground starts.
   */
  tabs?: string[];
  /** Load the CodeMirror editor. Defaults to `true`. */
  editor?: boolean;
  /** Re-render delay after the last edit, in ms. Defaults to 300. */
  debounce?: number;
  /**
   * `inline` (default): a block in a page. `full`: fills its element, with
   * the editor and the preview side by side.
   */
  layout?: 'inline' | 'full';
  /**
   * Toolbar buttons, in order (see actions.ts). Defaults to
   * `[stackblitzAction({ chartistVersion })]`.
   */
  actions?: PlaygroundAction[];
  /** npm range of `chartist` for the default StackBlitz action. */
  chartistVersion?: string;
  /** After an edit (debounced like rendering) or a reset, with the files. */
  onChange?: (files: PlaygroundFiles) => void;
  /** Every message from the preview (errors, console, ready). */
  onMessage?: (message: PreviewMessage) => void;
  /** After each compile, with its duration in ms. */
  onCompile?: (result: { diagnostics: Diagnostic[]; time: number }) => void;
}

export interface Playground extends PlaygroundContext {
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
 * Mounts editor tabs, a sandboxed preview, toolbar actions and an
 * error/console panel into `element`. Framework-free, so any page can call
 * it; pages theme it with the `--pg-*` custom properties (playground.css).
 */
export async function createPlayground(
  element: HTMLElement,
  options: PlaygroundOptions
): Promise<Playground> {
  let original = { ...options.files };
  let files = { ...original };
  let title = options.title ?? 'Chartist example';
  let timer: ReturnType<typeof setTimeout> | undefined;

  element.classList.add(
    'playground',
    `playground-${options.layout ?? 'inline'}`
  );
  element.innerHTML = `
    <div class="playground-toolbar">
      <div class="playground-tabs" role="tablist"></div>
      <div class="playground-actions"></div>
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

  const preview = createPreview($('.playground-output'), {
    ...options,
    files,
    title,
    onMessage: message => {
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
    onCompile: result => {
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
    }
  });
  preview.iframe.className = 'playground-preview';

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

  const render = async () => {
    clearTimeout(timer);
    await preview.setFiles(files);
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void render();
      options.onChange?.({ ...files });
    }, options.debounce ?? 300);
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

  const load = async (next: PlaygroundFiles) => {
    files = { ...next };
    await mountEditor();
    // The first tab in the given order, else src/main.ts.
    const order = fileOrder();
    openTab(
      options.tabs?.length || !order.includes('src/main.ts')
        ? order[0]
        : 'src/main.ts'
    );
  };

  const playground: Playground = {
    get files() {
      return files;
    },
    get title() {
      return title;
    },
    get activeFile() {
      return active;
    },
    async reset() {
      await Promise.all([load(original), render()]);
      options.onChange?.({ ...files });
    },
    async setFiles(next, nextTitle) {
      title = nextTitle ?? title;
      preview.iframe.title = title;
      original = { ...next };
      await Promise.all([load(original), render()]);
    },
    updateFile(file, content) {
      files[file] = content;
      schedule();
    },
    render,
    async setPreviewStyles(css) {
      await preview.setPreviewStyles(css);
    },
    destroy() {
      clearTimeout(timer);
      editor?.destroy();
      preview.destroy();
      element.replaceChildren();
      element.classList.remove(
        'playground',
        `playground-${options.layout ?? 'inline'}`
      );
    }
  };

  const actions = options.actions ?? [
    stackblitzAction({ chartistVersion: options.chartistVersion })
  ];
  $('.playground-actions').replaceChildren(
    ...actions.map(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'playground-action';
      button.textContent = action.label;
      if (action.title) {
        button.title = action.title;
        button.setAttribute('aria-label', action.title);
      }
      button.addEventListener(
        'click',
        () => void action.run(playground, button)
      );
      return button;
    })
  );

  await Promise.all([load(files), render()]);
  return playground;
}
