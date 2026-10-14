/** Swaps a live example's static code for the playground on "Edit". */
// Served by integrations/playground-lib.mjs, with compat.js next to it.
const LIB = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}playground-lib/`;
const chartistUrl = `${LIB}index.js`;
const stylesUrl = `${LIB}index.css`;

/**
 * Page tokens the preview needs to look like the page. Raw values, so
 * var() references in them resolve inside the preview as well.
 */
const TOKENS = [
  '--ink',
  '--ink-2',
  '--surface',
  '--line',
  '--font-body',
  '--ct-label-color',
  '--ct-label-size',
  '--ct-grid-color',
  '--ct-grid-dasharray',
  '--ct-line-width',
  '--ct-point-size',
  '--ct-bar-width',
  '--ct-area-opacity',
  '--ct-donut-width',
  ...'abcdefghijklmno'.split('').map(letter => `--ct-series-${letter}`)
];

/** CSS that gives the preview the page's current theme. */
function previewStyles(): string {
  const root = getComputedStyle(document.documentElement);
  const tokens = TOKENS.map(
    name => `${name}: ${root.getPropertyValue(name).trim()};`
  ).join(' ');
  return `:root { ${tokens} color-scheme: ${root.colorScheme}; }
html, body { margin: 0; color: var(--ink); font-family: var(--font-body); }
body {
  background-color: var(--surface);
  background-image: radial-gradient(var(--line) 1px, transparent 1px);
  background-size: 16px 16px;
  padding: 16px 20px;
}`;
}

interface LiveConfig {
  files: Record<string, string>;
  title: string;
  /** The file shown before editing; the editor opens on it. */
  show: string;
}

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
    chartistUrl: new URL(chartistUrl, location.href).href,
    stylesUrl: new URL(stylesUrl, location.href).href,
    previewStyles: previewStyles(),
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
      void preview.setPreviewStyles(previewStyles());
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
    root.querySelector('[data-live-copy]')?.addEventListener('click', event => {
      const button = event.currentTarget as HTMLElement;
      navigator.clipboard.writeText(config.files[config.show]).then(
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
        const { copyAction, createPlayground, resetAction, stackblitzAction } =
          await import('@chartist/playground');
        const playground = await createPlayground(host, {
          files: config.files,
          title: config.title,
          tabs: [...new Set([config.show, 'src/main.ts', 'index.html'])],
          chartistUrl: new URL(chartistUrl, location.href).href,
          stylesUrl: new URL(stylesUrl, location.href).href,
          previewStyles: previewStyles(),
          actions: [resetAction(), copyAction(), stackblitzAction()]
        });
        // The preview follows the theme toggle.
        new MutationObserver(
          () => void playground.setPreviewStyles(previewStyles())
        ).observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme']
        });
        root.dataset.ready = '';
      });
  }
}
