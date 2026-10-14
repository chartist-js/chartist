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
 * Only compile() and the preview load here, not the editor.
 */
async function runInPlace(root: HTMLElement, config: LiveConfig) {
  const stage = root.querySelector<HTMLElement>('[data-live-stage]');
  if (!stage) {
    return;
  }
  const [{ compile }, { Preview }] = await Promise.all([
    import('@chartist/playground/compile'),
    import('@chartist/playground/preview')
  ]);
  if (root.classList.contains('editing')) {
    return;
  }
  let failed = false;
  const preview = new Preview(
    stage,
    message => {
      // The static chart stays when the example fails in view mode; Edit
      // shows the error.
      if (message.type === 'error' && !failed) {
        failed = true;
        preview.iframe.hidden = true;
      }
    },
    config.title
  );
  preview.iframe.className = 'absolute inset-0 size-full border-0';
  preview.iframe.tabIndex = -1;
  preview.iframe.setAttribute('aria-hidden', 'true');
  const render = async () => {
    if (!preview.iframe.isConnected) {
      return;
    }
    const runId = `view-${Math.random().toString(36).slice(2)}`;
    const result = await compile(config.files, {
      chartistUrl: new URL(chartistUrl, location.href).href,
      stylesUrl: new URL(stylesUrl, location.href).href,
      previewStyles: previewStyles(),
      runId
    });
    if (result.html) {
      preview.render(result.html, runId);
    }
  };
  await render();
  new MutationObserver(() => void render()).observe(document.documentElement, {
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
        const { createPlayground } = await import('@chartist/playground');
        const playground = await createPlayground(host, {
          files: config.files,
          title: config.title,
          tabs: [...new Set([config.show, 'src/main.ts', 'index.html'])],
          chartistUrl: new URL(chartistUrl, location.href).href,
          stylesUrl: new URL(stylesUrl, location.href).href,
          previewStyles: previewStyles()
        });
        // The preview follows the theme toggle.
        new MutationObserver(
          () => void playground.setPreviewStyles(previewStyles())
        ).observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme']
        });
        // Reset and Copy join the playground's own toolbar.
        const actions = document.createElement('div');
        actions.className = 'live-actions';
        actions.innerHTML =
          '<button class="playground-action" type="button" data-live-reset>Reset</button>' +
          '<button class="playground-action" type="button" data-live-copy-current>Copy</button>';
        host.querySelector('.playground-stackblitz')?.before(actions);
        actions
          .querySelector('[data-live-reset]')!
          .addEventListener('click', () => {
            void playground.setFiles(config.files, config.title);
          });
        actions
          .querySelector('[data-live-copy-current]')!
          .addEventListener('click', () => {
            void navigator.clipboard.writeText(playground.files[config.show]);
          });
        root.dataset.ready = '';
      });
  }
}
