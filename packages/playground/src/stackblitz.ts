import type { Project } from '@stackblitz/sdk';
import type { PlaygroundFiles } from './types.ts';

export interface StackblitzOptions {
  title: string;
  /**
   * npm version range of `chartist` in the generated package.json, and of
   * `@chartist-js/terminal` when the example imports it.
   */
  chartistVersion: string;
  description?: string;
}

/**
 * A Vite vanilla-ts project from the example files plus the files the
 * examples leave out (`package.json`, `tsconfig.json`), as in
 * `npm create vite -- --template vanilla-ts`.
 */
export function stackblitzProject(
  files: PlaygroundFiles,
  options: StackblitzOptions
): Project {
  const usesTerminal = Object.values(files).some(code =>
    /['"]@chartist-js\/terminal(?:\/[^'"]*)?['"]/.test(code)
  );
  const packageJson = {
    name: 'chartist-example',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview'
    },
    dependencies: {
      chartist: options.chartistVersion,
      // Released together with chartist, so at the same version.
      ...(usesTerminal
        ? { '@chartist-js/terminal': options.chartistVersion }
        : {})
    },
    devDependencies: {
      typescript: '~6.0.3',
      vite: '^8.3.1'
    }
  };
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      types: ['vite/client'],
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
      moduleDetection: 'force',
      noEmit: true,
      strict: true,
      erasableSyntaxOnly: true
    },
    include: ['src']
  };
  return {
    title: options.title,
    description: options.description,
    template: 'node',
    files: {
      ...files,
      'package.json': JSON.stringify(packageJson, null, 2) + '\n',
      'tsconfig.json': JSON.stringify(tsconfig, null, 2) + '\n'
    }
  };
}

/** Opens the files as a Vite project on stackblitz.com in a new tab. */
export async function openInStackblitz(
  files: PlaygroundFiles,
  options: StackblitzOptions
): Promise<void> {
  const { default: sdk } = await import('@stackblitz/sdk');
  sdk.openProject(stackblitzProject(files, options), {
    newWindow: true,
    openFile: 'src/main.ts'
  });
}
