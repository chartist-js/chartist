import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting
} from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import type { PlaygroundFiles } from './types.ts';

export interface Editor {
  /** Shows a file. */
  open(file: string): void;
  destroy(): void;
}

/**
 * A minimal CodeMirror 6 editor (design D6): one state per file, swapped on
 * tab change, so undo history stays per file.
 */
export function createEditor(
  parent: HTMLElement,
  files: PlaygroundFiles,
  onChange: (file: string, content: string) => void
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
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          syntaxHighlighting(defaultHighlightStyle),
          language(file),
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
