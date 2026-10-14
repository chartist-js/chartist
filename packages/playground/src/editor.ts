import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands';
import { syntaxHighlighting } from '@codemirror/language';
import { classHighlighter } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import type { PlaygroundFiles } from './types.ts';
import {
  editingExtensions,
  editingTheme,
  type TypeExtensionOptions
} from './types/extensions.ts';

export interface Editor {
  /** Shows a file. */
  open(file: string): void;
  destroy(): void;
}

/**
 * The editor's look, from the --pg-* custom properties (see playground.css).
 * A CodeMirror theme, because CodeMirror's own base styles are injected
 * unlayered at runtime and would win over any layered stylesheet.
 */
const theme = EditorView.theme({
  '&': {
    height: '100%',
    background: 'var(--pg-editor-bg, #fff)',
    color: 'var(--pg-editor-ink, #111)',
    fontSize: 'var(--pg-code-size, 14px)'
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'var(--pg-font-code, ui-monospace, monospace)',
    lineHeight: 'var(--pg-code-line-height, 1.5)'
  },
  '.cm-content': {
    caretColor: 'var(--pg-caret, var(--pg-accent, #333))',
    paddingBlock: '12px'
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--pg-caret, var(--pg-accent, #333))'
  },
  '.cm-gutters': {
    background: 'var(--pg-editor-bg, #fff)',
    color: 'var(--pg-gutter-ink, #999)',
    border: 'none'
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    background: 'var(--pg-active-line, #0000000a)'
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { background: 'var(--pg-selection, #b4d5fe)' }
});

/**
 * A minimal CodeMirror 6 editor (design D6): one state per file, swapped on
 * tab change, so undo history stays per file.
 */
export function createEditor(
  parent: HTMLElement,
  files: PlaygroundFiles,
  onChange: (file: string, content: string) => void,
  editing: TypeExtensionOptions = {}
): Editor {
  let current = '';
  const states = new Map<string, EditorState>();
  const view = new EditorView({ parent });

  const stateFor = (file: string) => {
    let state = states.get(file);
    if (!state) {
      state = EditorState.create({
        doc: files[file] ?? '',
        extensions: [
          theme,
          editingTheme,
          // The editing area is a textbox; name it after the file. It's in
          // the tab order anyway (contenteditable); the explicit tabindex
          // tells checkers the scrolling code is reachable by keyboard.
          EditorView.contentAttributes.of({
            'aria-label': `Code: ${file}`,
            tabindex: '0'
          }),
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          // Token classes (tok-keyword, tok-string, …), colored by CSS,
          // so a page can theme the editor (see playground.css).
          syntaxHighlighting(classHighlighter),
          language(file),
          // Completions; diagnostics and hover in TypeScript files.
          editingExtensions(file, editing),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              onChange(file, update.state.doc.toString());
            }
          })
        ]
      });
    }
    return state;
  };

  return {
    open(file) {
      if (current) {
        states.set(current, view.state);
      }
      current = file;
      view.setState(stateFor(file));
    },
    destroy() {
      view.destroy();
    }
  };
}

function language(file: string): Extension {
  if (file.endsWith('.html')) {
    return html();
  }
  if (file.endsWith('.css')) {
    return css();
  }
  return javascript({ typescript: file.endsWith('.ts') });
}
