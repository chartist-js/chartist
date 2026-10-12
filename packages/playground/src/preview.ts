import { MESSAGE_SOURCE, type PreviewMessage } from './types.ts';

/**
 * Owns the sandboxed preview iframe (design D5). Example code runs in an
 * opaque origin: `allow-scripts` only, never `allow-same-origin`.
 */
export class Preview {
  readonly iframe: HTMLIFrameElement;
  #runId = '';
  #onMessage: (message: PreviewMessage) => void;

  constructor(
    container: HTMLElement,
    onMessage: (message: PreviewMessage) => void,
    title = 'Example preview'
  ) {
    this.#onMessage = onMessage;
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('sandbox', 'allow-scripts');
    this.iframe.title = title;
    this.iframe.className = 'playground-preview';
    container.append(this.iframe);
    addEventListener('message', this.#listener);
  }

  /** Shows a compiled document. Messages of earlier runs are ignored. */
  render(html: string, runId: string): void {
    this.#runId = runId;
    this.iframe.srcdoc = html;
  }

  destroy(): void {
    removeEventListener('message', this.#listener);
    this.iframe.remove();
  }

  #listener = (event: MessageEvent) => {
    const data = event.data as
      | (PreviewMessage & { source?: string; runId?: string })
      | undefined;
    if (
      event.source !== this.iframe.contentWindow ||
      data?.source !== MESSAGE_SOURCE ||
      data.runId !== this.#runId
    ) {
      return;
    }
    this.#onMessage(data);
  };
}
