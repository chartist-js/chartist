// The minimal build is half the size of the full one (no TypeScript lexing,
// which isn't needed after type stripping).
import { init, parse } from 'es-module-lexer/minimal';
import { bootstrapScript } from './bootstrap.ts';
import { CompileError, loadTransformer } from './transformers.ts';
import type {
  CompileOptions,
  CompileResult,
  Diagnostic,
  PlaygroundFiles
} from './types.ts';

/** URL-like import map keys for example modules. */
const VIRTUAL = 'playground:/';
const CHARTIST_STYLES = 'chartist/styles.css';
const SCRIPT_EXT = /\.(ts|mts|js|mjs)$/;

interface Module {
  file: string;
  url: string;
}

interface State {
  files: PlaygroundFiles;
  modules: Map<string, Module>;
  /** Stylesheets in import order: `{ href }` or `{ file, css }`. */
  styles: Array<{ href: string } | { file: string; css: string }>;
  seenStyles: Set<string>;
  diagnostics: Diagnostic[];
}

/**
 * Compiles an example project (Vite vanilla-ts layout) into one HTML
 * document for a sandboxed iframe. See design D2 (add-playground-repl).
 */
export async function compile(
  files: PlaygroundFiles,
  options: CompileOptions
): Promise<CompileResult> {
  const start = now();
  const transform = await loadTransformer(options.transformer ?? 'sucrase');
  await init();

  const state: State = {
    files,
    modules: new Map(),
    styles: [],
    seenStyles: new Set(),
    diagnostics: []
  };
  const html = files['index.html'];
  if (html === undefined) {
    return {
      html: null,
      diagnostics: [{ file: 'index.html', message: 'index.html is missing' }],
      time: now() - start
    };
  }

  const compileModule = (file: string): string => {
    const known = state.modules.get(file);
    if (known) {
      return VIRTUAL + file;
    }
    // Registered before its imports, so import cycles terminate.
    const module: Module = { file, url: '' };
    state.modules.set(file, module);
    let code = files[file];
    if (file.endsWith('.ts') || file.endsWith('.mts')) {
      code = transform(code, file);
    }
    code = rewriteImports(code, file, state, compileModule);
    module.url =
      'data:text/javascript;charset=utf-8,' +
      encodeURIComponent(`${code}\n//# sourceURL=${file}`);
    return VIRTUAL + file;
  };

  let page: string;
  try {
    page = rewriteHtml(html, state, compileModule);
  } catch (error) {
    if (error instanceof CompileError) {
      state.diagnostics.push(error.diagnostic);
    } else {
      throw error;
    }
  }
  if (state.diagnostics.length) {
    return { html: null, diagnostics: state.diagnostics, time: now() - start };
  }

  const base = options.baseUrl ?? globalThis.document?.baseURI;
  const absolute = (url: string) => (base ? new URL(url, base).href : url);
  const importMap = {
    imports: {
      chartist: absolute(options.chartistUrl),
      // Next to the core build; compat.js imports ./index.js, so both
      // specifiers share one core instance.
      'chartist/compat': absolute(
        options.chartistUrl.replace(/[^/]*$/, 'compat.js')
      ),
      ...Object.fromEntries(
        Object.entries(options.imports ?? {}).map(([k, v]) => [k, absolute(v)])
      ),
      ...Object.fromEntries(
        [...state.modules.values()].map(m => [VIRTUAL + m.file, m.url])
      )
    }
  };
  const styles = state.styles
    .map(style =>
      'href' in style
        ? `<link rel="stylesheet" href="${escapeAttr(
            style.href === CHARTIST_STYLES
              ? absolute(options.stylesUrl)
              : style.href
          )}">`
        : `<style data-file="${escapeAttr(style.file)}">\n${style.css.replace(
            /<\/style/gi,
            '<\\/style'
          )}\n</style>`
    )
    .join('\n');
  const preview = options.previewStyles
    ? `<style data-preview>\n${options.previewStyles.replace(/<\/style/gi, '<\\/style')}\n</style>`
    : '';
  const head = [
    bootstrapScript(options.runId ?? ''),
    `<script type="importmap">${JSON.stringify(importMap).replace(
      /</g,
      '\\u003c'
    )}</script>`,
    preview,
    styles
  ].join('\n');

  return {
    html: injectHead(page!, head),
    diagnostics: [],
    time: now() - start
  };
}

/**
 * Rewrites import specifiers of one module:
 * CSS imports are removed and collected, relative module imports become
 * virtual specifiers, bare specifiers stay for the import map.
 */
