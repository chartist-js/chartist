/** Swaps a live example's static code for the playground on "Edit". */
import {
  CENTER_FRAME,
  FILL_FRAME,
  chartistUrl,
  imports,
  types,
  playgroundForCode,
  playgroundForExample,
  previewStyles,
  stylesUrl
} from './playground-env';

interface LiveConfig {
  files: Record<string, string>;
  title: string;
  /** The file shown before editing; the editor opens on it. */
  show: string;
  /** The 1.x code, shown in a second tab. */
  classic?: string;
  /** A gallery example's id: unedited, the playground opens it by id. */
  id?: string;
}

/**
 * Centered in their preview frame, as the static chart before them; gallery
 * examples (with an id) also fill it.
 */
const stylesFor = (config: LiveConfig) =>
  `${previewStyles()}${config.id ? FILL_FRAME : CENTER_FRAME}`;

/**
 * View mode: runs the example's own code in a sandboxed preview over the
 * static chart, so plugins, events and CSS show without pressing Edit.
 * Only the preview component loads here, not the editor.
 */
async function runInPlace(root: HTMLElement, config: LiveConfig) {
  const stage = root.querySelector<HTMLElement>('[data-live-stage]');
  if (!stage) {
    return;
  }
  const { createPreview } = await import('@chartist/playground/preview');
  if (root.classList.contains('editing')) {
    return;
  }
  const preview = createPreview(stage, {
    files: config.files,
    title: config.title,
    chartistUrl: chartistUrl,
    stylesUrl: stylesUrl,
    imports,
    previewStyles: stylesFor(config),
    // The static chart stays when the example fails in view mode; Edit
    // shows the error.
    onMessage: message => {
      if (message.type === 'error') {
        preview.iframe.hidden = true;
      }
    }
  });
  preview.iframe.className = 'absolute inset-0 size-full border-0';
  preview.iframe.tabIndex = -1;
  preview.iframe.setAttribute('aria-hidden', 'true');
  await preview.render();
  new MutationObserver(() => {
    if (preview.iframe.isConnected) {
      void preview.setPreviewStyles(stylesFor(config));
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

export function mountLiveExamples() {
  for (const root of document.querySelectorAll<HTMLElement>(
    '[data-live-example]'
  )) {
    const config = JSON.parse(root.dataset.liveExample!) as LiveConfig;
    new IntersectionObserver(
      (entries, observer) => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          void runInPlace(root, config);
        }
      },
      { rootMargin: '200px' }
    ).observe(root);
    // The v2 / 1.x switch: which code is shown; Copy copies what's shown.
    let showing: 'main' | 'classic' = 'main';
    const fileLabel = root.querySelector<HTMLElement>('[data-live-file]');
    for (const button of root.querySelectorAll<HTMLElement>(
      '[data-live-version]'
    )) {
      button.addEventListener('click', () => {
        showing = button.dataset.liveVersion as 'main' | 'classic';
        for (const other of root.querySelectorAll('[data-live-version]')) {
          other.setAttribute('aria-pressed', String(other === button));
        }
        for (const panel of root.querySelectorAll<HTMLElement>(
          '[data-live-panel]'
        )) {
          panel.hidden = panel.dataset.livePanel !== showing;
        }
        if (fileLabel) {
          fileLabel.textContent =
            showing === 'classic' ? 'src/main.classic.ts' : config.show;
        }
      });
    }
    root.querySelector('[data-live-copy]')?.addEventListener('click', event => {
      const button = event.currentTarget as HTMLElement;
      const code =
        showing === 'classic' && config.classic
          ? config.classic
          : config.files[config.show];
      navigator.clipboard.writeText(code).then(
        () => button.setAttribute('aria-label', 'Copied'),
        () => button.setAttribute('aria-label', 'Copy failed')
      );
    });
    root
      .querySelector('[data-live-edit]')
      ?.addEventListener('click', async () => {
        const host = document.createElement('div');
        host.className = 'live-playground';
        root.replaceChildren(host);
        root.classList.add('editing');
        const { copyAction, createPlayground, openAction, resetAction } =
          await import('@chartist/playground');
        const unchanged = (files: Record<string, string>) =>
          Object.keys(files).length === Object.keys(config.files).length &&
          Object.entries(files).every(
            ([file, code]) => config.files[file] === code
          );
        const playground = await createPlayground(host, {
          files: config.files,
          title: config.title,
          tabs: [...new Set([config.show, 'src/main.ts', 'index.html'])],
          chartistUrl: chartistUrl,
          stylesUrl: stylesUrl,
          imports,
          types,
          previewStyles: stylesFor(config),
          actions: [
            resetAction(),
            copyAction(),
            // The full-screen playground, with the current (maybe edited) files.
            openAction({
              url: (files, title) =>
                config.id && unchanged(files)
                  ? playgroundForExample(config.id)
                  : playgroundForCode(files, title)
            })
          ]
        });
        // The preview follows the theme toggle.
        new MutationObserver(
          () => void playground.setPreviewStyles(stylesFor(config))
        ).observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme']
        });
        root.dataset.ready = '';
      });
  }
}
