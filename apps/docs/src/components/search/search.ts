/**
 * The search dialog (polish-docs-site, design D1). Pagefind's index and
 * its `pagefind.js` load on the first open, never before. The input is a
 * combobox: arrow keys move through the results (aria-activedescendant),
 * Enter opens one, Escape closes the dialog and focus returns to the
 * header's search button.
 */

interface SubResult {
  title: string;
  url: string;
  excerpt: string;
  locations?: number[];
  weighted_locations?: { balanced_score: number }[];
}

interface ResultData {
  url: string;
  excerpt: string;
  meta: { title?: string };
  filters: { section?: string[] };
  sub_results: SubResult[];
}

interface Pagefind {
  options(options: Record<string, unknown>): Promise<void>;
  search(
    term: string
  ): Promise<{ results: { data(): Promise<ResultData> }[] } | null>;
}

const MAX_RESULTS = 15;
const DEBOUNCE = 150;
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

let pagefind: Promise<Pagefind> | undefined;

function loadPagefind(): Promise<Pagefind> {
  pagefind ??= import(/* @vite-ignore */ `${BASE}pagefind/pagefind.js`).then(
    async (module: Pagefind) => {
      // Short pages (an example with one call) shouldn't outrank the API
      // entry or the guide that explains a term.
      await module.options({ baseUrl: BASE, ranking: { pageLength: 0.3 } });
      return module;
    }
  );
  return pagefind;
}

/** The sub-result (heading section) with the most weight in its matches. */
function bestSubResult(data: ResultData): SubResult | undefined {
  let best: SubResult | undefined;
  let bestScore = -1;
  for (const sub of data.sub_results) {
    const score =
      sub.weighted_locations?.reduce(
        (sum, location) => sum + location.balanced_score,
        0
      ) ??
      sub.locations?.length ??
      0;
    if (score > bestScore) {
      best = sub;
      bestScore = score;
    }
  }
  return best;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
}

export function initSearch() {
  const dialog = document.querySelector<HTMLDialogElement>(
    '[data-search-dialog]'
  );
  const openers = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-search-open]')
  ];
  if (dialog && openers.length) {
    mount(dialog, openers);
  }
}

