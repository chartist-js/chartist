/**
 * Theme toggle. The theme itself is set before the first paint by the
 * inline script in BaseLayout; this only switches and saves it.
 */
const KEY = 'chartist-theme';

function current(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function initThemeToggle() {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '.theme-toggle'
  )) {
    button.setAttribute('aria-pressed', String(current() === 'dark'));
    button.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      button.setAttribute('aria-pressed', String(next === 'dark'));
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // Storage can be unavailable (private mode); the switch still works.
      }
    });
  }
}
