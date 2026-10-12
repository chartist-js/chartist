import { MESSAGE_SOURCE } from './types.ts';

/**
 * Runs first in the preview document (classic script). Forwards errors and
 * console output to the host. Module files carry a `//# sourceURL=` comment,
 * which maps data URLs in error positions back to example file names.
 */
function bootstrap(source: string, runId: string) {
  const post = (message: Record<string, unknown>) => {
    try {
      parent.postMessage({ source, runId, ...message }, '*');
    } catch {
      // The host is gone or the message isn't cloneable; nothing to do.
    }
  };

  const fileOf = (url: string | undefined) => {
    if (!url) {
      return undefined;
    }
    if (url.startsWith('data:')) {
      try {
        const code = decodeURIComponent(url.slice(url.indexOf(',') + 1));
        const match = /\/\/# sourceURL=(\S+)\s*$/.exec(code);
        return match ? match[1] : 'module';
      } catch {
        return 'module';
      }
    }
    return url.startsWith('about:') ? 'index.html' : url;
  };

  const format = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }
    if (value instanceof Node) {
      return `<${value.nodeName.toLowerCase()}>`;
    }
    try {
      const json = JSON.stringify(value);
      return json === undefined ? String(value) : json;
    } catch {
      return String(value);
    }
  };

  addEventListener(
    'error',
    (event: Event) => {
      if (event instanceof ErrorEvent) {
        const error = event.error as Error | undefined;
        post({
          type: 'error',
          message:
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : event.message,
          file: fileOf(event.filename),
          line: event.lineno || undefined,
          column: event.colno || undefined
        });
      } else if (event.target instanceof HTMLScriptElement) {
        // A module (or one of its imports) failed to load: 404, CORS, ...
        post({
          type: 'error',
          message: `Failed to load a module script${
            event.target.src ? ` (${event.target.src})` : ''
          }. Check the import URLs and CORS headers.`
        });
      }
    },
    true
  );

  addEventListener('unhandledrejection', event => {
    post({
      type: 'error',
      message: `Unhandled rejection: ${format(event.reason)}`
    });
  });

  const levels = ['log', 'info', 'warn', 'error', 'debug'] as const;
  for (const level of levels) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      post({ type: 'console', level, args: args.map(format) });
      original(...args);
    };
  }

  addEventListener('load', () => post({ type: 'ready' }));
}

/** The bootstrap as an inline `<script>` for the preview document. */
export function bootstrapScript(runId: string): string {
  const args = [MESSAGE_SOURCE, runId].map(arg => JSON.stringify(arg));
  return `<script>(${bootstrap.toString()})(${args.join(',')})</script>`;
}
