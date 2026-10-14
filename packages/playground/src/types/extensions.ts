/**
 * CodeMirror extensions for type-aware editing: diagnostics,
 * completions and hover from the type worker, and CSS completions for the
 * stylesheet's custom properties.
 */
import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource
} from '@codemirror/autocomplete';
import { EditorState, StateEffect, type Extension } from '@codemirror/state';
import { EditorView, hoverTooltip, keymap } from '@codemirror/view';
import { linter, lintKeymap } from '@codemirror/lint';
import { localCompletionSource } from '@codemirror/lang-javascript';
import type { TypeClient } from './client.ts';

/** TypeScript element kinds → CodeMirror completion types (icons). */
const KINDS: Record<string, string> = {
  keyword: 'keyword',
  function: 'function',
  'local function': 'function',
  method: 'method',
  constructor: 'class',
  class: 'class',
  'local class': 'class',
  interface: 'interface',
  type: 'type',
  alias: 'type',
  enum: 'enum',
  'enum member': 'enum',
  module: 'namespace',
  'external module name': 'namespace',
  var: 'variable',
  'local var': 'variable',
  let: 'variable',
  const: 'constant',
  parameter: 'variable',
  property: 'property',
  getter: 'property',
  setter: 'property',
  string: 'text'
};

/** Dispatched when the type service is ready, so the linter runs again. */
const typesReady = StateEffect.define<null>();

/** A signature and its documentation, for the info panel and hover. */
function infoDom(signature: string, documentation: string): HTMLElement {
  const dom = document.createElement('div');
  dom.className = 'cm-pg-info';
  const code = document.createElement('pre');
  code.className = 'cm-pg-signature';
  code.textContent = signature;
  dom.append(code);
  if (documentation) {
    const text = document.createElement('div');
    text.className = 'cm-pg-doc';
    text.textContent = documentation;
    dom.append(text);
  }
  return dom;
}

