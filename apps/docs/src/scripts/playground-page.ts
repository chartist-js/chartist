/** The full-screen playground page (src/pages/playground.astro). */
import {
  copyAction,
  createPlayground,
  decodeShare,
  encodeShare,
  resetAction,
  shareAction,
  stackblitzAction,
  type Playground
} from '@chartist/playground';
import {
  FILL_FRAME,
  chartistUrl,
  imports,
  types,
  previewStyles,
  stylesUrl
} from './playground-env';

/** Some chat apps and mail clients cut links longer than this. */
const LONG_ADDRESS = 8000;

/** What opens without an address: a small line chart to start from. */
const BLANK = {
  title: 'My chart',
  files: {
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My chart</title>
    <script type="module" src="/src/main.ts"></script>
  </head>
  <body>
    <div id="chart" class="ct-golden-section"></div>
  </body>
</html>
`,
    'src/main.ts': `import 'chartist/styles.css';
import { lineChart } from 'chartist';

lineChart('#chart', {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
});
`
  }
};

interface Opened {
  files: Record<string, string>;
  title: string;
}

/** Reads what the address asks for; falls back to the blank chart. */
async function fromAddress(say: (text: string) => void): Promise<Opened> {
  const hash = new URLSearchParams(location.hash.slice(1));
  const code = hash.get('code');
  const example = hash.get('example');
  try {
    if (code) {
      const shared = await decodeShare(code);
      return { files: shared.files, title: shared.title ?? BLANK.title };
    }
    if (example && /^[a-z]+\/[a-z0-9-]+$/.test(example)) {
      const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
      const response = await fetch(`${base}examples/${example}.json`);
      if (!response.ok) {
        throw new Error(`There's no example "${example}".`);
      }
      return (await response.json()) as Opened;
    }
  } catch (error) {
    say(`${(error as Error).message} Here's a blank chart instead.`);
  }
  return BLANK;
}

/** The page's preview theme; the chart fills the preview frame. */
const frameStyles = () => `${previewStyles()}${FILL_FRAME}`;

export async function mountPlaygroundPage() {
  const host = document.querySelector<HTMLElement>('[data-playground-page]');
  const message = document.querySelector<HTMLElement>(
    '[data-playground-message]'
  );
  if (!host || !message) {
    return;
  }
  const say = (text: string) => {
    message.textContent = text;
    message.hidden = !text;
  };

  const codeAddress = async (files: Record<string, string>, title: string) =>
    `${location.origin}${location.pathname}#code=${await encodeShare({ files, title })}`;

  let opened = await fromAddress(say);
  // The address follows the edits (the playground debounces onChange).
  const follow = async (files: Record<string, string>) => {
    const address = await codeAddress(files, opened.title);
    history.replaceState(null, '', address);
    say(
      address.length > LONG_ADDRESS
        ? 'This link is long: some chat apps and mail clients cut links this size.'
        : ''
    );
  };

  // The UMD builds and the plugins load by names only this site's sandbox
  // knows (see playground-env), so StackBlitz couldn't run such code. The
  // polyfill and the @chartist-js packages are on npm, so they can.
  const siteNames = Object.keys(imports).filter(
    name => name !== 'match-container' && !name.startsWith('@chartist-js/')
  );
  const siteOnly = (files: Record<string, string>) =>
    Object.values(files).some(code =>
      siteNames.some(
        name => code.includes(`"${name}`) || code.includes(`'${name}`)
      )
    );

  const playground: Playground = await createPlayground(host, {
    files: opened.files,
    title: opened.title,
    layout: 'full',
    chartistUrl,
    stylesUrl,
    imports,
    types,
    previewStyles: frameStyles(),
    onChange: files => void follow(files),
    actions: [
      resetAction(),
      copyAction(),
      shareAction({ url: codeAddress }),
      ...(siteOnly(opened.files)
        ? []
        : [
            stackblitzAction({
              label: 'Export to StackBlitz',
              chartistVersion: host.dataset.chartistVersion
            })
          ])
    ]
  });
  document.title = `${opened.title} · Playground · Chartist`;

  // The preview follows the theme toggle.
  new MutationObserver(
    () => void playground.setPreviewStyles(frameStyles())
  ).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // Another address typed or pasted into this page.
  addEventListener('hashchange', async () => {
    say('');
    opened = await fromAddress(say);
    await playground.setFiles(opened.files, opened.title);
    document.title = `${opened.title} · Playground · Chartist`;
  });
}
