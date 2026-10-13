/** Swaps a live example's static code for the playground on "Edit". */
import chartistUrl from 'chartist/dist/index.min.js?url';
import stylesUrl from 'chartist/dist/index.min.css?url';

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
        const bar = document.createElement('div');
        bar.className = 'code-head live-toolbar';
        bar.innerHTML =
          '<span class="code-tab is-active">Editing</span>' +
          '<div class="live-actions">' +
          '<button class="btn sm" type="button" data-live-reset>Reset</button>' +
          '<button class="btn sm" type="button" data-live-copy-current>Copy</button>' +
          '</div>';
        const host = document.createElement('div');
        host.className = 'live-playground';
        root.replaceChildren(bar, host);
        root.classList.add('editing');
        const { createPlayground } = await import('@chartist/playground');
        const playground = await createPlayground(host, {
          files: config.files,
          title: config.title,
          tabs: ['src/main.ts', 'index.html'],
          chartistUrl: new URL(chartistUrl, location.href).href,
          stylesUrl: new URL(stylesUrl, location.href).href
        });
        bar
          .querySelector('[data-live-reset]')!
          .addEventListener('click', () => {
            void playground.setFiles(config.files, config.title);
          });
        bar
          .querySelector('[data-live-copy-current]')!
          .addEventListener('click', () => {
            void navigator.clipboard.writeText(playground.files['src/main.ts']);
          });
        root.dataset.ready = '';
      });
  }
}