function typeScriptSource(file: string, client: TypeClient): CompletionSource {
  return async (
    context: CompletionContext
  ): Promise<CompletionResult | null> => {
    if (!client.ready) {
      return localCompletionSource(context);
    }
    const word = context.matchBefore(/[\w$]*$/);
    const before = context.state.sliceDoc(
      Math.max(0, (word?.from ?? context.pos) - 1),
      word?.from ?? context.pos
    );
    const trigger = ['.', '"', "'", '`'].includes(before) ? before : undefined;
    if (!context.explicit && !word?.text && !trigger) {
      return null;
    }
    const text = context.state.doc.toString();
    const result = await client.completions(
      file,
      text,
      context.pos,
      word?.text ? undefined : trigger
    );
    if (!result || context.aborted) {
      return null;
    }
    // From the editor's text, which the answer is about. In strings, the
    // whole name: event names have ':' and '-' ('legend:click').
    const string = context.matchBefore(/['"`][\w:-]*$/);
    const from = string ? string.from + 1 : (word?.from ?? context.pos);
    return {
      from,
      validFor: string ? /^[\w:-]*$/ : /^[\w$]*$/,
      options: result.entries.map((entry): Completion => {
        const order = Number.parseInt(entry.sortText, 10);
        return {
          label: entry.name,
          apply: entry.insertText,
          type: KINDS[entry.kind] ?? 'text',
          // TypeScript ranks locals and members before globals.
          boost: Number.isNaN(order) ? 0 : Math.max(-99, 11 - order),
          info: async () => {
            const details = await client.completionDetails(
              file,
              text,
              context.pos,
              entry
            );
            return details
              ? infoDom(details.signature, details.documentation)
              : null;
          }
        };
      })
    };
  };
}

/** `--ct-*` and other custom properties of the Chartist stylesheet. */
const propertyNames = new Map<string, Promise<string[]>>();

function customPropertySource(stylesUrl: string): CompletionSource {
  return async context => {
    const word = context.matchBefore(/--[\w-]*$/);
    if (!word) {
      return null;
    }
    let names = propertyNames.get(stylesUrl);
    if (!names) {
      names = fetch(new URL(stylesUrl, document.baseURI))
        .then(response => (response.ok ? response.text() : ''))
        .then(css => [...new Set(css.match(/--ct-[\w-]+/g) ?? [])].sort())
        .catch(() => []);
      propertyNames.set(stylesUrl, names);
    }
    const options = (await names).map(name => ({
      label: name,
      type: 'variable'
    }));
    return options.length
      ? { from: word.from, options, validFor: /^--[\w-]*$/ }
      : null;
  };
}

export interface TypeExtensionOptions {
  /** The type client, for TypeScript files. */
  types?: TypeClient;
  /** The Chartist stylesheet, for custom property completions in CSS. */
  stylesUrl?: string;
}

/** Completions, and with a type client diagnostics and hover, for a file. */
export function editingExtensions(
  file: string,
  options: TypeExtensionOptions
): Extension[] {
  const { types } = options;
  if (file.endsWith('.ts') && types) {
    return [
      autocompletion({ override: [typeScriptSource(file, types)] }),
      linter(
        async view => {
          const doc = view.state.doc;
          const diagnostics = await types.diagnostics(file, doc.toString());
          // Edited since: the next run (after the edit) has the answer.
          return view.state.doc === doc
            ? diagnostics.map(({ from, to, severity, message }) => ({
                from: Math.min(from, doc.length),
                to: Math.min(to, doc.length),
                severity,
                message,
                source: 'TypeScript'
              }))
            : [];
        },
        {
          delay: 300,
          // forceLinting() only speeds up a scheduled run; this schedules one.
          needsRefresh: update =>
            update.transactions.some(tr =>
              tr.effects.some(effect => effect.is(typesReady))
            )
        }
      ),
      keymap.of(lintKeymap),
      hoverTooltip(
        async (view, position) => {
          const info = await types.quickInfo(
            file,
            view.state.doc.toString(),
            position
          );
          return info
            ? {
                pos: info.from,
                end: info.to,
                above: true,
                create: () => ({
                  dom: infoDom(info.signature, info.documentation)
                })
              }
            : null;
        },
        { hoverTime: 350 }
      ),
      // The worker starts the first time a TypeScript editor gets focus,
      // and checks the file as soon as it's ready.
      EditorView.updateListener.of(update => {
        if (update.focusChanged && update.view.hasFocus && !types.ready) {
          types.start();
          types.onReady(() =>
            update.view.dispatch({ effects: typesReady.of(null) })
          );
        }
      })
    ];
  }
  if (file.endsWith('.css') && options.stylesUrl) {
    // One source per editor: a new one per call would restart completion.
    const data = [{ autocomplete: customPropertySource(options.stylesUrl) }];
    return [autocompletion(), EditorState.languageData.of(() => data)];
  }
  return [autocompletion()];
}

/** Tooltips, the completion list and diagnostics, from --pg-* properties. */
export const editingTheme = EditorView.theme({
  '.cm-tooltip': {
    background: 'var(--pg-tooltip-bg, var(--pg-editor-bg, #fff))',
    color: 'var(--pg-editor-ink, #111)',
    border: 'var(--pg-tooltip-border, var(--pg-border, 1px solid #ccc))',
    borderRadius: 'var(--pg-tooltip-radius, 6px)',
    boxShadow: '0 4px 16px #0002',
    fontFamily: 'var(--pg-font, system-ui, sans-serif)',
    fontSize: '13px'
  },
  // Rounded itself: its info panel sits outside it, so the tooltip
  // can't clip.
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    borderRadius: 'var(--pg-tooltip-radius, 6px)',
    fontFamily: 'var(--pg-font-code, ui-monospace, monospace)',
    maxHeight: '16em'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '2px 8px'
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    background: 'var(--pg-selection, #b4d5fe)',
    color: 'inherit'
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: '700'
  },
  '.cm-completionIcon': { opacity: '0.7' },
  '.cm-tooltip.cm-completionInfo': {
    maxWidth: 'min(480px, 60vw)',
    padding: '0'
  },
  '.cm-pg-info': {
    maxWidth: 'min(560px, 80vw)',
    maxHeight: '18em',
    overflow: 'auto',
    padding: '6px 10px'
  },
  '.cm-pg-signature': {
    margin: '0',
    fontFamily: 'var(--pg-font-code, ui-monospace, monospace)',
    fontSize: 'var(--pg-code-size, 13px)',
    whiteSpace: 'pre-wrap'
  },
  '.cm-pg-doc': {
    marginTop: '6px',
    whiteSpace: 'pre-wrap',
    color: 'color-mix(in oklab, var(--pg-editor-ink, #111) 72%, transparent)'
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--pg-error, #b00020)',
    textDecorationSkipInk: 'none',
    textUnderlineOffset: '3px'
  },
  '.cm-lintRange-warning, .cm-lintRange-info': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--pg-warning, #b7791f)',
    textDecorationSkipInk: 'none',
    textUnderlineOffset: '3px'
  },
  '.cm-diagnostic': {
    padding: '4px 10px',
    whiteSpace: 'pre-wrap',
    fontFamily: 'var(--pg-font-code, ui-monospace, monospace)'
  },
  '.cm-diagnostic-error': {
    borderLeft: '3px solid var(--pg-error, #b00020)'
  },
  '.cm-diagnostic-warning, .cm-diagnostic-info': {
    borderLeft: '3px solid var(--pg-warning, #b7791f)'
  },
  '.cm-diagnosticSource': { display: 'none' },
  '.cm-panels': {
    background: 'var(--pg-editor-bg, #fff)',
    color: 'var(--pg-editor-ink, #111)'
  },
  '.cm-panels-bottom': {
    borderTop: '1px solid var(--pg-chrome-line, #ccc)'
  },
  '.cm-panel.cm-panel-lint ul [aria-selected]': {
    background: 'var(--pg-selection, #b4d5fe)',
    color: 'inherit'
  }
});
