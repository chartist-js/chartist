/**
 * The editor's side of the type worker: starts it on demand,
 * keeps the worker's copy of the files current, and asks it questions.
 * One worker per page; each playground is a project in it.
 */
import type {
  TypeCompletion,
  TypeCompletionDetails,
  TypeCompletions,
  TypeDiagnostic,
  TypeQuickInfo,
  TypeRequest,
  TypeResponse
} from './protocol.ts';
import type { PlaygroundFiles } from '../types.ts';

export interface TypeClientOptions {
  /** Directory URL of `index.d.ts`, `compat.d.ts`, `live.d.ts` and `server.d.ts`; relative to the page. */
  url: string;
  /** Bare imports without types (the host's extra `imports`). */
  untyped?: string[];
  /**
   * Other packages with types: bare name → its `index.d.ts`, relative to
   * `url` (e.g. `{ '@chartist-js/terminal': 'terminal/index.d.ts' }`).
   */
  packages?: Record<string, string>;
}

export interface TypeClient {
  /** Starts the worker (once); later calls do nothing. */
  start(): void;
  /** True once the worker has the declarations and the files. */
  readonly ready: boolean;
  /** Called once, when the client becomes ready. */
  onReady(listener: () => void): void;
  /** Each question carries the file's text as the editor has it. */
  diagnostics(file: string, text: string): Promise<TypeDiagnostic[]>;
  completions(
    file: string,
    text: string,
    position: number,
    trigger?: string
  ): Promise<TypeCompletions | null>;
  completionDetails(
    file: string,
    text: string,
    position: number,
    entry: TypeCompletion
  ): Promise<TypeCompletionDetails | null>;
  quickInfo(
    file: string,
    text: string,
    position: number
  ): Promise<TypeQuickInfo | null>;
  destroy(): void;
}

interface Pending {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

let worker: Worker | null | undefined;
let nextId = 0;
let nextProject = 0;
const pending = new Map<number, Pending>();

/** The page's worker, or null if it can't start (plain editing then). */
function sharedWorker(): Worker | null {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
        name: 'chartist-playground-types'
      });
      worker.addEventListener(
        'message',
        (event: MessageEvent<TypeResponse>) => {
          const response = event.data;
          const entry = pending.get(response.id);
          pending.delete(response.id);
          if ('error' in response) {
            entry?.reject(new Error(response.error));
          } else {
            entry?.resolve(response.result);
          }
        }
      );
      worker.addEventListener('error', event => {
        // eslint-disable-next-line no-console
        console.warn('Playground types are unavailable:', event.message);
        for (const entry of pending.values()) {
          entry.reject(new Error('The type worker stopped'));
        }
        pending.clear();
        worker?.terminate();
        worker = null;
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Playground types are unavailable:', error);
      worker = null;
    }
  }
  return worker;
}

function send<T>(request: TypeRequest): Promise<T> {
  const target = sharedWorker();
  if (!target) {
    return Promise.reject(new Error('No type worker'));
  }
  const id = ++nextId;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    target.postMessage({ id, request });
  });
}

export function createTypeClient(
  options: TypeClientOptions,
  files: () => PlaygroundFiles
): TypeClient {
  const project = ++nextProject;
  let started = false;
  let ready = false;
  let closed = false;
  const listeners: Array<() => void> = [];
  // What the worker has, to send only changes.
  let sent: PlaygroundFiles | undefined;

  /** Sends the files, with `file` as the editor has it right now. */
  const sync = async (file: string, text: string) => {
    const current = { ...files(), [file]: text };
    if (
      sent &&
      Object.keys(sent).length === Object.keys(current).length &&
      Object.entries(current).every(
        ([name, content]) => sent?.[name] === content
      )
    ) {
      return;
    }
    sent = { ...current };
    await send({ type: 'update', project, files: sent });
  };

  /**
   * Asks about `text`, the file as the editor had it when it asked (it may
   * have changed since), after syncing. Answers `fallback` when not ready
   * or on errors.
   */
  const ask = async <T>(
    request: TypeRequest & { file: string },
    text: string,
    fallback: T
  ): Promise<T> => {
    if (!ready || closed) {
      return fallback;
    }
    try {
      await sync(request.file, text);
      return await send<T>(request);
    } catch {
      return fallback;
    }
  };

  return {
    start() {
      if (started) {
        return;
      }
      started = true;
      const typesUrl = new URL(
        options.url.replace(/\/?$/, '/'),
        document.baseURI
      ).href;
      const packages = Object.fromEntries(
        Object.entries(options.packages ?? {}).map(([name, path]) => [
          name,
          new URL(path, typesUrl).href
        ])
      );
      send({
        type: 'open',
        project,
        typesUrl,
        untyped: options.untyped ?? [],
        packages
      })
        .then(() => {
          sent = undefined;
        })
        .then(() => {
          if (closed) {
            return;
          }
          ready = true;
          listeners.splice(0).forEach(listener => listener());
        })
        .catch(() => {
          // Logged by the worker's error handler; editing goes on untyped.
        });
    },
    get ready() {
      return ready;
    },
    onReady(listener) {
      if (ready) {
        listener();
      } else {
        listeners.push(listener);
      }
    },
    diagnostics: (file, text) =>
      ask<TypeDiagnostic[]>({ type: 'diagnostics', project, file }, text, []),
    completions: (file, text, position, trigger) =>
      ask(
        { type: 'completions', project, file, position, trigger },
        text,
        null
      ),
    completionDetails: (file, text, position, entry) =>
      ask(
        { type: 'completionDetails', project, file, position, entry },
        text,
        null
      ),
    quickInfo: (file, text, position) =>
      ask({ type: 'quickInfo', project, file, position }, text, null),
    destroy() {
      closed = true;
      listeners.length = 0;
      if (started && worker) {
        void send({ type: 'close', project }).catch(() => undefined);
      }
    }
  };
}
