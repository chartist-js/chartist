/** Adds a copy button to every code block. */
const ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';

export function addCopyButtons() {
  for (const pre of document.querySelectorAll<HTMLPreElement>(
    'pre.astro-code'
  )) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-btn sm copy-btn';
    button.setAttribute('aria-label', 'Copy code');
    button.innerHTML = ICON;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(
          pre.querySelector('code')?.innerText ?? ''
        );
        button.setAttribute('aria-label', 'Copied');
        setTimeout(() => button.setAttribute('aria-label', 'Copy code'), 2000);
      } catch {
        button.setAttribute('aria-label', 'Copy failed');
      }
    });
    pre.append(button);
  }
}
