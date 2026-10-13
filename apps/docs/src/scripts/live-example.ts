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
}

export function mountLiveExamples() {
  for (const root of document.querySelectorAll<HTMLElement>(
    '[data-live-example]'
  )) {
    const config = JSON.parse(root.dataset.liveExample!) as LiveConfig;
    root.querySelector('[data-live-copy]')?.addEventListener('click', event => {
      const button = event.currentTarget as HTMLElement;
      navigator.clipboard.writeText(config.files['src/main.ts']).then(
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
          tabs: ['src/main.ts', 'index.html'],
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
            void navigator.clipboard.writeText(playground.files['src/main.ts']);
          });
        root.dataset.ready = '';
      });
  }
}