function rewriteImports(
  code: string,
  file: string,
  state: State,
  compileModule: (file: string) => string
): string {
  let imports: ReturnType<typeof parse>[0];
  try {
    [imports] = parse(code, file);
  } catch (error) {
    const err = error as Error & { idx?: number };
    const at = err.idx !== undefined ? position(code, err.idx) : {};
    throw new CompileError({
      file,
      message: `Syntax error: ${err.message}`,
      ...at
    });
  }

  let output = '';
  let last = 0;
  for (const entry of imports) {
    // `import.meta` (d = -2), and dynamic imports with a computed argument.
    if (entry.d === -2 || entry.n === undefined) {
      continue;
    }
    const specifier = entry.n;
    const isDynamic = entry.d > -1;
    if (specifier.endsWith('.css') && !isDynamic) {
      // Static `import './style.css'`: remove the statement, add a stylesheet.
      addStyle(specifier, file, state, entry.s);
      output +=
        code.slice(last, entry.ss) + blank(code.slice(entry.ss, entry.se));
      last = entry.se;
      continue;
    }
    let replacement: string | undefined;
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      const target = resolve(file, specifier, state.files);
      if (!target) {
        throw new CompileError({
          file,
          message: `Cannot resolve import "${specifier}"`,
          ...position(code, entry.s)
        });
      }
      replacement = compileModule(target);
    }
    if (replacement !== undefined) {
      // Dynamic imports include the quotes in s..e, static ones don't.
      output +=
        code.slice(last, entry.s) +
        (isDynamic ? JSON.stringify(replacement) : replacement);
      last = entry.e;
    }
  }
  return output + code.slice(last);
}

function addStyle(specifier: string, from: string, state: State, at: number) {
  if (specifier === CHARTIST_STYLES) {
    if (!state.seenStyles.has(CHARTIST_STYLES)) {
      state.seenStyles.add(CHARTIST_STYLES);
      state.styles.push({ href: CHARTIST_STYLES });
    }
    return;
  }
  const target = resolve(from, specifier, state.files);
  if (!target) {
    throw new CompileError({
      file: from,
      message: `Cannot resolve stylesheet "${specifier}"`,
      ...position(state.files[from] ?? '', at)
    });
  }
  if (!state.seenStyles.has(target)) {
    state.seenStyles.add(target);
    state.styles.push({ file: target, css: state.files[target] });
  }
}

/** Resolves a relative or root-relative specifier to a file in the project. */
export function resolve(
  from: string,
  specifier: string,
  files: PlaygroundFiles
): string | undefined {
  const parts = specifier.startsWith('/') ? [] : from.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }
  const path = parts.join('/');
  const candidates = [
    path,
    // TypeScript-style `./data.js` for `data.ts`.
    path.replace(/\.js$/, '.ts'),
    `${path}.ts`,
    `${path}/index.ts`,
    `${path}.js`
  ];
  return candidates.find(candidate => candidate in files);
}

/**
 * Turns `<script type="module" src="/src/main.ts">` into an inline module
 * importing the virtual module, and `<link rel="stylesheet">` to a project
 * file into an inline style. Everything else stays as written.
 */
function rewriteHtml(
  html: string,
  state: State,
  compileModule: (file: string) => string
): string {
  let result = html.replace(
    /<script\b([^>]*)>\s*<\/script>/gi,
    (tag, attrs: string) => {
      const src = attribute(attrs, 'src');
      if (!src || !/\btype\s*=\s*["']?module/i.test(attrs)) {
        return tag;
      }
      const target = resolve('index.html', src, state.files);
      if (!target || !SCRIPT_EXT.test(target)) {
        return tag;
      }
      const specifier = compileModule(target);
      return `<script type="module">import ${JSON.stringify(specifier)};</script>`;
    }
  );
  result = result.replace(/<link\b([^>]*)>/gi, (tag, attrs: string) => {
    const href = attribute(attrs, 'href');
    if (!href || !/\brel\s*=\s*["']?stylesheet/i.test(attrs)) {
      return tag;
    }
    const target = resolve('index.html', href, state.files);
    return target
      ? `<style data-file="${escapeAttr(target)}">\n${state.files[target]}\n</style>`
      : tag;
  });
  return result;
}

function attribute(attrs: string, name: string): string | undefined {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i'
  ).exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

function injectHead(html: string, content: string): string {
  const head = /<head\b[^>]*>/i.exec(html);
  if (head) {
    const at = head.index + head[0].length;
    return `${html.slice(0, at)}\n${content}\n${html.slice(at)}`;
  }
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  const at = doctype ? doctype[0].length : 0;
  return `${html.slice(0, at)}\n${content}\n${html.slice(at)}`;
}

/** Replaces code with spaces, keeping line breaks (and so line numbers). */
function blank(code: string): string {
  return code.replace(/[^\n]/g, ' ');
}

function position(
  code: string,
  index: number
): { line: number; column: number } {
  const before = code.slice(0, index).split('\n');
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function now(): number {
  return globalThis.performance?.now() ?? Date.now();
}
