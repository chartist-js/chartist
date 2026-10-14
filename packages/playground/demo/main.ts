import {
  copyAction,
  createPlayground,
  createPreview,
  encodeShare,
  resetAction,
  shareAction,
  stackblitzAction,
  type PlaygroundFiles,
  type TransformerName
} from '../src/index.ts';

declare const __CHARTIST_VERSION__: string;

/** Example fixtures: `./examples/<id>/<file>` → content. */
const raw = import.meta.glob<string>(
  ['./examples/*/index.html', './examples/*/src/**'],
  { query: '?raw', import: 'default', eager: true }
);
const examples: Record<string, PlaygroundFiles> = {};
for (const [path, content] of Object.entries(raw)) {
  const [, id, file] = /^\.\/examples\/([^/]+)\/(.+)$/.exec(path)!;
  (examples[id] ??= {})[file] = content;
}
const titleOf = (id: string) =>
  /<title>(.*)<\/title>/.exec(examples[id]['index.html'])?.[1] ?? id;

const params = new URLSearchParams(location.search);
let current = params.get('example') ?? Object.keys(examples)[0];
const transformer = (params.get('transformer') ?? 'sucrase') as TransformerName;
const base = import.meta.env.BASE_URL;

const nav = document.getElementById('examples')!;
const select = document.getElementById('transformer') as HTMLSelectElement;
select.value = transformer;
select.addEventListener('change', () => {
  params.set('transformer', select.value);
  params.set('example', current);
  location.search = params.toString();
});

const metrics = document.body.dataset;
const host = document.getElementById('playground')!;

// ?mode=preview: only the preview component, no editor.
if (params.get('mode') === 'preview') {
  host.style.height = '400px';
  host.style.display = 'flex';
  const handle = createPreview(host, {
    files: examples[current],
    title: titleOf(current),
    transformer,
    chartistUrl: `${base}lib/chartist/index.js`,
    stylesUrl: `${base}lib/chartist/index.css`
  });
  handle.iframe.className = 'playground-preview';
  await handle.render();
  Object.assign(globalThis, { preview: handle });
} else {
  await startPlayground();
}

/** The playground, with the demo's example navigation. */
async function startPlayground() {
  // ?layout=full fills the viewport; ?actions=all shows every built-in action.
  const layout = params.get('layout') === 'full' ? 'full' : 'inline';
  if (layout === 'full') {
    host.style.height = '100vh';
  }
  const shareUrl = async (files: PlaygroundFiles, title: string) =>
    `${location.origin}${location.pathname}#code=${await encodeShare({ files, title })}`;
  const playground = await createPlayground(host, {
    layout,
    actions:
      params.get('actions') === 'all'
        ? [
            resetAction(),
            copyAction(),
            shareAction({ url: shareUrl }),
            stackblitzAction()
          ]
        : undefined,
    files: examples[current],
    title: titleOf(current),
    transformer,
    chartistUrl: `${base}lib/chartist/index.js`,
    stylesUrl: `${base}lib/chartist/index.css`,
    // ?types=off: plain editing.
    types: params.get('types') !== 'off' && { url: `${base}lib/chartist/` },
    chartistVersion: `^${__CHARTIST_VERSION__}`,
    onCompile: ({ time }) => {
      metrics.compileMs = time.toFixed(1);
    },
    onMessage: message => {
      if (message.type === 'ready' && !metrics.firstReadyMs) {
        metrics.firstReadyMs = performance.now().toFixed(0);
      }
    }
  });

  const renderNav = () => {
    nav.replaceChildren(
      ...Object.keys(examples).map(id => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = titleOf(id);
        button.dataset.example = id;
        button.setAttribute('aria-current', String(id === current));
        button.addEventListener('click', async () => {
          current = id;
          renderNav();
          history.replaceState(
            null,
            '',
            `?example=${id}&transformer=${transformer}`
          );
          await playground.setFiles(examples[id], titleOf(id));
        });
        return button;
      })
    );
  };
  renderNav();

  // For manual experiments in the devtools console.
  Object.assign(globalThis, { playground });
}