function mount(dialog: HTMLDialogElement, openers: HTMLButtonElement[]) {
  const part = <T extends HTMLElement>(name: string) =>
    dialog.querySelector(`[data-search-${name}]`) as T;
  const input = part<HTMLInputElement>('input');
  const list = part('results');
  const status = part('status');
  const intro = part('intro');
  const live = part('live');
  let opener: HTMLButtonElement = openers[0];
  let timer: number | undefined;
  let token = 0;

  // ⌘K on Apple devices, Ctrl K elsewhere.
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    for (const hint of document.querySelectorAll('[data-search-mod]')) {
      hint.textContent = '⌘';
    }
  }

  const options = () => [
    ...list.querySelectorAll<HTMLAnchorElement>('[role="option"]')
  ];

  function setActive(option: HTMLAnchorElement | undefined) {
    for (const other of options()) {
      other.setAttribute('aria-selected', String(other === option));
    }
    if (option) {
      input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function showStatus(message: string) {
    status.innerHTML = message;
    status.hidden = !message;
  }

  function clearResults() {
    list.replaceChildren();
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(undefined);
  }

  function render(results: ResultData[], term: string) {
    const groups = new Map<string, ResultData[]>();
    for (const result of results) {
      const section = result.filters.section?.[0] ?? 'Docs';
      groups.set(section, [...(groups.get(section) ?? []), result]);
    }
    let n = 0;
    const fragments = [...groups].map(([section, items]) => {
      const group = document.createElement('div');
      group.className = 'search-group';
      group.setAttribute('role', 'group');
      const labelId = `search-group-${section.toLowerCase()}`;
      group.setAttribute('aria-labelledby', labelId);
      group.innerHTML = `<div class="search-group-label" id="${labelId}" role="presentation">${escapeHtml(section)}</div>`;
      for (const result of items) {
        const sub = bestSubResult(result);
        const title = result.meta.title ?? result.url;
        const atTop = !sub || sub.url === result.url || sub.title === title;
        const option = document.createElement('a');
        option.className = 'search-option';
        option.id = `search-option-${n++}`;
        option.href = sub?.url ?? result.url;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.innerHTML = `<span class="search-option-title">${escapeHtml(title)}${
          atTop
            ? ''
            : `<span class="search-option-heading"><span aria-hidden="true"> › </span><span class="sr-only">, </span>${escapeHtml(sub.title)}</span>`
        }</span><span class="search-option-excerpt">${sub?.excerpt ?? result.excerpt}</span>`;
        group.append(option);
      }
      return group;
    });
    list.replaceChildren(...fragments);
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(undefined);
    showStatus('');
    announce(`${n} result${n === 1 ? '' : 's'} for ${term}`);
  }

  function announce(message: string) {
    live.textContent = message;
  }

  async function run(term: string) {
    const mine = ++token;
    if (!term) {
      clearResults();
      showStatus('');
      intro.hidden = false;
      announce('');
      return;
    }
    intro.hidden = true;
    let engine: Pagefind;
    try {
      engine = await loadPagefind();
    } catch {
      return unavailable();
    }
    const search = await engine.search(term);
    if (mine !== token || !search) {
      return;
    }
    const data = await Promise.all(
      search.results.slice(0, MAX_RESULTS).map(result => result.data())
    );
    if (mine !== token) {
      return;
    }
    if (!data.length) {
      clearResults();
      showStatus(
        `Nothing found for “${escapeHtml(term)}”. Try a function name like <code>lineChart</code>, an option like <code>showArea</code>, or a word from a guide.`
      );
      announce(`No results for ${term}`);
      return;
    }
    render(data, term);
  }

  function unavailable() {
    pagefind = undefined;
    clearResults();
    intro.hidden = true;
    showStatus(
      import.meta.env.DEV
        ? 'Search works in the built site. Run <code>pnpm nx build docs</code> once, and the dev server picks up its index.'
        : 'The search index didn’t load. Check your connection and try again.'
    );
  }

  function open(from?: HTMLButtonElement) {
    if (dialog.open) {
      input.focus();
      input.select();
      return;
    }
    opener =
      from ??
      openers.find(button => button.offsetParent !== null) ??
      openers[0];
    dialog.showModal();
    input.focus();
    input.select();
    // Starts loading the index now: typing comes next.
    loadPagefind().catch(unavailable);
  }

  for (const button of openers) {
    button.addEventListener('click', () => open(button));
  }

  document.addEventListener('keydown', event => {
    const target = event.target as HTMLElement | null;
    const editing = target?.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
    );
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault();
      open();
    } else if (
      event.key === '/' &&
      !editing &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !dialog.open
    ) {
      event.preventDefault();
      open();
    }
  });

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const term = input.value.trim();
    timer = window.setTimeout(() => run(term), term ? DEBOUNCE : 0);
  });

  input.addEventListener('keydown', event => {
    const all = options();
    const current = all.findIndex(
      option => option.getAttribute('aria-selected') === 'true'
    );
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!all.length) {
        return;
      }
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next =
        current < 0
          ? step > 0
            ? 0
            : all.length - 1
          : (current + step + all.length) % all.length;
      setActive(all[next]);
    } else if (event.key === 'Home' && all.length && current >= 0) {
      event.preventDefault();
      setActive(all[0]);
    } else if (event.key === 'End' && all.length && current >= 0) {
      event.preventDefault();
      setActive(all[all.length - 1]);
    } else if (event.key === 'Enter') {
      const option = all[current] ?? all[0];
      if (option) {
        event.preventDefault();
        go(option);
      }
    }
  });

  function go(option: HTMLAnchorElement) {
    const url = new URL(option.href, location.href);
    dialog.close();
    location.href = url.href;
  }

  list.addEventListener('mousemove', event => {
    const option = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      '[role="option"]'
    );
    if (option && option.getAttribute('aria-selected') !== 'true') {
      setActive(option);
    }
  });
  list.addEventListener('click', event => {
    const option = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      '[role="option"]'
    );
    // Same-page links (another API entry) don't reload: close first.
    if (
      option &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.button === 0
    ) {
      dialog.close();
    }
  });

  // Suggestions in the empty state fill in the input.
  dialog.addEventListener('click', event => {
    const suggestion = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-search-suggest]'
    );
    if (suggestion) {
      input.value = suggestion.textContent ?? '';
      input.dispatchEvent(new Event('input'));
      input.focus();
    }
    // A click on the backdrop (the dialog itself, outside the panel) closes.
    if (event.target === dialog) {
      dialog.close();
    }
  });
  dialog
    .querySelector('[data-search-close]')
    ?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('close', () => {
    opener.focus();
  });
}
