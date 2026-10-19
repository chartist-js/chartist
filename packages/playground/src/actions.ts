/**
 * Toolbar actions. A page passes the ones it wants (`actions` option), in
 * order; each renders a button in the playground's toolbar.
 */
import { openInStackblitz } from './stackblitz.ts';
import type { PlaygroundFiles } from './types.ts';

/** What an action can do with the playground it sits in. */
export interface PlaygroundContext {
  readonly files: PlaygroundFiles;
  readonly title: string;
  /** The file open in the editor. */
  readonly activeFile: string;
  /** Restores the files the playground was created (or last set) with. */
  reset(): Promise<void>;
}

export interface PlaygroundAction {
  label: string;
  /** Accessible name when the label isn't enough. */
  title?: string;
  run(playground: PlaygroundContext, button: HTMLButtonElement): unknown;
}

/** Shows `text` on the button for a moment, then restores its label. */
function flash(button: HTMLButtonElement, text: string) {
  const label = button.dataset.label ?? button.textContent ?? '';
  button.dataset.label = label;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = label;
  }, 1600);
}

export function resetAction(): PlaygroundAction {
  return { label: 'Reset', run: playground => playground.reset() };
}

/** Copies a file (by default the one open in the editor). */
export function copyAction(file?: string): PlaygroundAction {
  return {
    label: 'Copy',
    title: 'Copy the code',
    run: async (playground, button) => {
      const content = playground.files[file ?? playground.activeFile] ?? '';
      try {
        await navigator.clipboard.writeText(content);
        flash(button, 'Copied');
      } catch {
        flash(button, 'Copy failed');
      }
    }
  };
}

/** Copies an address for the current files, built by the page. */
export function shareAction(options: {
  url(files: PlaygroundFiles, title: string): string | Promise<string>;
}): PlaygroundAction {
  return {
    label: 'Share',
    title: 'Share a link to this code',
    run: async (playground, button) => {
      try {
        const url = await options.url(playground.files, playground.title);
        await navigator.clipboard.writeText(url);
        flash(button, 'Link copied');
      } catch {
        flash(button, 'Copy failed');
      }
    }
  };
}

/** Opens an address for the current files, e.g. a full-screen playground. */
export function openAction(options: {
  label?: string;
  url(files: PlaygroundFiles, title: string): string | Promise<string>;
  /** Open in a new tab instead of this one. */
  newTab?: boolean;
}): PlaygroundAction {
  return {
    label: options.label ?? 'Open in playground',
    run: async playground => {
      const url = await options.url(playground.files, playground.title);
      if (options.newTab) {
        window.open(url, '_blank', 'noopener');
      } else {
        location.assign(url);
      }
    }
  };
}

/** Exports the current files to StackBlitz as a Vite project. */
export function stackblitzAction(
  options: { label?: string; chartistVersion?: string } = {}
): PlaygroundAction {
  return {
    label: options.label ?? 'Open in StackBlitz',
    run: playground =>
      openInStackblitz(playground.files, {
        title: playground.title,
        chartistVersion: options.chartistVersion ?? 'latest'
      })
  };
}
