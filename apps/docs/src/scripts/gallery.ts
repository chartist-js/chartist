/**
 * The gallery: type filter chips, and live thumbnails that run each
 * example's own code in a sandboxed preview when it nears the viewport.
 */
import {
  FILL_FRAME,
  chartistUrl,
  imports,
  previewStyles,
  stylesUrl
} from './playground-env';

function mountFilter() {
  const chips = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-filter]')
  ];
  const groups = [...document.querySelectorAll<HTMLElement>('[data-group]')];
  const apply = (type: string) => {
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === type));
    }
    for (const group of groups) {
      group.hidden = type !== 'all' && group.dataset.group !== type;
    }
  };
  for (const chip of chips) {
    chip.addEventListener('click', () => apply(chip.dataset.filter!));
  }
  // A link to a section (`/examples/#bar`) opens with that type picked.
  const type = location.hash.slice(1);
  if (groups.some(group => group.dataset.group === type)) {
    apply(type);
  }
}

/**
 * The page's preview theme, with the chart filling the card. A thumbnail is
 * a picture: content taller than the frame is cut off, without a scrollbar.
 */
const thumbnailStyles = () => `${previewStyles()}${FILL_FRAME}
html, body { overflow: hidden; }
body { padding: 16px 20px; background: transparent; }`;

async function runThumbnail(stage: HTMLElement) {
  const { files, title } = JSON.parse(stage.dataset.galleryPreview!) as {
    files: Record<string, string>;
    title: string;
  };
  const { createPreview } = await import('@chartist/playground/preview');
  const preview = createPreview(stage, {
    files,
    title,
    chartistUrl,
    stylesUrl,
    imports,
    previewStyles: thumbnailStyles()
  });
  // A picture of the chart: the card is the link, the frame isn't a stop.
  // Drawn at 480 x 300 and scaled to the tile, so axis offsets and padding
  // (fixed pixel sizes in the examples) take their usual share, not most
  // of a small tile.
  preview.iframe.className =
    'pointer-events-none absolute top-0 left-0 h-[300px] w-[480px] origin-top-left border-0';
  const fit = () => {
    preview.iframe.style.transform = `scale(${stage.clientWidth / 480})`;
  };
  fit();
  new ResizeObserver(fit).observe(stage);
  preview.iframe.tabIndex = -1;
  preview.iframe.setAttribute('aria-hidden', 'true');
  await preview.render();
  new MutationObserver(() =>
    preview.setPreviewStyles(thumbnailStyles())
  ).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

/**
 * Runs the live thumbnails under a selector when they near the viewport.
 * Each stage carries the example's files and title as JSON.
 */
export function mountThumbnails(selector = '[data-gallery-preview]') {
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          void runThumbnail(entry.target as HTMLElement);
        }
      }
    },
    { rootMargin: '300px' }
  );
  for (const stage of document.querySelectorAll(selector)) {
    observer.observe(stage);
  }
}

export function mountGallery() {
  mountFilter();
  mountThumbnails();
}
